#!/usr/bin/env python3
"""
Upload SQL insert files directly to Supabase PostgreSQL.
Connects using the Supabase database connection string.
"""

import os
import sys
import time
import psycopg2

# Supabase PostgreSQL connection
# Format: postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres
# Get this from: Supabase Dashboard → Settings → Database → Connection string (URI)

# Read from environment or hardcode
DB_URL = os.environ.get('DATABASE_URL', '')

if not DB_URL:
    # Try to construct from .env
    ENV_FILE = os.path.join(os.path.dirname(__file__), '..', '.env')
    SUPABASE_URL = ''
    with open(ENV_FILE) as f:
        for line in f:
            if line.startswith('VITE_SUPABASE_URL='):
                SUPABASE_URL = line.strip().split('=', 1)[1]

    if SUPABASE_URL:
        # Extract project ref from URL
        # https://ejremkmgobdrjoapwwqq.supabase.co -> ejremkmgobdrjoapwwqq
        project_ref = SUPABASE_URL.replace('https://', '').split('.')[0]
        print(f"Project ref: {project_ref}")
        print(f"\nI need the database password to connect directly.")
        print(f"Go to: Supabase Dashboard → Settings → Database → Connection string")
        print(f"Or set DATABASE_URL environment variable.\n")
        print(f"Example: postgresql://postgres.{project_ref}:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
        DB_URL = input("\nPaste your database connection string: ").strip()

if not DB_URL:
    print("No database URL provided. Exiting.")
    sys.exit(1)

SQL_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'inserts')


def main():
    # Determine files to run
    files_to_run = []
    for f in sorted(os.listdir(SQL_DIR)):
        if f.startswith('06_innings') or f.startswith('07_deliveries') or f.startswith('08_wickets'):
            files_to_run.append(f)

    print(f"\nWill run {len(files_to_run)} SQL files")
    print(f"Connecting to database...")

    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    success = 0
    failed = 0

    for i, fname in enumerate(files_to_run):
        filepath = os.path.join(SQL_DIR, fname)
        size_kb = os.path.getsize(filepath) / 1024

        print(f"[{i+1}/{len(files_to_run)}] {fname} ({size_kb:.0f} KB)...", end=' ', flush=True)

        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()

        try:
            cur.execute(sql)
            print("OK")
            success += 1
        except Exception as e:
            print(f"FAILED: {str(e)[:200]}")
            failed += 1
            # Reset connection after error
            conn.rollback()

    cur.close()
    conn.close()

    print(f"\nDone! {success} succeeded, {failed} failed out of {len(files_to_run)} files")

    # Verify counts
    if success > 0:
        try:
            conn = psycopg2.connect(DB_URL)
            cur = conn.cursor()
            for table in ['innings', 'deliveries', 'wickets']:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  {table}: {count:,} rows")
            cur.close()
            conn.close()
        except:
            pass


if __name__ == '__main__':
    main()
