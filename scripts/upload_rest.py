#!/usr/bin/env python3
"""Upload deliveries and wickets to Supabase via REST API."""

import json
import csv
import os
import sys
import urllib.request
import urllib.error
import time

SUPABASE_URL = 'https://ejremkmgobdrjoapwwqq.supabase.co'
SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcmVta21nb2JkcmpvYXB3d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODk1MzksImV4cCI6MjA5MDc2NTUzOX0.5uHkKhLn0TTucD1pEuxN-9ibfQh_-w5p6D2BgKap6O8'

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data')

headers = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}


def post_batch(table, rows, retries=3):
    data = json.dumps(rows).encode('utf-8')
    for attempt in range(retries):
        req = urllib.request.Request(
            f'{SUPABASE_URL}/rest/v1/{table}',
            data=data, headers=headers, method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return True, ''
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')[:300] if e.fp else ''
            if e.code == 409:  # Duplicate - skip
                return True, 'duplicate'
            return False, f'HTTP {e.code}: {body}'
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)  # Wait before retry
                continue
            return False, str(e)[:200]
    return False, 'max retries'


def upload_deliveries():
    print("Uploading deliveries (279,586 rows)...")
    csv_path = os.path.join(DATA_DIR, 'deliveries.csv')

    batch_size = 500
    batch = []
    total = 0
    failed = 0

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
            })

            if len(batch) >= batch_size:
                ok, err = post_batch('deliveries', batch)
                total += len(batch)
                if not ok:
                    failed += 1
                    print(f'\n  Error at row {total}: {err}')
                    if failed > 50:
                        print('Too many errors, stopping.')
                        return total
                batch = []

                if total % 5000 == 0:
                    print(f'  {total:,} / 279,586 ({total*100//279586}%)')

                time.sleep(0.1)  # Rate limit

    # Remaining
    if batch:
        ok, err = post_batch('deliveries', batch)
        total += len(batch)
        if not ok:
            print(f'  Error at final batch: {err}')

    print(f'Deliveries done: {total:,} rows uploaded ({failed} errors)')
    return total


def upload_wickets():
    print("\nUploading wickets (13,901 rows)...")
    with open(os.path.join(DATA_DIR, 'wickets.json'), 'r', encoding='utf-8') as f:
        wickets = json.load(f)

    batch_size = 500
    total = 0

    for i in range(0, len(wickets), batch_size):
        batch = wickets[i:i+batch_size]
        rows = []
        for w in batch:
            rows.append({
                'id': w['id'],
                'delivery_id': w['delivery_id'],
                'match_id': w['match_id'],
                'innings_id': w['innings_id'],
                'batter_id': w['batter_id'],
                'bowler_id': w['bowler_id'],
                'fielder_id': w['fielder_id'],
                'kind': w['kind'],
                'is_bowler_wicket': w['is_bowler_wicket'],
            })

        ok, err = post_batch('wickets', rows)
        total += len(batch)
        if not ok:
            print(f'  Error at row {total}: {err}')
            break

        if total % 2000 == 0:
            print(f'  {total:,} / {len(wickets):,}')

        time.sleep(0.1)

    print(f'Wickets done: {total:,} rows uploaded')
    return total


if __name__ == '__main__':
    print(f"Uploading to {SUPABASE_URL}\n")

    d = upload_deliveries()
    w = upload_wickets()

    print(f"\nAll done! Deliveries: {d:,} | Wickets: {w:,}")
