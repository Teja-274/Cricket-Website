#!/usr/bin/env python3
"""
Parameterized Cricsheet data cleaner that handles any tournament.
Usage: python clean_tournament.py <tournament_code> <data_dir_name>
Example: python clean_tournament.py SMAT sma_json
"""

import json
import os
import csv
import sys
from collections import defaultdict
from name_mappings import VENUE_MAP, normalize_season, get_full_name

# SMAT-specific team mapping (Indian state teams)
SMAT_TEAM_MAP = {
    # Mainstream Ranji teams - keep names as-is
    'Mumbai': ('Mumbai', 'MUM', '#FF6B35'),
    'Delhi': ('Delhi', 'DEL', '#1F4E8C'),
    'Karnataka': ('Karnataka', 'KAR', '#E91E63'),
    'Tamil Nadu': ('Tamil Nadu', 'TN', '#9C27B0'),
    'Bengal': ('Bengal', 'BEN', '#FFC107'),
    'Hyderabad': ('Hyderabad', 'HYD', '#3F51B5'),
    'Punjab': ('Punjab', 'PUN', '#F44336'),
    'Haryana': ('Haryana', 'HAR', '#00BCD4'),
    'Gujarat': ('Gujarat', 'GUJ', '#FF9800'),
    'Baroda': ('Baroda', 'BAR', '#E91E63'),
    'Saurashtra': ('Saurashtra', 'SAU', '#795548'),
    'Maharashtra': ('Maharashtra', 'MAH', '#673AB7'),
    'Vidarbha': ('Vidarbha', 'VID', '#FF5722'),
    'Madhya Pradesh': ('Madhya Pradesh', 'MP', '#009688'),
    'Uttar Pradesh': ('Uttar Pradesh', 'UP', '#4CAF50'),
    'Rajasthan': ('Rajasthan', 'RAJ', '#FFC107'),
    'Kerala': ('Kerala', 'KER', '#03A9F4'),
    'Andhra': ('Andhra', 'AND', '#8BC34A'),
    'Odisha': ('Odisha', 'ODI', '#9E9E9E'),
    'Jharkhand': ('Jharkhand', 'JHA', '#607D8B'),
    'Chhattisgarh': ('Chhattisgarh', 'CHH', '#795548'),
    'Goa': ('Goa', 'GOA', '#4CAF50'),
    'Tripura': ('Tripura', 'TRI', '#607D8B'),
    'Services': ('Services', 'SER', '#212121'),
    'Railways': ('Railways', 'RAI', '#424242'),
    'Assam': ('Assam', 'ASS', '#FF5722'),
    'Bihar': ('Bihar', 'BIH', '#9E9E9E'),
    'Meghalaya': ('Meghalaya', 'MEG', '#607D8B'),
    'Mizoram': ('Mizoram', 'MIZ', '#795548'),
    'Nagaland': ('Nagaland', 'NAG', '#9E9E9E'),
    'Arunachal Pradesh': ('Arunachal Pradesh', 'ARP', '#9E9E9E'),
    'Manipur': ('Manipur', 'MAN', '#9E9E9E'),
    'Sikkim': ('Sikkim', 'SIK', '#9E9E9E'),
    'Pondicherry': ('Pondicherry', 'POND', '#9E9E9E'),
    'Jammu & Kashmir': ('Jammu & Kashmir', 'JK', '#3F51B5'),
    'Uttarakhand': ('Uttarakhand', 'UTT', '#4CAF50'),
    'Himachal Pradesh': ('Himachal Pradesh', 'HP', '#03A9F4'),
    'Chandigarh': ('Chandigarh', 'CHD', '#FF9800'),
}

# BBL franchise mapping
BBL_TEAM_MAP = {
    'Adelaide Strikers': ('Adelaide Strikers', 'ADS', '#003F87'),
    'Brisbane Heat': ('Brisbane Heat', 'BRH', '#7A1A2E'),
    'Hobart Hurricanes': ('Hobart Hurricanes', 'HBH', '#522D80'),
    'Melbourne Renegades': ('Melbourne Renegades', 'MLR', '#D2232A'),
    'Melbourne Stars': ('Melbourne Stars', 'MLS', '#00A14B'),
    'Perth Scorchers': ('Perth Scorchers', 'PRS', '#F58220'),
    'Sydney Sixers': ('Sydney Sixers', 'SYS', '#E91E63'),
    'Sydney Thunder': ('Sydney Thunder', 'SYT', '#00C2D1'),
}

