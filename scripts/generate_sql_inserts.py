#!/usr/bin/env python3
"""
Generate SQL INSERT statements from clean JSON data files.
Outputs one SQL file per table, ready to paste into Supabase SQL Editor.
"""

import json
import os
import csv

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data')
SQL_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'inserts')
os.makedirs(SQL_DIR, exist_ok=True)


def escape_sql(val):
    """Escape single quotes for SQL strings."""
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, list):
        # PostgreSQL array literal
        items = ', '.join(f"'{escape_str(v)}'" for v in val)
        return f"ARRAY[{items}]"
    return f"'{escape_str(str(val))}'"


def escape_str(s):
    return s.replace("'", "''")


def generate_seasons():
    with open(os.path.join(DATA_DIR, 'seasons.json')) as f:
        data = json.load(f)

    lines = ['-- Seasons\n']
    lines.append('INSERT INTO seasons (id, year, raw_label) VALUES')
    vals = []
    for s in data:
        vals.append(f"  ({s['id']}, {s['year']}, {escape_sql(s['raw_label'])})")
    lines.append(',\n'.join(vals) + ';\n')

    path = os.path.join(SQL_DIR, '01_seasons.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  01_seasons.sql: {len(data)} rows")


def generate_teams():
    with open(os.path.join(DATA_DIR, 'teams.json')) as f:
        data = json.load(f)

    lines = ['-- Teams\n']
    lines.append('INSERT INTO teams (id, name, short_name, historical_names, color, is_active) VALUES')
    vals = []
    for t in data:
        vals.append(f"  ({t['id']}, {escape_sql(t['name'])}, {escape_sql(t['short_name'])}, {escape_sql(t['historical_names'])}, {escape_sql(t['color'])}, {escape_sql(t['is_active'])})")
    lines.append(',\n'.join(vals) + ';\n')

    path = os.path.join(SQL_DIR, '02_teams.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  02_teams.sql: {len(data)} rows")


def generate_venues():
    with open(os.path.join(DATA_DIR, 'venues.json')) as f:
        data = json.load(f)

    lines = ['-- Venues\n']
    lines.append('INSERT INTO venues (id, name, city, raw_names) VALUES')
    vals = []
    for v in data:
        vals.append(f"  ({v['id']}, {escape_sql(v['name'])}, {escape_sql(v['city'])}, {escape_sql(v['raw_names'])})")
    lines.append(',\n'.join(vals) + ';\n')

    path = os.path.join(SQL_DIR, '03_venues.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  03_venues.sql: {len(data)} rows")


def generate_players():
    with open(os.path.join(DATA_DIR, 'players.json')) as f:
        data = json.load(f)

    # Split into batches of 500 for Supabase SQL editor limits
    batch_size = 500
    total = 0

    lines = ['-- Players\n']
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        lines.append('INSERT INTO players (id, name, short_name) VALUES')
        vals = []
        for p in batch:
            vals.append(f"  ({escape_sql(p['id'])}, {escape_sql(p['name'])}, {escape_sql(p['short_name'])})")
        lines.append(',\n'.join(vals) + ';\n')
        total += len(batch)

    path = os.path.join(SQL_DIR, '04_players.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  04_players.sql: {total} rows")


def generate_matches():
    with open(os.path.join(DATA_DIR, 'matches.json')) as f:
        data = json.load(f)

    # Build team name -> id lookup
    with open(os.path.join(DATA_DIR, 'teams.json')) as f:
        teams = {t['name']: t['id'] for t in json.load(f)}

    with open(os.path.join(DATA_DIR, 'venues.json')) as f:
        venues = {v['name']: v['id'] for v in json.load(f)}

    with open(os.path.join(DATA_DIR, 'seasons.json')) as f:
        seasons = {s['year']: s['id'] for s in json.load(f)}

    batch_size = 200
    total = 0
    lines = ['-- Matches\n']

    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        lines.append('INSERT INTO matches (id, season_id, date, venue_id, team1_id, team2_id, toss_winner_id, toss_decision, winner_id, win_by_runs, win_by_wickets, player_of_match, stage, team1_score, team1_wickets, team1_overs, team2_score, team2_wickets, team2_overs) VALUES')
        vals = []
        for m in batch:
            season_id = seasons.get(m['season_year'], 'NULL')
            venue_id = venues.get(m['venue'], 'NULL')
            team1_id = teams.get(m['team1'], 'NULL')
            team2_id = teams.get(m['team2'], 'NULL')
            toss_id = teams.get(m['toss_winner'], 'NULL')
            winner_id = teams.get(m['winner'], 'NULL') if m['winner'] else 'NULL'
            pom = escape_sql(m['player_of_match']) if m['player_of_match'] else 'NULL'

            vals.append(
                f"  ({escape_sql(m['id'])}, {season_id}, {escape_sql(m['date'])}, {venue_id}, "
                f"{team1_id}, {team2_id}, {toss_id}, {escape_sql(m['toss_decision'])}, "
                f"{winner_id}, {escape_sql(m['win_by_runs'])}, {escape_sql(m['win_by_wickets'])}, "
                f"{pom}, {escape_sql(m['stage'])}, "
                f"{escape_sql(m['team1_score'])}, {escape_sql(m['team1_wickets'])}, {escape_sql(m['team1_overs'])}, "
                f"{escape_sql(m['team2_score'])}, {escape_sql(m['team2_wickets'])}, {escape_sql(m['team2_overs'])})"
            )
        lines.append(',\n'.join(vals) + ';\n')
        total += len(batch)

    path = os.path.join(SQL_DIR, '05_matches.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  05_matches.sql: {total} rows")


def generate_innings():
    with open(os.path.join(DATA_DIR, 'innings.json')) as f:
        data = json.load(f)

    with open(os.path.join(DATA_DIR, 'teams.json')) as f:
        teams = {t['name']: t['id'] for t in json.load(f)}

    batch_size = 500
    total = 0
    lines = ['-- Innings\n']

    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        lines.append('INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, total_wickets, total_overs, target_runs, is_super_over) VALUES')
        vals = []
        for inn in batch:
            bat_id = teams.get(inn['batting_team'], 'NULL')
            bowl_id = teams.get(inn['bowling_team'], 'NULL')
            vals.append(
                f"  ({inn['id']}, {escape_sql(inn['match_id'])}, {inn['innings_number']}, "
                f"{bat_id}, {bowl_id}, {inn['total_runs']}, {inn['total_wickets']}, "
                f"{inn['total_overs']}, {escape_sql(inn['target_runs'])}, {escape_sql(inn['is_super_over'])})"
            )
        lines.append(',\n'.join(vals) + ';\n')
        total += len(batch)

    path = os.path.join(SQL_DIR, '06_innings.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  06_innings.sql: {total} rows")


def generate_deliveries():
    """Generate deliveries SQL from CSV. Split into multiple files due to size."""
    csv_path = os.path.join(DATA_DIR, 'deliveries.csv')

    batch_size = 5000
    file_num = 1
    total = 0
    vals = []
    files_created = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            vals.append(
                f"  ({row['id']}, {row['innings_id']}, {escape_sql(row['match_id'])}, "
                f"{row['over_number']}, {row['ball_number']}, {escape_sql(row['phase'])}, "
                f"{escape_sql(row['batter_id'])}, {escape_sql(row['bowler_id'])}, {escape_sql(row['non_striker_id'])}, "
                f"{row['batter_runs']}, {row['extra_runs']}, {row['total_runs']}, "
                f"{escape_sql(row['extra_type'] if row['extra_type'] else None)}, "
                f"{row['is_legal'].upper()}, {row['is_boundary'].upper()}, {row['is_dot'].upper()})"
            )

            if len(vals) >= batch_size:
                fname = f'07_deliveries_{file_num:03d}.sql'
                lines = [f'-- Deliveries batch {file_num}\n']
                lines.append('INSERT INTO deliveries (id, innings_id, match_id, over_number, ball_number, phase, batter_id, bowler_id, non_striker_id, batter_runs, extra_runs, total_runs, extra_type, is_legal, is_boundary, is_dot) VALUES')
                lines.append(',\n'.join(vals) + ';\n')
                path = os.path.join(SQL_DIR, fname)
                with open(path, 'w', encoding='utf-8') as out:
                    out.write('\n'.join(lines))
                files_created.append(fname)
                vals = []
                file_num += 1

    # Write remaining
    if vals:
        fname = f'07_deliveries_{file_num:03d}.sql'
        lines = [f'-- Deliveries batch {file_num}\n']
        lines.append('INSERT INTO deliveries (id, innings_id, match_id, over_number, ball_number, phase, batter_id, bowler_id, non_striker_id, batter_runs, extra_runs, total_runs, extra_type, is_legal, is_boundary, is_dot) VALUES')
        lines.append(',\n'.join(vals) + ';\n')
        path = os.path.join(SQL_DIR, fname)
        with open(path, 'w', encoding='utf-8') as out:
            out.write('\n'.join(lines))
        files_created.append(fname)

    print(f"  07_deliveries_*.sql: {total} rows across {len(files_created)} files")


def generate_wickets():
    with open(os.path.join(DATA_DIR, 'wickets.json')) as f:
        data = json.load(f)

    batch_size = 2000
    total = 0
    lines = ['-- Wickets\n']

    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        lines.append('INSERT INTO wickets (id, delivery_id, match_id, innings_id, batter_id, bowler_id, fielder_id, kind, is_bowler_wicket) VALUES')
        vals = []
        for w in batch:
            vals.append(
                f"  ({w['id']}, {w['delivery_id']}, {escape_sql(w['match_id'])}, {w['innings_id']}, "
                f"{escape_sql(w['batter_id'])}, {escape_sql(w['bowler_id'])}, {escape_sql(w['fielder_id'])}, "
                f"{escape_sql(w['kind'])}, {escape_sql(w['is_bowler_wicket'])})"
            )
        lines.append(',\n'.join(vals) + ';\n')
        total += len(batch)

    path = os.path.join(SQL_DIR, '08_wickets.sql')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  08_wickets.sql: {total} rows")


def generate_player_match_stats():
    with open(os.path.join(DATA_DIR, 'player_match_stats.json')) as f:
        data = json.load(f)

    with open(os.path.join(DATA_DIR, 'teams.json')) as f:
        teams = {t['name']: t['id'] for t in json.load(f)}

    with open(os.path.join(DATA_DIR, 'seasons.json')) as f:
        seasons = {s['year']: s['id'] for s in json.load(f)}

    batch_size = 2000
    file_num = 1
    total = 0
    vals = []
    files_created = []

    for row in data:
        total += 1
        team_id = teams.get(row['team'], 'NULL')
        season_id = seasons.get(row['season_year'], 'NULL')

        vals.append(
            f"  ({escape_sql(row['match_id'])}, {escape_sql(row['player_id'])}, "
            f"{team_id}, {season_id}, "
            f"{row['runs_scored']}, {row['balls_faced']}, {row['fours']}, {row['sixes']}, "
            f"{escape_sql(row['is_not_out'])}, {escape_sql(row['dismissal_kind'])}, "
            f"{row.get('overs_bowled', 0)}, {row['runs_conceded']}, {row['wickets_taken']}, "
            f"{row['dots_bowled']}, {row['extras_conceded']}, "
            f"{row['catches']}, {row['run_outs']}, {row['stumpings']})"
        )

        if len(vals) >= batch_size:
            fname = f'09_player_match_stats_{file_num:03d}.sql'
            lines = [f'-- Player Match Stats batch {file_num}\n']
            lines.append('INSERT INTO player_match_stats (match_id, player_id, team_id, season_id, runs_scored, balls_faced, fours, sixes, is_not_out, dismissal_kind, overs_bowled, runs_conceded, wickets_taken, dots_bowled, extras_conceded, catches, run_outs, stumpings) VALUES')
            lines.append(',\n'.join(vals) + ';\n')
            path = os.path.join(SQL_DIR, fname)
            with open(path, 'w', encoding='utf-8') as out:
                out.write('\n'.join(lines))
            files_created.append(fname)
            vals = []
            file_num += 1

    if vals:
        fname = f'09_player_match_stats_{file_num:03d}.sql'
        lines = [f'-- Player Match Stats batch {file_num}\n']
        lines.append('INSERT INTO player_match_stats (match_id, player_id, team_id, season_id, runs_scored, balls_faced, fours, sixes, is_not_out, dismissal_kind, overs_bowled, runs_conceded, wickets_taken, dots_bowled, extras_conceded, catches, run_outs, stumpings) VALUES')
        lines.append(',\n'.join(vals) + ';\n')
        path = os.path.join(SQL_DIR, fname)
        with open(path, 'w', encoding='utf-8') as out:
            out.write('\n'.join(lines))
        files_created.append(fname)

    print(f"  09_player_match_stats_*.sql: {total} rows across {len(files_created)} files")


def main():
    print("Generating SQL INSERT scripts...\n")

    generate_seasons()
    generate_teams()
    generate_venues()
    generate_players()
    generate_matches()
    generate_innings()
    generate_deliveries()
    generate_wickets()
    generate_player_match_stats()

    # Count total files
    files = sorted(os.listdir(SQL_DIR))
    print(f"\nDone! {len(files)} SQL files generated in supabase/inserts/")
    print("\nRun them in Supabase SQL Editor in this order:")
    for f in files:
        size = os.path.getsize(os.path.join(SQL_DIR, f))
        print(f"  {f} ({size / 1024:.0f} KB)")


if __name__ == '__main__':
    main()
