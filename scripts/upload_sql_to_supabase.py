#!/usr/bin/env python3
"""
Upload SQL insert files directly to Supabase using the REST API.
Reads each SQL file and executes it via the Supabase SQL endpoint.
"""

import os
import sys
import urllib.request
import urllib.error
import json
import time

# Read from .env file
ENV_FILE = os.path.join(os.path.dirname(__file__), '..', '.env')
SUPABASE_URL = ''
SUPABASE_KEY = ''

with open(ENV_FILE) as f:
    for line in f:
        line = line.strip()
        if line.startswith('VITE_SUPABASE_URL='):
            SUPABASE_URL = line.split('=', 1)[1]
        elif line.startswith('VITE_SUPABASE_ANON_KEY='):
            SUPABASE_KEY = line.split('=', 1)[1]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Could not read Supabase credentials from .env")
    sys.exit(1)

SQL_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'inserts')


def execute_sql(sql_content):
    """Execute SQL via Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # Try the pg_net approach - direct PostgreSQL execution
    # Supabase doesn't have a direct SQL execution endpoint via REST
    # We'll use the PostgREST approach instead

    # Alternative: Use supabase-py or psycopg2
    pass


def execute_sql_via_postgrest(sql_content):
    """Execute SQL using Supabase's built-in SQL endpoint."""
    url = f"{SUPABASE_URL}/pg/query"

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'apikey': SUPABASE_KEY,
    }

    data = json.dumps({'query': sql_content}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return True, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.fp else str(e)
        return False, f"HTTP {e.code}: {body[:300]}"
    except Exception as e:
        return False, str(e)


def main():
    # Get files to upload
    files_to_run = []

    if len(sys.argv) > 1:
        # Run specific files passed as arguments
        for pattern in sys.argv[1:]:
            for f in sorted(os.listdir(SQL_DIR)):
                if pattern in f:
                    files_to_run.append(f)
    else:
        # Run innings, deliveries, and wickets
        for f in sorted(os.listdir(SQL_DIR)):
            if f.startswith('06_innings') or f.startswith('07_deliveries') or f.startswith('08_wickets'):
                files_to_run.append(f)

    print(f"Will run {len(files_to_run)} SQL files against {SUPABASE_URL}")
    print()

    success = 0
    failed = 0

    for i, fname in enumerate(files_to_run):
        filepath = os.path.join(SQL_DIR, fname)
        size_kb = os.path.getsize(filepath) / 1024

        print(f"[{i+1}/{len(files_to_run)}] {fname} ({size_kb:.0f} KB)...", end=' ', flush=True)

        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()

        ok, result = execute_sql_via_postgrest(sql)

        if ok:
            print("OK")
            success += 1
        else:
            print(f"FAILED: {result[:200]}")
            failed += 1

        # Small delay to avoid rate limiting
        time.sleep(0.5)

    print(f"\nDone! {success} succeeded, {failed} failed out of {len(files_to_run)} files")


if __name__ == '__main__':
    main()