# PSL franchise mapping
PSL_TEAM_MAP = {
    'Islamabad United': ('Islamabad United', 'ISU', '#D4A21A'),
    'Karachi Kings': ('Karachi Kings', 'KAK', '#0A4174'),
    'Lahore Qalandars': ('Lahore Qalandars', 'LHQ', '#1FAA59'),
    'Multan Sultans': ('Multan Sultans', 'MUS', '#1E7F75'),
    'Peshawar Zalmi': ('Peshawar Zalmi', 'PSZ', '#FFD800'),
    'Quetta Gladiators': ('Quetta Gladiators', 'QUG', '#5E2B82'),
}

# CPL franchise mapping
CPL_TEAM_MAP = {
    'Antigua Hawksbills': ('Antigua Hawksbills', 'ANH', '#B91C1C'),
    'Barbados Tridents': ('Barbados Royals', 'BAR', '#1E3A8A'),
    'Barbados Royals': ('Barbados Royals', 'BAR', '#1E3A8A'),
    'Guyana Amazon Warriors': ('Guyana Amazon Warriors', 'GAW', '#F59E0B'),
    'Jamaica Tallawahs': ('Jamaica Tallawahs', 'JAT', '#16A34A'),
    'St Kitts and Nevis Patriots': ('St Kitts & Nevis Patriots', 'SKN', '#0EA5E9'),
    'Saint Kitts and Nevis Patriots': ('St Kitts & Nevis Patriots', 'SKN', '#0EA5E9'),
    'St Lucia Stars': ('St Lucia Kings', 'SLK', '#7C3AED'),
    'Saint Lucia Stars': ('St Lucia Kings', 'SLK', '#7C3AED'),
    'St Lucia Zouks': ('St Lucia Kings', 'SLK', '#7C3AED'),
    'Saint Lucia Kings': ('St Lucia Kings', 'SLK', '#7C3AED'),
    'Trinbago Knight Riders': ('Trinbago Knight Riders', 'TKR', '#7E22CE'),
}

# Per-tournament ID offsets to prevent collision across tournaments
# IPL (existing): innings 0-99k, deliveries 0-999k, wickets 0-99k
TOURNAMENT_OFFSETS = {
    'SMAT':  {'innings': 100_000, 'deliveries': 1_000_000, 'wickets': 100_000},
    'BBL':   {'innings': 200_000, 'deliveries': 2_000_000, 'wickets': 200_000},
    'PSL':   {'innings': 300_000, 'deliveries': 3_000_000, 'wickets': 300_000},
    'CPL':   {'innings': 400_000, 'deliveries': 4_000_000, 'wickets': 400_000},
    'T20I':  {'innings': 500_000, 'deliveries': 5_000_000, 'wickets': 500_000},
}

TEAM_MAPS = {
    'SMAT': SMAT_TEAM_MAP,
    'BBL': BBL_TEAM_MAP,
    'PSL': PSL_TEAM_MAP,
    'CPL': CPL_TEAM_MAP,
    'T20I': {},  # 100+ international teams - use fallback initials
}


def get_phase(over_num):
    if over_num < 6: return 'powerplay'
    if over_num < 15: return 'middle'
    return 'death'


def get_extra_type(extras):
    if 'wides' in extras: return 'wide'
    if 'noballs' in extras: return 'noball'
    if 'byes' in extras: return 'bye'
    if 'legbyes' in extras: return 'legbye'
    if 'penalty' in extras: return 'penalty'
    return None


def get_team_info(team_name, team_map):
    """Get clean team name, shortname, and color. Falls back gracefully for unknown teams."""
    if team_name in team_map:
        return team_map[team_name]
    # Auto-generate for unknown teams
    short = ''.join(w[0] for w in team_name.split()[:3]).upper()
    return (team_name, short[:5], '#666666')


