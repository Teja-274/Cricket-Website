#!/usr/bin/env python3
"""
Multi-tournament uploader for Scout India.
Usage:
    python upload_tournament.py SMAT
    python upload_tournament.py BBL PSL CPL          # multiple in sequence
    python upload_tournament.py ALL                  # SMAT, BBL, PSL, CPL, T20I

For each tournament folder under supabase/data/<tournament_lower>/:
  1. Upsert teams, venues, seasons (by name/year) — build name->id maps
  2. Upsert players (id is Cricsheet UUID, dedup natural)
  3. Transform matches/innings/pms (replace name strings with FK ids)
  4. Bulk POST deliveries (CSV stream) + wickets + pms with tournament tag
"""

import json
import csv
import os
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import quote

# Force UTF-8 stdout for Windows consoles (cp1252 can't print → ✓ etc.)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SUPABASE_URL = 'https://ejremkmgobdrjoapwwqq.supabase.co'

# Load service-role key from .env (bypasses RLS for ETL).
# Falls back to legacy anon key (which will hit RLS) if not set.
def _load_env_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if not os.path.exists(env_path):
        return None
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                return line.split('=', 1)[1].strip()
    return None

SERVICE_KEY = _load_env_key() or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcmVta21nb2JkcmpvYXB3d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODk1MzksImV4cCI6MjA5MDc2NTUzOX0.5uHkKhLn0TTucD1pEuxN-9ibfQh_-w5p6D2BgKap6O8'

if SERVICE_KEY.startswith('sb_secret_'):
    print('[upload] Using service_role key (RLS bypassed)')
else:
    print('[upload] WARNING: Using anon key — RLS may silently block inserts')

DATA_ROOT = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data')

BASE_HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
}


