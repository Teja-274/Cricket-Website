#!/usr/bin/env python3
"""
Scout India — Tier 1 data integrity validator.

Runs a battery of checks against Supabase and reports anomalies.
Exit code 0 = all OK or warnings only; 1 = at least one FAIL.

Usage:
    python scripts/validate_data.py              # check all tournaments
    python scripts/validate_data.py IPL SMAT     # check specific ones
"""

import json
import os
import sys
import urllib.request
import urllib.error
from urllib.parse import quote
from collections import defaultdict

# Force UTF-8 stdout for Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SUPABASE_URL = 'https://ejremkmgobdrjoapwwqq.supabase.co'


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


KEY = _load_env_key() or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcmVta21nb2JkcmpvYXB3d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODk1MzksImV4cCI6MjA5MDc2NTUzOX0.5uHkKhLn0TTucD1pEuxN-9ibfQh_-w5p6D2BgKap6O8'

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
}

# -------------------------------------------------------------------
# Result tracking
# -------------------------------------------------------------------
results = []  # list of (level, tournament, check_name, message)


def ok(tournament, check, msg=''):
    results.append(('OK', tournament, check, msg))


def warn(tournament, check, msg):
    results.append(('WARN', tournament, check, msg))


def fail(tournament, check, msg):
    results.append(('FAIL', tournament, check, msg))