def main():
    if len(sys.argv) < 3:
        print("Usage: python clean_tournament.py <TOURNAMENT_CODE> <data_dir_name>")
        print("Example: python clean_tournament.py SMAT sma_json")
        sys.exit(1)

    tournament_code = sys.argv[1].upper()
    data_dir_name = sys.argv[2]

    DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', data_dir_name)
    OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'data', tournament_code.lower())
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Choose team map based on tournament
    team_map = TEAM_MAPS.get(tournament_code, {})

    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith('.json')])
    print(f"Processing {len(files)} {tournament_code} matches...")

    # Per-tournament ID offsets to prevent cross-tournament collision
    if tournament_code not in TOURNAMENT_OFFSETS:
        print(f"ERROR: No ID offset defined for {tournament_code}. Add to TOURNAMENT_OFFSETS.")
        sys.exit(1)
    offsets = TOURNAMENT_OFFSETS[tournament_code]
    INNINGS_ID_OFFSET = offsets['innings']
    DELIVERY_ID_OFFSET = offsets['deliveries']
    WICKET_ID_OFFSET = offsets['wickets']

    players_map = {}
    teams_set = {}
    venues_set = {}
    seasons_set = {}
    matches_list = []
    innings_list = []
    deliveries_list = []
    wickets_list = []
    player_match_stats = defaultdict(lambda: {
        'runs_scored': 0, 'balls_faced': 0, 'fours': 0, 'sixes': 0,
        'is_not_out': True, 'dismissal_kind': None,
        'balls_bowled': 0, 'runs_conceded': 0, 'wickets_taken': 0,
        'dots_bowled': 0, 'extras_conceded': 0,
        'catches': 0, 'run_outs': 0, 'stumpings': 0,
    })

    innings_counter = INNINGS_ID_OFFSET
    delivery_counter = DELIVERY_ID_OFFSET
    wicket_counter = WICKET_ID_OFFSET

    for fi, fname in enumerate(files):
        if (fi + 1) % 100 == 0:
            print(f"  {fi+1}/{len(files)}...")

        match_id = f"{tournament_code.lower()}_{fname.replace('.json', '')}"
        with open(os.path.join(DATA_DIR, fname), 'r', encoding='utf-8') as f:
            raw = json.load(f)

        info = raw['info']

        # Registry
        registry = info.get('registry', {}).get('people', {})
        for short_name, uid in registry.items():
            if uid not in players_map:
                players_map[uid] = {
                    'id': uid,
                    'name': get_full_name(short_name),
                    'short_name': short_name,
                }

        def pid(short_name):
            return registry.get(short_name, short_name)

        raw_season = str(info.get('season', ''))
        year = normalize_season(raw_season)
        if year not in seasons_set:
            seasons_set[year] = raw_season

        raw_teams = info.get('teams', [])
        team_ids = []
        for rt in raw_teams:
            clean_name, short, color = get_team_info(rt, team_map)
            if clean_name not in teams_set:
                teams_set[clean_name] = {
                    'name': clean_name,
                    'short_name': short,
                    'color': color,
                    'historical_names': set(),
                    'is_active': True,
                }
            teams_set[clean_name]['historical_names'].add(rt)
            team_ids.append(clean_name)

        raw_venue = info.get('venue', 'Unknown')
        clean_venue, city = VENUE_MAP.get(raw_venue, (raw_venue, info.get('city', 'Unknown')))
        if clean_venue not in venues_set:
            venues_set[clean_venue] = {'name': clean_venue, 'city': city, 'raw_names': set()}
        venues_set[clean_venue]['raw_names'].add(raw_venue)

        toss = info.get('toss', {})
        toss_winner_raw = toss.get('winner', '')
        toss_winner = get_team_info(toss_winner_raw, team_map)[0] if toss_winner_raw else ''

        outcome = info.get('outcome', {})
        winner_raw = outcome.get('winner', '')
        winner = get_team_info(winner_raw, team_map)[0] if winner_raw else None
        by = outcome.get('by', {})

        event = info.get('event', {})
        stage_raw = event.get('stage', '')
        stage = 'league'
        if stage_raw:
            sl = stage_raw.lower()
            if 'final' in sl: stage = 'final'
            elif 'qualifier' in sl: stage = 'qualifier'
            elif 'eliminator' in sl: stage = 'eliminator'
            elif 'semi' in sl: stage = 'semifinal'

        pom_list = info.get('player_of_match', [])
        pom = pid(pom_list[0]) if pom_list else None

        match_team_scores = []

        for inn_idx, innings in enumerate(raw.get('innings', [])):
            innings_counter += 1
            inn_id = innings_counter
            bat_team_raw = innings.get('team', '')
            bat_team = get_team_info(bat_team_raw, team_map)[0]
            bowl_team = [t for t in team_ids if t != bat_team]
            bowl_team = bowl_team[0] if bowl_team else bat_team

            is_super = innings.get('super_over', False)
            target = innings.get('target', {})

            inn_runs = 0
            inn_wickets = 0
            inn_overs = 0
            inn_batters_out = set()

            for over_data in innings.get('overs', []):
                over_num = over_data.get('over', 0)
                ball_in_over = 0

                for delivery in over_data.get('deliveries', []):
                    delivery_counter += 1
                    ball_in_over += 1

                    batter = delivery.get('batter', '')
                    bowler = delivery.get('bowler', '')
                    non_striker = delivery.get('non_striker', '')
                    runs = delivery.get('runs', {})
                    bat_runs = runs.get('batter', 0)
                    ext_runs = runs.get('extras', 0)
                    tot_runs = runs.get('total', 0)
                    extras = delivery.get('extras', {})

                    extra_type = get_extra_type(extras)
                    is_wide = extra_type == 'wide'
                    is_noball = extra_type == 'noball'
                    is_legal = not is_wide and not is_noball
                    is_boundary = bat_runs in (4, 6)
                    is_dot = tot_runs == 0

                    phase = get_phase(over_num)
                    batter_id = pid(batter)
                    bowler_id = pid(bowler)
                    ns_id = pid(non_striker)

                    inn_runs += tot_runs

                    # Batter stats
                    pms_key = (match_id, batter_id)
                    pms = player_match_stats[pms_key]
                    pms['runs_scored'] += bat_runs
                    pms['team'] = bat_team
                    pms['season'] = year
                    if not is_wide:
                        pms['balls_faced'] += 1
                    if bat_runs == 4: pms['fours'] += 1
                    if bat_runs == 6: pms['sixes'] += 1

                    # Bowler stats
                    pms_bowl_key = (match_id, bowler_id)
                    pms_bowl = player_match_stats[pms_bowl_key]
                    pms_bowl['team'] = bowl_team
                    pms_bowl['season'] = year
                    bowl_runs = tot_runs - extras.get('byes', 0) - extras.get('legbyes', 0)
                    pms_bowl['runs_conceded'] += bowl_runs
                    if is_legal:
                        pms_bowl['balls_bowled'] += 1
                    if is_dot:
                        pms_bowl['dots_bowled'] += 1
                    if ext_runs > 0 and (is_wide or is_noball):
                        pms_bowl['extras_conceded'] += ext_runs

                    deliveries_list.append({
                        'id': delivery_counter,
                        'innings_id': inn_id,
                        'match_id': match_id,
                        'over_number': over_num,
                        'ball_number': ball_in_over,
                        'phase': phase,
                        'batter_id': batter_id,
                        'bowler_id': bowler_id,
                        'non_striker_id': ns_id,
                        'batter_runs': bat_runs,
                        'extra_runs': ext_runs,
                        'total_runs': tot_runs,
                        'extra_type': extra_type,
                        'is_legal': is_legal,
                        'is_boundary': is_boundary,
                        'is_dot': is_dot,
                        'tournament': tournament_code,
                    })

                    for wkt in delivery.get('wickets', []):
                        wicket_counter += 1
                        kind = wkt.get('kind', '')
                        out_player = wkt.get('player_out', '')
                        out_id = pid(out_player)
                        inn_batters_out.add(out_id)
                        inn_wickets += 1

                        fielders = wkt.get('fielders', [])
                        fielder_id = pid(fielders[0]['name']) if fielders and 'name' in fielders[0] else None

                        is_bowler_wkt = kind not in ('run out', 'retired hurt', 'retired out', 'obstructing the field')

                        wickets_list.append({
                            'id': wicket_counter,
                            'delivery_id': delivery_counter,
                            'match_id': match_id,
                            'innings_id': inn_id,
                            'batter_id': out_id,
                            'bowler_id': bowler_id,
                            'fielder_id': fielder_id,
                            'kind': kind,
                            'is_bowler_wicket': is_bowler_wkt,
                            'tournament': tournament_code,
                        })

                        if is_bowler_wkt:
                            pms_bowl['wickets_taken'] += 1

                        if fielder_id and kind == 'caught':
                            f_key = (match_id, fielder_id)
                            player_match_stats[f_key]['catches'] += 1
                            player_match_stats[f_key]['team'] = bowl_team
                            player_match_stats[f_key]['season'] = year
                        if fielder_id and kind == 'run out':
                            f_key = (match_id, fielder_id)
                            player_match_stats[f_key]['run_outs'] += 1
                        if fielder_id and kind == 'stumped':
                            f_key = (match_id, fielder_id)
                            player_match_stats[f_key]['stumpings'] += 1

                        player_match_stats[(match_id, out_id)]['is_not_out'] = False
                        player_match_stats[(match_id, out_id)]['dismissal_kind'] = kind

                if any(d for d in over_data.get('deliveries', []) if not get_extra_type(d.get('extras', {})) in ('wide', 'noball')):
                    inn_overs = over_num + 1

            for key, pms in player_match_stats.items():
                if key[0] == match_id and pms.get('balls_bowled', 0) > 0:
                    bb = pms['balls_bowled']
                    pms['overs_bowled'] = bb // 6 + (bb % 6) / 10

            match_team_scores.append({'score': inn_runs, 'wickets': inn_wickets, 'overs': inn_overs})

            innings_list.append({
                'id': inn_id,
                'match_id': match_id,
                'innings_number': inn_idx + 1,
                'batting_team': bat_team,
                'bowling_team': bowl_team,
                'total_runs': inn_runs,
                'total_wickets': inn_wickets,
                'total_overs': inn_overs,
                'target_runs': target.get('runs'),
                'is_super_over': is_super,
                'tournament': tournament_code,
            })

        date = info.get('dates', [''])[0]
        t1_score = match_team_scores[0] if len(match_team_scores) > 0 else {}
        t2_score = match_team_scores[1] if len(match_team_scores) > 1 else {}

        matches_list.append({
            'id': match_id,
            'season_year': year,
            'date': date,
            'venue': clean_venue,
            'team1': team_ids[0] if len(team_ids) > 0 else '',
            'team2': team_ids[1] if len(team_ids) > 1 else '',
            'toss_winner': toss_winner,
            'toss_decision': toss.get('decision', ''),
            'winner': winner,
            'win_by_runs': by.get('runs'),
            'win_by_wickets': by.get('wickets'),
            'player_of_match': pom,
            'stage': stage,
            'team1_score': t1_score.get('score'),
            'team1_wickets': t1_score.get('wickets'),
            'team1_overs': t1_score.get('overs'),
            'team2_score': t2_score.get('score'),
            'team2_wickets': t2_score.get('wickets'),
            'team2_overs': t2_score.get('overs'),
            'tournament': tournament_code,
        })

    # Save outputs
    print(f"\nSaving cleaned {tournament_code} data...")

    players_out = sorted(players_map.values(), key=lambda x: x['name'])
    with open(os.path.join(OUTPUT_DIR, 'players.json'), 'w', encoding='utf-8') as f:
        json.dump(players_out, f, indent=2, ensure_ascii=False)
    print(f"  players.json: {len(players_out)} players")

    teams_out = []
    for name, t in sorted(teams_set.items()):
        teams_out.append({
            'name': name, 'short_name': t['short_name'],
            'color': t['color'], 'is_active': t['is_active'],
            'historical_names': sorted(t['historical_names']),
        })
    with open(os.path.join(OUTPUT_DIR, 'teams.json'), 'w', encoding='utf-8') as f:
        json.dump(teams_out, f, indent=2, ensure_ascii=False)
    print(f"  teams.json: {len(teams_out)} teams")

    venues_out = []
    for name, v in sorted(venues_set.items()):
        venues_out.append({
            'name': name, 'city': v['city'],
            'raw_names': sorted(v['raw_names']),
        })
    with open(os.path.join(OUTPUT_DIR, 'venues.json'), 'w', encoding='utf-8') as f:
        json.dump(venues_out, f, indent=2, ensure_ascii=False)
    print(f"  venues.json: {len(venues_out)} venues")

    seasons_out = [{'year': y, 'raw_label': seasons_set[y]} for y in sorted(seasons_set.keys())]
    with open(os.path.join(OUTPUT_DIR, 'seasons.json'), 'w', encoding='utf-8') as f:
        json.dump(seasons_out, f, indent=2, ensure_ascii=False)
    print(f"  seasons.json: {len(seasons_out)} seasons")

    with open(os.path.join(OUTPUT_DIR, 'matches.json'), 'w', encoding='utf-8') as f:
        json.dump(matches_list, f, indent=2, ensure_ascii=False)
    print(f"  matches.json: {len(matches_list)} matches")

    with open(os.path.join(OUTPUT_DIR, 'innings.json'), 'w', encoding='utf-8') as f:
        json.dump(innings_list, f, indent=2, ensure_ascii=False)
    print(f"  innings.json: {len(innings_list)} innings")

    csv_path = os.path.join(OUTPUT_DIR, 'deliveries.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'id', 'innings_id', 'match_id', 'over_number', 'ball_number', 'phase',
            'batter_id', 'bowler_id', 'non_striker_id',
            'batter_runs', 'extra_runs', 'total_runs',
            'extra_type', 'is_legal', 'is_boundary', 'is_dot', 'tournament',
        ])
        writer.writeheader()
        writer.writerows(deliveries_list)
    print(f"  deliveries.csv: {len(deliveries_list)} deliveries")

    with open(os.path.join(OUTPUT_DIR, 'wickets.json'), 'w', encoding='utf-8') as f:
        json.dump(wickets_list, f, indent=2, ensure_ascii=False)
    print(f"  wickets.json: {len(wickets_list)} wickets")

    pms_out = []
    for (mid, plid), stats in player_match_stats.items():
        pms_out.append({
            'match_id': mid,
            'player_id': plid,
            'team': stats.get('team', ''),
            'season_year': stats.get('season', 0),
            'runs_scored': stats['runs_scored'],
            'balls_faced': stats['balls_faced'],
            'fours': stats['fours'],
            'sixes': stats['sixes'],
            'is_not_out': stats['is_not_out'],
            'dismissal_kind': stats['dismissal_kind'],
            'overs_bowled': stats.get('overs_bowled', 0),
            'runs_conceded': stats['runs_conceded'],
            'wickets_taken': stats['wickets_taken'],
            'dots_bowled': stats['dots_bowled'],
            'extras_conceded': stats['extras_conceded'],
            'catches': stats['catches'],
            'run_outs': stats['run_outs'],
            'stumpings': stats['stumpings'],
            'tournament': tournament_code,
        })
    with open(os.path.join(OUTPUT_DIR, 'player_match_stats.json'), 'w', encoding='utf-8') as f:
        json.dump(pms_out, f, ensure_ascii=False)
    print(f"  player_match_stats.json: {len(pms_out)} entries")

    print(f"\nDone! {tournament_code} data saved to {OUTPUT_DIR}")
    print(f"  {len(players_out)} players | {len(teams_out)} teams | {len(venues_out)} venues")
    print(f"  {len(matches_list)} matches | {len(innings_list)} innings | {len(deliveries_list)} deliveries | {len(wickets_list)} wickets")


if __name__ == '__main__':
    main()
