#!/usr/bin/env python3
"""
Parse Cricsheet IPL ball-by-ball JSON data into per-player career stats.
Outputs a JSON file ready for the Scout India frontend.
"""

import json
import os
import sys
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'ipl_json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'ipl_stats.json')

def parse_all_matches():
    """Parse all IPL match JSON files and aggregate player stats."""

    # Per-player stats accumulators
    players = defaultdict(lambda: {
        'name': '',
        'matches': set(),  # match IDs to count unique matches
        'seasons': set(),
        'teams': set(),
        # Batting
        'runs': 0,
        'balls_faced': 0,
        'fours': 0,
        'sixes': 0,
        'batting_innings': 0,
        'not_outs': 0,
        'dismissals': [],
        'highest_score': 0,
        'current_innings_runs': 0,
        # Bowling
        'balls_bowled': 0,
        'runs_conceded': 0,
        'wickets': 0,
        'bowling_innings': 0,
        'maidens': 0,
        'best_bowling_wickets': 0,
        'best_bowling_runs': 999,
        # By season
        'season_stats': defaultdict(lambda: {
            'matches': set(), 'runs': 0, 'balls_faced': 0, 'wickets': 0,
            'balls_bowled': 0, 'runs_conceded': 0, 'batting_innings': 0,
            'not_outs': 0, 'fours': 0, 'sixes': 0,
        }),
        # By venue
        'venue_runs': defaultdict(int),
        'venue_balls': defaultdict(int),
        # Death overs (16-20)
        'death_runs': 0, 'death_balls_faced': 0,
        'death_wickets': 0, 'death_balls_bowled': 0, 'death_runs_conceded': 0,
        # Powerplay (1-6)
        'pp_runs': 0, 'pp_balls_faced': 0,
        'pp_wickets': 0, 'pp_balls_bowled': 0, 'pp_runs_conceded': 0,
    })

    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith('.json')])
    print(f"Processing {len(files)} IPL matches...")

    for i, filename in enumerate(files):
        if (i + 1) % 100 == 0:
            print(f"  Processed {i+1}/{len(files)} matches...")

        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                match = json.load(f)
        except:
            continue

        match_id = filename.replace('.json', '')
        info = match.get('info', {})
        season = str(info.get('season', ''))
        venue = info.get('venue', '')
        teams = info.get('teams', [])

        # Track which players batted/bowled in this match
        match_batters = set()
        match_bowlers = set()

        # Process each innings
        for innings in match.get('innings', []):
            team = innings.get('team', '')

            # Track per-innings bowling figures
            innings_bowler_wickets = defaultdict(int)
            innings_bowler_runs = defaultdict(int)
            innings_batter_runs = defaultdict(int)
            innings_batter_out = set()

            for over_data in innings.get('overs', []):
                over_num = over_data.get('over', 0)  # 0-indexed
                is_powerplay = over_num < 6
                is_death = over_num >= 15

                for delivery in over_data.get('deliveries', []):
                    batter = delivery.get('batter', '')
                    bowler = delivery.get('bowler', '')
                    runs = delivery.get('runs', {})
                    batter_runs = runs.get('batter', 0)
                    total_runs = runs.get('total', 0)
                    extras = delivery.get('extras', {})

                    # Is this a legal delivery for the batter?
                    is_wide = 'wides' in extras
                    is_noball = 'noballs' in extras
                    is_legal_for_batter = not is_wide  # wides don't count as balls faced
                    is_legal_for_bowler = not is_wide and not is_noball

                    # Batting stats
                    if batter:
                        p = players[batter]
                        p['name'] = batter
                        p['matches'].add(match_id)
                        p['seasons'].add(season)
                        p['teams'].add(team)
                        match_batters.add(batter)

                        p['runs'] += batter_runs
                        innings_batter_runs[batter] = innings_batter_runs.get(batter, 0) + batter_runs

                        if is_legal_for_batter:
                            p['balls_faced'] += 1

                        if batter_runs == 4:
                            p['fours'] += 1
                        elif batter_runs == 6:
                            p['sixes'] += 1

                        # Venue
                        p['venue_runs'][venue] += batter_runs
                        if is_legal_for_batter:
                            p['venue_balls'][venue] = p['venue_balls'].get(venue, 0) + 1

                        # Phase
                        if is_powerplay:
                            p['pp_runs'] += batter_runs
                            if is_legal_for_batter:
                                p['pp_balls_faced'] += 1
                        if is_death:
                            p['death_runs'] += batter_runs
                            if is_legal_for_batter:
                                p['death_balls_faced'] += 1

                        # Season
                        ss = p['season_stats'][season]
                        ss['matches'].add(match_id)
                        ss['runs'] += batter_runs
                        if is_legal_for_batter:
                            ss['balls_faced'] += 1
                        if batter_runs == 4:
                            ss['fours'] += 1
                        elif batter_runs == 6:
                            ss['sixes'] += 1

                    # Bowling stats
                    if bowler:
                        p = players[bowler]
                        p['name'] = bowler
                        p['matches'].add(match_id)
                        p['seasons'].add(season)
                        match_bowlers.add(bowler)

                        runs_against = total_runs - extras.get('byes', 0) - extras.get('legbyes', 0)
                        p['runs_conceded'] += runs_against
                        innings_bowler_runs[bowler] = innings_bowler_runs.get(bowler, 0) + runs_against

                        if is_legal_for_bowler:
                            p['balls_bowled'] += 1

                        # Phase
                        if is_powerplay:
                            p['pp_runs_conceded'] += runs_against
                            if is_legal_for_bowler:
                                p['pp_balls_bowled'] += 1
                        if is_death:
                            p['death_runs_conceded'] += runs_against
                            if is_legal_for_bowler:
                                p['death_balls_bowled'] += 1

                        # Season
                        ss = p['season_stats'][season]
                        ss['runs_conceded'] += runs_against
                        if is_legal_for_bowler:
                            ss['balls_bowled'] += 1

                    # Wickets
                    for wicket in delivery.get('wickets', []):
                        dismissed_player = wicket.get('player_out', '')
                        kind = wicket.get('kind', '')

                        if dismissed_player:
                            innings_batter_out.add(dismissed_player)
                            dp = players[dismissed_player]
                            dp['dismissals'].append(kind)

                        # Credit bowler (not for run out, retired, obstructing)
                        if kind not in ('run out', 'retired hurt', 'retired out', 'obstructing the field') and bowler:
                            bp = players[bowler]
                            bp['wickets'] += 1
                            innings_bowler_wickets[bowler] += 1

                            if is_powerplay:
                                bp['pp_wickets'] += 1
                            if is_death:
                                bp['death_wickets'] += 1

                            # Season
                            bp['season_stats'][season]['wickets'] += 1

            # End of innings: update batting innings counts and highest scores
            for batter_name, runs_scored in innings_batter_runs.items():
                p = players[batter_name]
                p['batting_innings'] += 1
                p['season_stats'][season]['batting_innings'] += 1
                if batter_name not in innings_batter_out:
                    p['not_outs'] += 1
                    p['season_stats'][season]['not_outs'] += 1
                if runs_scored > p['highest_score']:
                    p['highest_score'] = runs_scored

            # Best bowling
            for bowler_name, wkts in innings_bowler_wickets.items():
                p = players[bowler_name]
                p['bowling_innings'] += 1
                r = innings_bowler_runs.get(bowler_name, 0)
                if wkts > p['best_bowling_wickets'] or (wkts == p['best_bowling_wickets'] and r < p['best_bowling_runs']):
                    p['best_bowling_wickets'] = wkts
                    p['best_bowling_runs'] = r

    print(f"Found {len(players)} unique players across all IPL matches")
    return players