def http(method, path, body=None, extra_headers=None, timeout=60, retries=5):
    """Generic HTTP helper with transient-error retry. Returns (status, text)."""
    headers = dict(BASE_HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode('utf-8') if body is not None else None

    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(
            f'{SUPABASE_URL}{path}', data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode('utf-8')
        except urllib.error.HTTPError as e:
            # HTTP errors (4xx/5xx) are returned to caller — no retry except 5xx
            body_text = e.read().decode('utf-8')[:500] if e.fp else ''
            if e.code >= 500 and attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            return e.code, body_text
        except Exception as e:
            # Network/SSL/timeout — retry with backoff
            last_err = e
            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            return 599, f'NETWORK: {type(e).__name__}: {str(e)[:200]}'
    return 599, f'NETWORK_MAX_RETRIES: {last_err}'


def get_all(table, select='*'):
    """Fetch all rows from a table (paged for safety)."""
    rows = []
    offset = 0
    limit = 1000
    while True:
        path = f'/rest/v1/{table}?select={quote(select)}&limit={limit}&offset={offset}'
        status, text = http('GET', path)
        if status >= 400:
            print(f"  ERROR fetching {table}: {status} {text}")
            return rows
        chunk = json.loads(text)
        rows.extend(chunk)
        if len(chunk) < limit:
            break
        offset += limit
    return rows


def post(table, rows, on_conflict=None, prefer='return=minimal'):
    """POST rows. on_conflict=col → upsert. Returns (ok, error)."""
    if not rows:
        return True, ''
    path = f'/rest/v1/{table}'
    if on_conflict:
        path += f'?on_conflict={on_conflict}'
        prefer = f'{prefer},resolution=merge-duplicates'
    extra = {'Prefer': prefer}
    status, text = http('POST', path, body=rows, extra_headers=extra, timeout=120)
    if status < 300:
        return True, ''
    # 409 = real conflict (e.g. SERIAL out of sync), NOT something to silently swallow
    return False, f'HTTP {status}: {text[:300]}'


def batched(iterable, n):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= n:
            yield batch
            batch = []
    if batch:
        yield batch


# -------------------------------------------------------------------
# UPLOAD STAGES
# -------------------------------------------------------------------

def upload_teams(tournament_dir, existing_teams_by_name):
    """Upsert teams; return updated name->id map."""
    path = os.path.join(tournament_dir, 'teams.json')
    if not os.path.exists(path):
        return existing_teams_by_name
    with open(path, 'r', encoding='utf-8') as f:
        teams = json.load(f)

    new_teams = [t for t in teams if t['name'] not in existing_teams_by_name]
    if new_teams:
        print(f"  Upserting {len(new_teams)} new teams...")
        rows = [{
            'name': t['name'],
            'short_name': t['short_name'],
            'color': t['color'],
            'is_active': t['is_active'],
            'historical_names': t.get('historical_names', []),
        } for t in new_teams]
        ok, err = post('teams', rows, on_conflict='name')
        if not ok:
            print(f"  WARN teams: {err}")

    # Refresh name->id map
    all_teams = get_all('teams', 'id,name')
    return {t['name']: t['id'] for t in all_teams}


def upload_venues(tournament_dir, existing_venues_by_name):
    path = os.path.join(tournament_dir, 'venues.json')
    if not os.path.exists(path):
        return existing_venues_by_name
    with open(path, 'r', encoding='utf-8') as f:
        venues = json.load(f)

    new_venues = [v for v in venues if v['name'] not in existing_venues_by_name]
    if new_venues:
        print(f"  Upserting {len(new_venues)} new venues...")
        rows = [{
            'name': v['name'],
            'city': v['city'],
            'raw_names': v.get('raw_names', []),
        } for v in new_venues]
        ok, err = post('venues', rows, on_conflict='name')
        if not ok:
            print(f"  WARN venues: {err}")

    all_venues = get_all('venues', 'id,name')
    return {v['name']: v['id'] for v in all_venues}


def upload_seasons(tournament_dir, existing_seasons_by_year):
    path = os.path.join(tournament_dir, 'seasons.json')
    if not os.path.exists(path):
        return existing_seasons_by_year
    with open(path, 'r', encoding='utf-8') as f:
        seasons = json.load(f)

    new_seasons = [s for s in seasons if s['year'] not in existing_seasons_by_year]
    if new_seasons:
        print(f"  Upserting {len(new_seasons)} new seasons...")
        rows = [{'year': s['year'], 'raw_label': s['raw_label']} for s in new_seasons]
        ok, err = post('seasons', rows, on_conflict='year')
        if not ok:
            print(f"  WARN seasons: {err}")

    all_seasons = get_all('seasons', 'id,year')
    return {s['year']: s['id'] for s in all_seasons}


def upload_players(tournament_dir):
    path = os.path.join(tournament_dir, 'players.json')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        players = json.load(f)
    print(f"  Upserting {len(players)} players...")

    rows = [{
        'id': p['id'],
        'name': p['name'],
        'short_name': p['short_name'],
    } for p in players]

    total = 0
    for batch in batched(rows, 500):
        ok, err = post('players', batch, on_conflict='id')
        total += len(batch)
        if not ok:
            print(f"    WARN players batch at {total}: {err}")
    print(f"    {total} players upserted")


def upload_matches(tournament_dir, tournament_code, teams_map, venues_map, seasons_map):
    path = os.path.join(tournament_dir, 'matches.json')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        matches = json.load(f)
    print(f"  Uploading {len(matches)} matches...")

    rows = []
    skipped = 0
    for m in matches:
        team1_id = teams_map.get(m.get('team1'))
        team2_id = teams_map.get(m.get('team2'))
        venue_id = venues_map.get(m.get('venue'))
        season_id = seasons_map.get(m.get('season_year'))
        if not (team1_id and team2_id and season_id):
            skipped += 1
            continue
        rows.append({
            'id': m['id'],
            'season_id': season_id,
            'date': m.get('date') or None,
            'venue_id': venue_id,
            'team1_id': team1_id,
            'team2_id': team2_id,
            'toss_winner_id': teams_map.get(m.get('toss_winner')),
            'toss_decision': m.get('toss_decision') or None,
            'winner_id': teams_map.get(m.get('winner')) if m.get('winner') else None,
            'win_by_runs': m.get('win_by_runs'),
            'win_by_wickets': m.get('win_by_wickets'),
            'player_of_match': m.get('player_of_match'),
            'stage': m.get('stage') or 'league',
            'team1_score': m.get('team1_score'),
            'team1_wickets': m.get('team1_wickets'),
            'team1_overs': m.get('team1_overs'),
            'team2_score': m.get('team2_score'),
            'team2_wickets': m.get('team2_wickets'),
            'team2_overs': m.get('team2_overs'),
            'tournament': tournament_code,
        })

    if skipped:
        print(f"    Skipped {skipped} matches (missing team/season lookup)")

    total = 0
    for batch in batched(rows, 200):
        ok, err = post('matches', batch, on_conflict='id')
        total += len(batch)
        if not ok:
            print(f"    WARN matches batch at {total}: {err}")
    print(f"    {total} matches uploaded")


def upload_innings(tournament_dir, tournament_code, teams_map):
    path = os.path.join(tournament_dir, 'innings.json')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        innings = json.load(f)
    print(f"  Uploading {len(innings)} innings...")

    rows = []
    for inn in innings:
        bt = teams_map.get(inn.get('batting_team'))
        ot = teams_map.get(inn.get('bowling_team'))
        rows.append({
            'id': inn['id'],
            'match_id': inn['match_id'],
            'innings_number': inn['innings_number'],
            'batting_team_id': bt,
            'bowling_team_id': ot,
            'total_runs': inn.get('total_runs', 0),
            'total_wickets': inn.get('total_wickets', 0),
            'total_overs': inn.get('total_overs', 0),
            'target_runs': inn.get('target_runs'),
            'is_super_over': inn.get('is_super_over', False),
            'tournament': tournament_code,
        })

    total = 0
    for batch in batched(rows, 500):
        ok, err = post('innings', batch)
        total += len(batch)
        if not ok:
            print(f"    WARN innings batch at {total}: {err}")
    print(f"    {total} innings uploaded")


def upload_deliveries(tournament_dir, tournament_code):
    path = os.path.join(tournament_dir, 'deliveries.csv')
    if not os.path.exists(path):
        return

    # Pre-count for progress
    with open(path, 'r', encoding='utf-8') as f:
        total_rows = sum(1 for _ in f) - 1
    print(f"  Uploading {total_rows:,} deliveries...")

    batch_size = 500
    batch = []
    total = 0
    failed = 0
    start = time.time()

    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            batch.append({
                'id': int(row['id']),
                'innings_id': int(row['innings_id']),
                'match_id': row['match_id'],
                'over_number': int(row['over_number']),
                'ball_number': int(row['ball_number']),
                'phase': row['phase'],
                'batter_id': row['batter_id'],
                'bowler_id': row['bowler_id'],
                'non_striker_id': row['non_striker_id'],
                'batter_runs': int(row['batter_runs']),
                'extra_runs': int(row['extra_runs']),
                'total_runs': int(row['total_runs']),
                'extra_type': row['extra_type'] if row['extra_type'] else None,
                'is_legal': row['is_legal'] == 'True',
                'is_boundary': row['is_boundary'] == 'True',
                'is_dot': row['is_dot'] == 'True',
                'tournament': tournament_code,
            })

            if len(batch) >= batch_size:
                ok, err = post('deliveries', batch)
                total += len(batch)
                if not ok:
                    failed += 1
                    print(f"    Error at row {total}: {err}")
                    if failed > 20:
                        print("    Too many errors, stopping.")
                        return total
                batch = []

                if total % 10000 == 0:
                    elapsed = time.time() - start
                    rate = total / elapsed if elapsed > 0 else 0
                    eta = (total_rows - total) / rate if rate > 0 else 0
                    print(f"    {total:,} / {total_rows:,} ({total*100//total_rows}%)  {rate:.0f} rows/s  ETA {eta:.0f}s")

    if batch:
        ok, err = post('deliveries', batch)
        total += len(batch)
        if not ok:
            print(f"    Error final batch: {err}")

    print(f"    {total:,} deliveries uploaded ({failed} batch errors)")


def upload_wickets(tournament_dir, tournament_code):
    path = os.path.join(tournament_dir, 'wickets.json')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        wickets = json.load(f)
    print(f"  Uploading {len(wickets):,} wickets...")

    rows = [{
        'id': w['id'],
        'delivery_id': w['delivery_id'],
        'match_id': w['match_id'],
        'innings_id': w['innings_id'],
        'batter_id': w['batter_id'],
        'bowler_id': w['bowler_id'],
        'fielder_id': w['fielder_id'],
        'kind': w['kind'],
        'is_bowler_wicket': w['is_bowler_wicket'],
        'tournament': tournament_code,
    } for w in wickets]

    total = 0
    for batch in batched(rows, 500):
        ok, err = post('wickets', batch)
        total += len(batch)
        if not ok:
            print(f"    WARN wickets batch at {total}: {err}")
    print(f"    {total:,} wickets uploaded")


def upload_pms(tournament_dir, tournament_code, teams_map, seasons_map):
    path = os.path.join(tournament_dir, 'player_match_stats.json')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        pms = json.load(f)
    print(f"  Uploading {len(pms):,} player_match_stats...")

    rows = []
    skipped = 0
    for s in pms:
        team_id = teams_map.get(s.get('team'))
        season_id = seasons_map.get(s.get('season_year'))
        if not team_id or not season_id:
            skipped += 1
            continue
        rows.append({
            'match_id': s['match_id'],
            'player_id': s['player_id'],
            'team_id': team_id,
            'season_id': season_id,
            'runs_scored': s.get('runs_scored', 0),
            'balls_faced': s.get('balls_faced', 0),
            'fours': s.get('fours', 0),
            'sixes': s.get('sixes', 0),
            'is_not_out': s.get('is_not_out', True),
            'dismissal_kind': s.get('dismissal_kind'),
            'overs_bowled': s.get('overs_bowled', 0),
            'runs_conceded': s.get('runs_conceded', 0),
            'wickets_taken': s.get('wickets_taken', 0),
            'dots_bowled': s.get('dots_bowled', 0),
            'extras_conceded': s.get('extras_conceded', 0),
            'catches': s.get('catches', 0),
            'run_outs': s.get('run_outs', 0),
            'stumpings': s.get('stumpings', 0),
            'tournament': tournament_code,
        })

    if skipped:
        print(f"    Skipped {skipped} rows (team/season lookup missing)")

    total = 0
    for batch in batched(rows, 500):
        ok, err = post('player_match_stats', batch, on_conflict='match_id,player_id')
        total += len(batch)
        if not ok:
            print(f"    WARN pms batch at {total}: {err}")
    print(f"    {total:,} pms rows uploaded")


# -------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------

def upload_one(tournament_code):
    code = tournament_code.upper()
    tournament_dir = os.path.join(DATA_ROOT, code.lower())
    if not os.path.isdir(tournament_dir):
        print(f"ERROR: {tournament_dir} does not exist. Run clean_tournament.py first.")
        return

    print(f"\n{'='*60}\nUPLOADING {code} → {tournament_dir}\n{'='*60}")

    # Build ref maps from CURRENT DB state (across all tournaments)
    print("  Loading existing teams/venues/seasons from DB...")
    teams_map = {t['name']: t['id'] for t in get_all('teams', 'id,name')}
    venues_map = {v['name']: v['id'] for v in get_all('venues', 'id,name')}
    seasons_map = {s['year']: s['id'] for s in get_all('seasons', 'id,year')}
    print(f"    Teams: {len(teams_map)} | Venues: {len(venues_map)} | Seasons: {len(seasons_map)}")

    teams_map = upload_teams(tournament_dir, teams_map)
    venues_map = upload_venues(tournament_dir, venues_map)
    seasons_map = upload_seasons(tournament_dir, seasons_map)

    upload_players(tournament_dir)
    upload_matches(tournament_dir, code, teams_map, venues_map, seasons_map)
    upload_innings(tournament_dir, code, teams_map)
    upload_deliveries(tournament_dir, code)
    upload_wickets(tournament_dir, code)
    upload_pms(tournament_dir, code, teams_map, seasons_map)

    print(f"\n  ✓ {code} complete")


def main():
    if len(sys.argv) < 2:
        print("Usage: python upload_tournament.py <CODE> [<CODE>...]")
        print("       python upload_tournament.py ALL")
        sys.exit(1)

    args = [a.upper() for a in sys.argv[1:]]
    if args == ['ALL']:
        args = ['SMAT', 'BBL', 'PSL', 'CPL', 'T20I']

    for code in args:
        upload_one(code)

    print("\nAll tournaments uploaded.")


if __name__ == '__main__':
    main()