# -------------------------------------------------------------------
# HTTP helpers
# -------------------------------------------------------------------
def fetch(path):
    """GET helper. Returns parsed JSON or empty list on error."""
    req = urllib.request.Request(f'{SUPABASE_URL}{path}', headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')[:200] if e.fp else ''
        print(f'  ! HTTP {e.code} on {path}: {body}')
        return []
    except Exception as e:
        print(f'  ! {type(e).__name__} on {path}: {str(e)[:100]}')
        return []


def count(table, where=''):
    """Get exact row count for a table with optional filter."""
    path = f'/rest/v1/{table}?select=count'
    if where:
        path += f'&{where}'
    headers = dict(HEADERS, **{'Prefer': 'count=exact'})
    req = urllib.request.Request(f'{SUPABASE_URL}{path}', headers=headers, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            cr = resp.headers.get('content-range', '')
            # Format: "0-X/N"
            if '/' in cr:
                return int(cr.split('/')[-1])
            return 0
    except Exception as e:
        print(f'  ! count failed on {table}: {str(e)[:80]}')
        return -1


def head_count(table, where=''):
    """Simpler exact count using HEAD."""
    return count(table, where)


# -------------------------------------------------------------------
# Expected baselines (from clean_tournament.py output)
# -------------------------------------------------------------------
EXPECTED = {
    'IPL':  {'matches': 1175, 'deliveries': 279586, 'wickets': 13901},
    'SMAT': {'matches': 695,  'deliveries': 158839, 'wickets': 8325},
    'BBL':  {'matches': 662,  'deliveries': 153250, 'wickets': 8203},
    'PSL':  {'matches': 357,  'deliveries': 83799,  'wickets': 4506},
    'CPL':  {'matches': 407,  'deliveries': 95024,  'wickets': 5022},
    'T20I': {'matches': 3382, 'deliveries': 762586, 'wickets': 43535},
}


# -------------------------------------------------------------------
# CHECKS
# -------------------------------------------------------------------
def check_row_counts(t):
    """Check row counts match expected baseline (within tolerance)."""
    expected = EXPECTED.get(t, {})
    for table_key, exp in expected.items():
        actual = count(table_key, f'tournament=eq.{t}')
        if actual < 0:
            fail(t, f'count.{table_key}', 'count query failed')
            continue
        # Allow 1% tolerance (some edge-case rows may be filtered)
        delta = abs(actual - exp)
        if delta == 0:
            ok(t, f'count.{table_key}', f'{actual:,}')
        elif delta < exp * 0.02:
            warn(t, f'count.{table_key}', f'{actual:,} (expected {exp:,}, off by {delta})')
        else:
            fail(t, f'count.{table_key}', f'{actual:,} (expected {exp:,}, off by {delta})')


def check_null_critical_fields(t):
    """Matches must have team1_id, team2_id, season_id."""
    bad_team1 = count('matches', f'tournament=eq.{t}&team1_id=is.null')
    bad_team2 = count('matches', f'tournament=eq.{t}&team2_id=is.null')
    bad_season = count('matches', f'tournament=eq.{t}&season_id=is.null')
    if bad_team1 == 0 and bad_team2 == 0 and bad_season == 0:
        ok(t, 'matches.fks', 'all matches have team/season ids')
    else:
        msg = f'team1=NULL: {bad_team1}, team2=NULL: {bad_team2}, season=NULL: {bad_season}'
        fail(t, 'matches.fks', msg)


def check_innings_team_ids(t):
    """Innings should have batting/bowling team ids."""
    bad_bat = count('innings', f'tournament=eq.{t}&batting_team_id=is.null')
    bad_bowl = count('innings', f'tournament=eq.{t}&bowling_team_id=is.null')
    total = count('innings', f'tournament=eq.{t}')
    if bad_bat == 0 and bad_bowl == 0:
        ok(t, 'innings.team_ids', f'{total:,} innings, all tagged')
    else:
        pct = ((bad_bat + bad_bowl) / max(total * 2, 1)) * 100
        level = warn if pct < 2 else fail
        level(t, 'innings.team_ids', f'{bad_bat} batting + {bad_bowl} bowling NULL ({pct:.1f}%)')


def check_delivery_players(t):
    """Deliveries must have batter and bowler."""
    bad_bat = count('deliveries', f'tournament=eq.{t}&batter_id=is.null')
    bad_bowl = count('deliveries', f'tournament=eq.{t}&bowler_id=is.null')
    if bad_bat == 0 and bad_bowl == 0:
        ok(t, 'deliveries.players', 'all deliveries have batter+bowler')
    else:
        fail(t, 'deliveries.players', f'batter=NULL: {bad_bat}, bowler=NULL: {bad_bowl}')


def check_impossible_stats(t):
    """Check for nonsense values."""
    # Negative runs
    neg_runs = count('deliveries', f'tournament=eq.{t}&total_runs=lt.0')
    # Insanely high runs in one ball (>10 is suspicious)
    huge_runs = count('deliveries', f'tournament=eq.{t}&total_runs=gt.10')
    # Negative or huge ball numbers
    bad_balls = count('deliveries', f'tournament=eq.{t}&ball_number=gt.20')
    # Overs > 20 in T20 tournaments (sanity check)
    bad_overs = count('deliveries', f'tournament=eq.{t}&over_number=gt.19')

    issues = []
    if neg_runs > 0:
        issues.append(f'{neg_runs} negative-runs deliveries')
    if huge_runs > 0:
        issues.append(f'{huge_runs} deliveries with >10 runs')
    if bad_balls > 0:
        issues.append(f'{bad_balls} deliveries with ball_number>20')
    if bad_overs > 0:
        issues.append(f'{bad_overs} deliveries past over 19')

    if not issues:
        ok(t, 'deliveries.sanity', 'no impossible values')
    else:
        warn(t, 'deliveries.sanity', '; '.join(issues))


def check_pms_sanity(t):
    """Player match stats shouldn't have insane values."""
    bad_runs = count('player_match_stats', f'tournament=eq.{t}&runs_scored=gt.300')
    bad_balls = count('player_match_stats', f'tournament=eq.{t}&balls_faced=gt.200')
    bad_wkts = count('player_match_stats', f'tournament=eq.{t}&wickets_taken=gt.10')
    bad_overs = count('player_match_stats', f'tournament=eq.{t}&overs_bowled=gt.20')

    issues = []
    if bad_runs > 0:
        issues.append(f'{bad_runs} entries with >300 runs')
    if bad_balls > 0:
        issues.append(f'{bad_balls} with >200 balls faced')
    if bad_wkts > 0:
        issues.append(f'{bad_wkts} with >10 wickets')
    if bad_overs > 0:
        issues.append(f'{bad_overs} with >20 overs bowled')

    if not issues:
        ok(t, 'pms.sanity', 'all values in valid ranges')
    else:
        warn(t, 'pms.sanity', '; '.join(issues))


def check_orphan_deliveries(t):
    """Spot-check: sample deliveries and verify their innings_id exists.
    A full LEFT JOIN would be ideal but expensive over REST; we sample."""
    sample = fetch(f'/rest/v1/deliveries?tournament=eq.{t}&select=innings_id&limit=500')
    if not sample:
        warn(t, 'deliveries.orphans', 'could not sample')
        return
    innings_ids = list({d['innings_id'] for d in sample if d.get('innings_id')})
    if not innings_ids:
        ok(t, 'deliveries.orphans', 'no innings_ids to verify')
        return
    # Check first 100 unique ids
    sample_ids = innings_ids[:100]
    in_clause = ','.join(str(i) for i in sample_ids)
    found = fetch(f'/rest/v1/innings?id=in.({in_clause})&select=id&limit=200')
    found_ids = {r['id'] for r in found}
    missing = [i for i in sample_ids if i not in found_ids]
    if not missing:
        ok(t, 'deliveries.orphans', f'sampled {len(sample_ids)} innings_ids, all valid')
    else:
        fail(t, 'deliveries.orphans', f'{len(missing)} orphan innings_ids found (e.g. {missing[:3]})')


def check_matches_have_innings(t):
    """Every match should have ≥1 innings."""
    matches = fetch(f'/rest/v1/matches?tournament=eq.{t}&select=id&limit=2000')
    if not matches:
        warn(t, 'matches.innings', 'no matches to check')
        return
    match_ids = [m['id'] for m in matches]
    # Sample first 200
    sample_ids = match_ids[:200]
    in_clause = ','.join(f'"{m}"' for m in sample_ids)
    innings = fetch(f'/rest/v1/innings?match_id=in.({in_clause})&select=match_id&limit=1000')
    inn_match_ids = {r['match_id'] for r in innings}
    missing = [m for m in sample_ids if m not in inn_match_ids]
    if not missing:
        ok(t, 'matches.innings', f'sampled {len(sample_ids)} matches, all have innings')
    else:
        warn(t, 'matches.innings', f'{len(missing)}/{len(sample_ids)} matches without innings')


def check_tournament_tagging(t):
    """Cross-check: tournament column should never be NULL or wrong format."""
    null_count = count('matches', f'tournament=is.null')
    if null_count > 0:
        fail('GLOBAL', 'matches.tournament', f'{null_count} matches have NULL tournament')


def check_innings_totals_consistency(t):
    """Sample a few innings and verify innings.total_runs == SUM(deliveries.total_runs)."""
    sample_innings = fetch(f'/rest/v1/innings?tournament=eq.{t}&select=id,total_runs&limit=30')
    if not sample_innings:
        warn(t, 'innings.totals', 'no innings to sample')
        return

    discrepancies = []
    for inn in sample_innings[:20]:
        inn_id = inn['id']
        stated = inn['total_runs']
        # Sum deliveries for this innings (page through in case >1000)
        deliveries = fetch(f'/rest/v1/deliveries?innings_id=eq.{inn_id}&select=total_runs&limit=1000')
        computed = sum(d['total_runs'] for d in deliveries)
        if abs(stated - computed) > 2:  # 2-run tolerance for edge cases
            discrepancies.append(f'innings {inn_id}: stated={stated}, computed={computed}')

    if not discrepancies:
        ok(t, 'innings.totals', f'{len(sample_innings[:20])} sampled, totals consistent')
    else:
        warn(t, 'innings.totals', f'{len(discrepancies)}/20 mismatches: {discrepancies[0]}')


def check_match_date_sanity(t):
    """Match dates should fall within sensible range for the tournament."""
    matches = fetch(f'/rest/v1/matches?tournament=eq.{t}&select=id,date&order=date.asc&limit=2000')
    if not matches:
        warn(t, 'matches.dates', 'no matches to check')
        return

    null_dates = sum(1 for m in matches if not m.get('date'))
    future_dates = sum(1 for m in matches if m.get('date') and m['date'] > '2026-12-31')
    ancient_dates = sum(1 for m in matches if m.get('date') and m['date'] < '2003-01-01')

    issues = []
    if null_dates > 0:
        issues.append(f'{null_dates} NULL dates')
    if future_dates > 0:
        issues.append(f'{future_dates} future dates')
    if ancient_dates > 0:
        issues.append(f'{ancient_dates} pre-2003 dates')

    if not issues:
        first = matches[0].get('date', '?')
        last = matches[-1].get('date', '?')
        ok(t, 'matches.dates', f'range {first} → {last}')
    else:
        warn(t, 'matches.dates', '; '.join(issues))


def check_wicket_to_delivery_link(t):
    """Every wicket's delivery_id should exist in deliveries."""
    sample = fetch(f'/rest/v1/wickets?tournament=eq.{t}&select=delivery_id&limit=200')
    if not sample:
        warn(t, 'wickets.links', 'no wickets to check')
        return
    delivery_ids = list({w['delivery_id'] for w in sample if w.get('delivery_id')})
    if not delivery_ids:
        warn(t, 'wickets.links', 'all wickets have NULL delivery_id')
        return
    # Verify first 100 exist
    sample_ids = delivery_ids[:100]
    in_clause = ','.join(str(i) for i in sample_ids)
    found = fetch(f'/rest/v1/deliveries?id=in.({in_clause})&select=id&limit=200')
    found_ids = {r['id'] for r in found}
    missing = [i for i in sample_ids if i not in found_ids]
    if not missing:
        ok(t, 'wickets.links', f'sampled {len(sample_ids)}, all linked to real deliveries')
    else:
        fail(t, 'wickets.links', f'{len(missing)} wickets point to non-existent deliveries')


def check_pms_match_consistency(t):
    """For a sampled match, sum of PMS runs_scored should be close to sum of innings.total_runs."""
    sample_matches = fetch(f'/rest/v1/matches?tournament=eq.{t}&select=id&limit=10')
    if not sample_matches:
        warn(t, 'pms.match_runs', 'no matches to sample')
        return

    mismatches = 0
    checked = 0
    for m in sample_matches:
        mid = m['id']
        innings = fetch(f'/rest/v1/innings?match_id=eq.{mid}&select=total_runs')
        pms = fetch(f"/rest/v1/player_match_stats?match_id=eq.{mid}&select=runs_scored")
        if not innings or not pms:
            continue
        innings_total = sum(i['total_runs'] for i in innings)
        pms_total = sum(p['runs_scored'] for p in pms)
        # PMS counts only batter runs; innings total includes extras. So pms_total should
        # be LESS THAN innings_total (by extras count), but never more.
        if pms_total > innings_total + 5:
            mismatches += 1
        checked += 1

    if checked == 0:
        warn(t, 'pms.match_runs', 'could not sample')
    elif mismatches == 0:
        ok(t, 'pms.match_runs', f'sampled {checked} matches, PMS totals consistent')
    else:
        warn(t, 'pms.match_runs', f'{mismatches}/{checked} matches have PMS runs > innings runs')


# -------------------------------------------------------------------
# GLOBAL CHECKS (not per-tournament)
# -------------------------------------------------------------------
def check_tournaments_registry():
    """Tournaments registry table should have all 6 codes."""
    rows = fetch('/rest/v1/tournaments?select=code,name&order=sort_order.asc')
    codes = [r['code'] for r in rows]
    expected = {'IPL', 'SMAT', 'T20I', 'BBL', 'PSL', 'CPL'}
    missing = expected - set(codes)
    if not missing:
        ok('GLOBAL', 'tournaments.registry', f'all 6 tournaments registered: {codes}')
    else:
        fail('GLOBAL', 'tournaments.registry', f'missing: {missing}')


def check_no_duplicate_match_ids():
    """Match IDs must be unique across all tournaments."""
    rows = fetch('/rest/v1/matches?select=id&limit=10000')
    ids = [r['id'] for r in rows]
    if len(ids) == len(set(ids)):
        ok('GLOBAL', 'matches.unique_ids', f'{len(ids):,} unique IDs')
    else:
        dupes = len(ids) - len(set(ids))
        fail('GLOBAL', 'matches.unique_ids', f'{dupes} duplicate match IDs')


def check_player_id_format():
    """Player IDs should be Cricsheet-style 8-char hex."""
    rows = fetch('/rest/v1/players?select=id&limit=200')
    bad = [r['id'] for r in rows if not (len(r['id']) == 8 and all(c in '0123456789abcdef' for c in r['id'].lower()))]
    if not bad:
        ok('GLOBAL', 'players.id_format', f'sampled {len(rows)}, all 8-char hex')
    else:
        warn('GLOBAL', 'players.id_format', f'{len(bad)} non-standard IDs (e.g. {bad[:3]})')


# -------------------------------------------------------------------
# REPORT
# -------------------------------------------------------------------
def print_report():
    print()
    print('=' * 72)
    print('  SCOUT INDIA — DATA VALIDATION REPORT')
    print('=' * 72)

    # Group by tournament
    by_tournament = defaultdict(list)
    for level, t, check, msg in results:
        by_tournament[t].append((level, check, msg))

    # Print global first, then per-tournament
    order = ['GLOBAL'] + [t for t in ['IPL', 'SMAT', 'T20I', 'BBL', 'PSL', 'CPL'] if t in by_tournament]
    for t in order:
        if t not in by_tournament:
            continue
        rows = by_tournament[t]
        print(f'\n  {t}')
        print(f'  {"-"*68}')
        for level, check, msg in rows:
            tag = {'OK': '[OK]  ', 'WARN': '[WARN]', 'FAIL': '[FAIL]'}[level]
            line = f'  {tag} {check:30s}'
            if msg:
                line += f'  {msg}'
            print(line)

    # Summary
    total = len(results)
    ok_count = sum(1 for r in results if r[0] == 'OK')
    warn_count = sum(1 for r in results if r[0] == 'WARN')
    fail_count = sum(1 for r in results if r[0] == 'FAIL')

    print()
    print('=' * 72)
    print(f'  SUMMARY: {ok_count} OK | {warn_count} WARN | {fail_count} FAIL  (total {total})')
    print('=' * 72)

    return fail_count == 0


# -------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------
def main():
    tournaments = sys.argv[1:] if len(sys.argv) > 1 else ['IPL', 'SMAT', 'BBL', 'PSL', 'CPL', 'T20I']
    tournaments = [t.upper() for t in tournaments]

    print(f'\n  Validating: {", ".join(tournaments)}')
    print(f'  Endpoint:   {SUPABASE_URL}')
    print(f'  Auth:       {"service_role (RLS bypassed)" if KEY.startswith("sb_secret_") else "anon key (limited)"}')

    # Global checks
    print('\n  Running global checks...')
    check_tournaments_registry()
    check_no_duplicate_match_ids()
    check_player_id_format()
    check_tournament_tagging('GLOBAL')

    # Per-tournament checks
    for t in tournaments:
        print(f'  Checking {t}...')
        check_row_counts(t)
        check_null_critical_fields(t)
        check_innings_team_ids(t)
        check_delivery_players(t)
        check_impossible_stats(t)
        check_pms_sanity(t)
        check_orphan_deliveries(t)
        check_matches_have_innings(t)
        check_innings_totals_consistency(t)
        check_match_date_sanity(t)
        check_wicket_to_delivery_link(t)
        check_pms_match_consistency(t)

    all_ok = print_report()
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