def build_output(players):
    """Convert raw stats into clean output JSON."""

    output = []

    for key, p in sorted(players.items(), key=lambda x: len(x[1]['matches']), reverse=True):
        matches = len(p['matches'])
        if matches < 1:
            continue

        # Batting stats
        innings = p['batting_innings']
        not_outs = p['not_outs']
        runs = p['runs']
        balls = p['balls_faced']
        dismissals_count = innings - not_outs
        avg = round(runs / max(dismissals_count, 1), 2) if innings > 0 else 0
        sr = round((runs / max(balls, 1)) * 100, 2) if balls > 0 else 0

        # Bowling stats
        wickets = p['wickets']
        balls_bowled = p['balls_bowled']
        runs_conceded = p['runs_conceded']
        overs = balls_bowled // 6 + (balls_bowled % 6) / 10  # display overs
        economy = round(runs_conceded / max(balls_bowled / 6, 0.1), 2) if balls_bowled > 0 else 0
        bowl_avg = round(runs_conceded / max(wickets, 1), 2) if wickets > 0 else 0

        # Season-by-season
        seasons = {}
        for season, ss in sorted(p['season_stats'].items()):
            sm = len(ss['matches'])
            if sm == 0:
                continue
            s_innings = ss['batting_innings']
            s_not_outs = ss['not_outs']
            s_runs = ss['runs']
            s_balls = ss['balls_faced']
            s_dismissals = s_innings - s_not_outs
            seasons[season] = {
                'matches': sm,
                'runs': s_runs,
                'balls_faced': s_balls,
                'avg': round(s_runs / max(s_dismissals, 1), 2) if s_innings > 0 else 0,
                'sr': round((s_runs / max(s_balls, 1)) * 100, 2) if s_balls > 0 else 0,
                'fours': ss['fours'],
                'sixes': ss['sixes'],
                'wickets': ss['wickets'],
                'balls_bowled': ss['balls_bowled'],
                'runs_conceded': ss['runs_conceded'],
                'economy': round(ss['runs_conceded'] / max(ss['balls_bowled'] / 6, 0.1), 2) if ss['balls_bowled'] > 0 else 0,
            }

        # Top venues
        top_venues = sorted(p['venue_runs'].items(), key=lambda x: x[1], reverse=True)[:5]
        venue_stats = {}
        for venue, vruns in top_venues:
            vballs = p['venue_balls'].get(venue, 1)
            venue_stats[venue] = {
                'runs': vruns,
                'balls': vballs,
                'sr': round((vruns / max(vballs, 1)) * 100, 2),
            }

        player_data = {
            'name': p['name'],
            'matches': matches,
            'seasons_played': sorted(p['seasons']),
            'teams': sorted(p['teams']),
            'batting': {
                'innings': innings,
                'runs': runs,
                'balls_faced': balls,
                'avg': avg,
                'sr': sr,
                'highest': p['highest_score'],
                'fours': p['fours'],
                'sixes': p['sixes'],
                'not_outs': not_outs,
            },
            'bowling': {
                'innings': p['bowling_innings'],
                'balls_bowled': balls_bowled,
                'runs_conceded': runs_conceded,
                'wickets': wickets,
                'economy': economy,
                'avg': bowl_avg,
                'best': f"{p['best_bowling_wickets']}/{p['best_bowling_runs']}" if p['best_bowling_wickets'] > 0 else None,
            },
            'phases': {
                'powerplay': {
                    'bat_runs': p['pp_runs'], 'bat_balls': p['pp_balls_faced'],
                    'bat_sr': round((p['pp_runs'] / max(p['pp_balls_faced'], 1)) * 100, 2) if p['pp_balls_faced'] > 0 else 0,
                    'bowl_wickets': p['pp_wickets'], 'bowl_balls': p['pp_balls_bowled'],
                    'bowl_economy': round(p['pp_runs_conceded'] / max(p['pp_balls_bowled'] / 6, 0.1), 2) if p['pp_balls_bowled'] > 0 else 0,
                },
                'death': {
                    'bat_runs': p['death_runs'], 'bat_balls': p['death_balls_faced'],
                    'bat_sr': round((p['death_runs'] / max(p['death_balls_faced'], 1)) * 100, 2) if p['death_balls_faced'] > 0 else 0,
                    'bowl_wickets': p['death_wickets'], 'bowl_balls': p['death_balls_bowled'],
                    'bowl_economy': round(p['death_runs_conceded'] / max(p['death_balls_bowled'] / 6, 0.1), 2) if p['death_balls_bowled'] > 0 else 0,
                },
            },
            'seasons': seasons,
            'venues': venue_stats,
        }

        output.append(player_data)

    return output


if __name__ == '__main__':
    players = parse_all_matches()
    output = build_output(players)

    # Save full stats
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(output)} players to {OUTPUT_FILE}")
    print(f"Top 10 by matches:")
    for p in output[:10]:
        print(f"  {p['name']:25s}  {p['matches']:4d} matches  {p['batting']['runs']:5d} runs  {p['bowling']['wickets']:3d} wickets")
