#!/usr/bin/env python3
"""
Surgical patch: re-upload the original Phase 1 IPL deliveries.csv and
wickets.json with on_conflict=id, resolution=ignore-duplicates.

Existing rows (276,586 of them) get skipped instantly; the 3,000 missing
deliveries + 3,000 missing wickets get inserted.

Usage: python scripts/patch_ipl_gap.py
"""

import json
import csv
import os
import sys
import time
import urllib.request
import urllib.error

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SUPABASE_URL = 'https://ejremkmgobdrjoapwwqq.supabase.co'


def _load_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if not os.path.exists(env_path):
        return None
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                return line.split('=', 1)[1].strip()
    return None


KEY = _load_key()
if not KEY or not KEY.startswith('sb_secret_'):
    print('ERROR: Need service_role key in .env (SUPABASE_SERVICE_ROLE_KEY=sb_secret_...)')
    sys.exit(1)

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
}


def post(table, rows, conflict_col='id'):
    """Upsert with ignore-duplicates: existing rows skipped, missing ones inserted."""
    if not rows:
        return True, ''
    path = f'/rest/v1/{table}?on_conflict={conflict_col}'
    headers = dict(HEADERS, **{
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
    })
    data = json.dumps(rows).encode('utf-8')

    for attempt in range(5):
        req = urllib.request.Request(
            f'{SUPABASE_URL}{path}', data=data, headers=headers, method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return True, ''
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')[:300] if e.fp else ''
            if e.code >= 500 and attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            return False, f'HTTP {e.code}: {body}'
        except Exception as e:
            if attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            return False, f'{type(e).__name__}: {str(e)[:200]}'
    return False, 'max retries'


def patch_deliveries():
    print('\n[1/2] Patching IPL deliveries...')
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data', 'deliveries.csv')

    with open(csv_path, 'r', encoding='utf-8') as f:
        total_rows = sum(1 for _ in f) - 1
    print(f'  CSV has {total_rows:,} rows; uploading all (duplicates auto-skipped)')

    batch_size = 500
    batch = []
    sent = 0
    failed = 0
    start = time.time()

    with open(csv_path, 'r', encoding='utf-8') as f:
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
                'tournament': 'IPL',
            })

            if len(batch) >= batch_size:
                ok, err = post('deliveries', batch)
                sent += len(batch)
                if not ok:
                    failed += 1
                    print(f'    ! batch error at {sent}: {err[:200]}')
                    if failed > 20:
                        print('    too many errors, stopping')
                        return
                batch = []

                if sent % 20000 == 0:
                    elapsed = time.time() - start
                    rate = sent / elapsed if elapsed > 0 else 0
                    eta = (total_rows - sent) / rate if rate > 0 else 0
                    print(f'    {sent:,} / {total_rows:,} ({sent*100//total_rows}%) {rate:.0f} r/s ETA {eta:.0f}s')

    if batch:
        post('deliveries', batch)
        sent += len(batch)

    print(f'  Sent {sent:,} rows ({failed} batch errors)')


def patch_wickets():
    print('\n[2/2] Patching IPL wickets...')
    json_path = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data', 'wickets.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        wickets = json.load(f)
    print(f'  JSON has {len(wickets):,} rows')

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
        'tournament': 'IPL',
    } for w in wickets]

    sent = 0
    failed = 0
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        ok, err = post('wickets', batch)
        sent += len(batch)
        if not ok:
            failed += 1
            print(f'    ! batch error at {sent}: {err[:200]}')
            if failed > 10:
                break
        if sent % 2000 == 0:
            print(f'    {sent:,} / {len(rows):,}')

    print(f'  Sent {sent:,} rows ({failed} batch errors)')


if __name__ == '__main__':
    print('IPL gap patch — surgical repair via on_conflict=id, ignore-duplicates')
    print(f'Endpoint: {SUPABASE_URL}')
    patch_deliveries()
    patch_wickets()
    print('\nDone. Now run: python scripts/validate_data.py IPL')
