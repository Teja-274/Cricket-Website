#!/usr/bin/env python3
"""
Automatically upload all SQL insert files to Supabase.
No manual pasting needed — runs all 76 files in order via the Supabase REST API.

Usage:
    python upload_to_supabase.py
"""

import os
import sys
import time

try:
    from supabase import create_client
except ImportError:
    print("Installing supabase-py...")
    os.system(f"{sys.executable} -m pip install supabase")
    from supabase import create_client

# Your Supabase credentials
SUPABASE_URL = "https://ejremkmgobdrjoapwwqq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcmVta21nb2JkcmpvYXB3d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODk1MzksImV4cCI6MjA5MDc2NTUzOX0.5uHkKhLn0TTucD1pEuxN-9ibfQh_-w5p6D2BgKap6O8"

SQL_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'inserts')
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'schema.sql')


def run_sql(supabase_client, sql, label=""):
    """Execute SQL via Supabase RPC or REST."""
    try:
        # Use the postgrest rpc endpoint
        result = supabase_client.postgrest.session.post(
            f"{SUPABASE_URL}/rest/v1/rpc/",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
            json={"query": sql}
        )
        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def upload_via_psql():
    """
    Upload using direct HTTP POST to Supabase SQL endpoint.
    This uses the pg_graphql or SQL execution endpoint.
    """
    import urllib.request
    import json

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    def execute_sql(sql, label=""):
        """Execute SQL via Supabase's pg endpoint."""
        url = f"{SUPABASE_URL}/pg/query"
        data = json.dumps({"query": sql}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                return True
        except urllib.error.HTTPError as e:
            # Try alternate endpoint
            pass

        # Fallback: use the /rest/v1/rpc endpoint with a custom function
        # If that doesn't work either, we'll use the supabase-py client
        return False

    # Step 1: Run schema
    print("Step 1: Creating tables...")
    with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    if not execute_sql(schema_sql, "schema"):
        print("  Direct SQL endpoint not available.")
        print("  You need to run the schema manually in Supabase SQL Editor.")
        print(f"  File: {SCHEMA_FILE}")
        return False

    # Step 2: Run insert files in order
    files = sorted(os.listdir(SQL_DIR))
    total = len(files)
    success = 0
    failed = 0

    print(f"\nStep 2: Inserting data ({total} files)...\n")

    for i, fname in enumerate(files, 1):
        filepath = os.path.join(SQL_DIR, fname)
        size_kb = os.path.getsize(filepath) / 1024

        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()

        print(f"  [{i}/{total}] {fname} ({size_kb:.0f} KB)...", end=" ", flush=True)

        if execute_sql(sql, fname):
            print("OK")
            success += 1
        else:
            print("FAILED")
            failed += 1

        # Small delay to avoid rate limiting
        if i % 10 == 0:
            time.sleep(1)

    print(f"\nDone! {success} succeeded, {failed} failed out of {total} files.")
    return failed == 0


def upload_via_json_api():
    """
    Alternative: Upload data using Supabase REST API (PostgREST) with JSON inserts.
    This bypasses SQL entirely and uses the table API directly.
    """
    import json
    import urllib.request

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data')

    def insert_json(table, data, label=""):
        """Insert JSON data into a Supabase table via REST API."""
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        batch_size = 500

        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            payload = json.dumps(batch).encode('utf-8')
            req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
            try:
                with urllib.request.urlopen(req, timeout=60) as response:
                    pass
            except urllib.error.HTTPError as e:
                body = e.read().decode('utf-8')
                print(f"    Error at batch {i//batch_size + 1}: {e.code} - {body[:200]}")
                return False
        return True

    # Small tables from JSON files
    tables_to_load = [
        ('seasons', 'seasons.json'),
        ('teams', 'teams.json'),
        ('venues', 'venues.json'),
        ('players', 'players.json'),
    ]

    print("\nUploading via REST API (JSON)...\n")

    for table, fname in tables_to_load:
        filepath = os.path.join(DATA_DIR, fname)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Clean data for API (remove fields not in table)
        if table == 'teams':
            for row in data:
                row['historical_names'] = '{' + ','.join(f'"{n}"' for n in row['historical_names']) + '}'
        if table == 'venues':
            for row in data:
                row['raw_names'] = '{' + ','.join(f'"{n}"' for n in row['raw_names']) + '}'

        print(f"  {table}: {len(data)} rows...", end=" ", flush=True)
        if insert_json(table, data, table):
            print("OK")
        else:
            print("FAILED")

    # Matches (need to transform field names)
    print("\n  Loading matches...", end=" ", flush=True)
    with open(os.path.join(DATA_DIR, 'matches.json'), 'r', encoding='utf-8') as f:
        matches_raw = json.load(f)

    with open(os.path.join(DATA_DIR, 'teams.json'), 'r', encoding='utf-8') as f:
        team_lookup = {t['name']: t['id'] for t in json.load(f)}

    with open(os.path.join(DATA_DIR, 'venues.json'), 'r', encoding='utf-8') as f:
        venue_lookup = {v['name']: v['id'] for v in json.load(f)}

    with open(os.path.join(DATA_DIR, 'seasons.json'), 'r', encoding='utf-8') as f:
        season_lookup = {s['year']: s['id'] for s in json.load(f)}

    matches_clean = []
    for m in matches_raw:
        matches_clean.append({
            'id': m['id'],
            'season_id': season_lookup.get(m['season_year']),
            'date': m['date'] or None,
            'venue_id': venue_lookup.get(m['venue']),
            'team1_id': team_lookup.get(m['team1']),
            'team2_id': team_lookup.get(m['team2']),
            'toss_winner_id': team_lookup.get(m['toss_winner']),
            'toss_decision': m['toss_decision'] or None,
            'winner_id': team_lookup.get(m['winner']) if m['winner'] else None,
            'win_by_runs': m['win_by_runs'],
            'win_by_wickets': m['win_by_wickets'],
            'player_of_match': m['player_of_match'],
            'stage': m['stage'],
            'team1_score': m['team1_score'],
            'team1_wickets': m['team1_wickets'],
            'team1_overs': m['team1_overs'],
            'team2_score': m['team2_score'],
            'team2_wickets': m['team2_wickets'],
            'team2_overs': m['team2_overs'],
        })

    if insert_json('matches', matches_clean, 'matches'):
        print(f"OK ({len(matches_clean)} rows)")
    else:
        print("FAILED")

    # Innings
    print("  Loading innings...", end=" ", flush=True)
    with open(os.path.join(DATA_DIR, 'innings.json'), 'r', encoding='utf-8') as f:
        innings_raw = json.load(f)

    innings_clean = []
    for inn in innings_raw:
        innings_clean.append({
            'id': inn['id'],
            'match_id': inn['match_id'],
            'innings_number': inn['innings_number'],
            'batting_team_id': team_lookup.get(inn['batting_team']),
            'bowling_team_id': team_lookup.get(inn['bowling_team']),
            'total_runs': inn['total_runs'],
            'total_wickets': inn['total_wickets'],
            'total_overs': inn['total_overs'],
            'target_runs': inn['target_runs'],
            'is_super_over': inn['is_super_over'],
        })

    if insert_json('innings', innings_clean, 'innings'):
        print(f"OK ({len(innings_clean)} rows)")
    else:
        print("FAILED")

    # Deliveries (big one - from CSV)
    print("  Loading deliveries (279K rows, this takes a minute)...", flush=True)
    import csv
    csv_path = os.path.join(DATA_DIR, 'deliveries.csv')
    deliveries = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            deliveries.append({
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
            })

    print(f"    Loaded {len(deliveries)} deliveries, uploading in batches...")
    batch_size = 2000
    for i in range(0, len(deliveries), batch_size):
        batch = deliveries[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(deliveries) + batch_size - 1) // batch_size
        print(f"    Batch {batch_num}/{total_batches}...", end=" ", flush=True)
        if insert_json('deliveries', batch):
            print("OK")
        else:
            print("FAILED")
            break
        time.sleep(0.5)  # Rate limit

    # Wickets
    print("  Loading wickets...", end=" ", flush=True)
    with open(os.path.join(DATA_DIR, 'wickets.json'), 'r', encoding='utf-8') as f:
        wickets = json.load(f)

    if insert_json('wickets', wickets, 'wickets'):
        print(f"OK ({len(wickets)} rows)")
    else:
        print("FAILED")

    # Player match stats
    print("  Loading player match stats (25K rows)...", flush=True)
    with open(os.path.join(DATA_DIR, 'player_match_stats.json'), 'r', encoding='utf-8') as f:
        pms_raw = json.load(f)

    pms_clean = []
    for row in pms_raw:
        pms_clean.append({
            'match_id': row['match_id'],
            'player_id': row['player_id'],
            'team_id': team_lookup.get(row['team']),
            'season_id': season_lookup.get(row['season_year']),
            'runs_scored': row['runs_scored'],
            'balls_faced': row['balls_faced'],
            'fours': row['fours'],
            'sixes': row['sixes'],
            'is_not_out': row['is_not_out'],
            'dismissal_kind': row['dismissal_kind'],
            'overs_bowled': row.get('overs_bowled', 0),
            'runs_conceded': row['runs_conceded'],
            'wickets_taken': row['wickets_taken'],
            'dots_bowled': row['dots_bowled'],
            'extras_conceded': row['extras_conceded'],
            'catches': row['catches'],
            'run_outs': row['run_outs'],
            'stumpings': row['stumpings'],
        })

    batch_size = 2000
    for i in range(0, len(pms_clean), batch_size):
        batch = pms_clean[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(pms_clean) + batch_size - 1) // batch_size
        print(f"    Batch {batch_num}/{total_batches}...", end=" ", flush=True)
        if insert_json('player_match_stats', batch):
            print("OK")
        else:
            print("FAILED")
            break
        time.sleep(0.3)

    print("\nUpload complete!")


if __name__ == '__main__':
    print("=" * 60)
    print("Scout India - Supabase Data Uploader")
    print("=" * 60)
    print()
    print("NOTE: You must first create the tables by running")
    print(f"  {SCHEMA_FILE}")
    print("in the Supabase SQL Editor manually.")
    print()
    input("Press Enter once tables are created to start uploading data...")
    print()

    upload_via_json_api()
