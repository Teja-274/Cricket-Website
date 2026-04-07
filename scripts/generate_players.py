#!/usr/bin/env python3
"""
Generate the final players.ts file using real Cricsheet IPL stats.
Takes the top 250 players by matches, assigns roles/tiers, and generates TypeScript.
"""

import json
import os

INPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'ipl_stats.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'players_real.ts')

# Known player metadata (role, batting style, bowling style, state, age)
# For players not in this list, we infer from stats
KNOWN_PLAYERS = {
    'V Kohli': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'Delhi', 'age': 37, 'team': 'Royal Challengers Bengaluru'},
    'RG Sharma': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Mumbai', 'age': 39, 'team': 'Mumbai Indians'},
    'MS Dhoni': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'Jharkhand', 'age': 44, 'team': 'Chennai Super Kings'},
    'RA Jadeja': {'role': 'All-Rounder', 'bat': 'Left-Hand', 'bowl': 'Left-Arm Spin', 'state': 'Gujarat', 'age': 36, 'team': 'Chennai Super Kings'},
    'JJ Bumrah': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast', 'state': 'Gujarat', 'age': 31, 'team': 'Mumbai Indians'},
    'S Dhawan': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Delhi', 'age': 40, 'team': 'None'},
    'KD Karthik': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'Tamil Nadu', 'age': 40, 'team': 'None'},
    'R Ashwin': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Tamil Nadu', 'age': 39, 'team': 'None'},
    'SK Raina': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Uttar Pradesh', 'age': 38, 'team': 'None'},
    'AB de Villiers': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'International', 'age': 41, 'team': 'None'},
    'DA Warner': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'International', 'age': 39, 'team': 'None'},
    'KL Rahul': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'Karnataka', 'age': 33, 'team': 'Lucknow Super Giants'},
    'SA Yadav': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'Mumbai', 'age': 34, 'team': 'Mumbai Indians'},
    'RR Pant': {'role': 'WK-Batsman', 'bat': 'Left-Hand', 'bowl': 'None', 'state': 'Delhi', 'age': 27, 'team': 'Lucknow Super Giants'},
    'SV Samson': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'Kerala', 'age': 30, 'team': 'Rajasthan Royals'},
    'HH Pandya': {'role': 'All-Rounder', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast Medium', 'state': 'Gujarat', 'age': 31, 'team': 'Mumbai Indians'},
    'YBK Jaiswal': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'Mumbai', 'age': 23, 'team': 'Rajasthan Royals'},
    'Rashid Khan': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'International', 'age': 27, 'team': 'Gujarat Titans'},
    'SP Narine': {'role': 'All-Rounder', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'International', 'age': 36, 'team': 'Kolkata Knight Riders'},
    'AD Russell': {'role': 'All-Rounder', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast', 'state': 'International', 'age': 36, 'team': 'Kolkata Knight Riders'},
    'PP Chawla': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'Uttar Pradesh', 'age': 36, 'team': 'None'},
    'Harbhajan Singh': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Punjab', 'age': 44, 'team': 'None'},
    'YS Chahal': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'Haryana', 'age': 35, 'team': 'None'},
    'B Kumar': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'Uttar Pradesh', 'age': 35, 'team': 'None'},
    'DJ Bravo': {'role': 'All-Rounder', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'International', 'age': 41, 'team': 'None'},
    'Arshdeep Singh': {'role': 'Bowler', 'bat': 'Left-Hand', 'bowl': 'Left-Arm Fast Medium', 'state': 'Punjab', 'age': 25, 'team': 'Punjab Kings'},
    'Mohammed Shami': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast Medium', 'state': 'Uttar Pradesh', 'age': 35, 'team': 'None'},
    'SS Iyer': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Mumbai', 'age': 30, 'team': 'Kolkata Knight Riders'},
    'Kuldeep Yadav': {'role': 'Bowler', 'bat': 'Left-Hand', 'bowl': 'Left-Arm Wrist Spin', 'state': 'Uttar Pradesh', 'age': 30, 'team': 'Delhi Capitals'},
    'RV Uthappa': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'Karnataka', 'age': 39, 'team': 'None'},
    'AT Rayudu': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Hyderabad', 'age': 39, 'team': 'None'},
    'Shubman Gill': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Punjab', 'age': 25, 'team': 'Gujarat Titans'},
    'RD Gaikwad': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Maharashtra', 'age': 28, 'team': 'Chennai Super Kings'},
    'Tilak Varma': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'Hyderabad', 'age': 22, 'team': 'Mumbai Indians'},
    'Rinku Singh': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'None', 'state': 'Uttar Pradesh', 'age': 27, 'team': 'Kolkata Knight Riders'},
    'JC Buttler': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'International', 'age': 34, 'team': 'Rajasthan Royals'},
    'Q de Kock': {'role': 'WK-Batsman', 'bat': 'Left-Hand', 'bowl': 'None', 'state': 'International', 'age': 32, 'team': 'Lucknow Super Giants'},
    'PD Salt': {'role': 'WK-Batsman', 'bat': 'Right-Hand', 'bowl': 'None', 'state': 'International', 'age': 28, 'team': 'Kolkata Knight Riders'},
    'MA Starc': {'role': 'Bowler', 'bat': 'Left-Hand', 'bowl': 'Left-Arm Fast', 'state': 'International', 'age': 36, 'team': 'Kolkata Knight Riders'},
    'KA Pollard': {'role': 'All-Rounder', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Medium', 'state': 'International', 'age': 37, 'team': 'None'},
    'CH Gayle': {'role': 'Batsman', 'bat': 'Left-Hand', 'bowl': 'Left-Arm Spin', 'state': 'International', 'age': 45, 'team': 'None'},
    'GJ Maxwell': {'role': 'All-Rounder', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'International', 'age': 37, 'team': 'None'},
    'KS Williamson': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Off Spin', 'state': 'International', 'age': 35, 'team': 'None'},
    'F du Plessis': {'role': 'Batsman', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Leg Spin', 'state': 'International', 'age': 41, 'team': 'None'},
    'TA Boult': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Left-Arm Fast', 'state': 'International', 'age': 36, 'team': 'None'},
    'K Rabada': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast', 'state': 'International', 'age': 30, 'team': 'Punjab Kings'},
    'PJ Cummins': {'role': 'Bowler', 'bat': 'Right-Hand', 'bowl': 'Right-Arm Fast', 'state': 'International', 'age': 32, 'team': 'Sunrisers Hyderabad'},
}


def infer_role(p):
    """Infer player role from stats."""
    batting = p['batting']
    bowling = p['bowling']
    has_bat = batting['runs'] > 100
    has_bowl = bowling['wickets'] > 10

    if has_bat and has_bowl and batting['runs'] > 300 and bowling['wickets'] > 20:
        return 'All-Rounder'
    if bowling['wickets'] > batting['runs'] / 20 and bowling['wickets'] > 15:
        return 'Bowler'
    return 'Batsman'


def infer_tier(p):
    """Infer tier based on matches and performance."""
    matches = p['matches']
    avg = p['batting']['avg']
    runs = p['batting']['runs']
    wickets = p['bowling']['wickets']

    if matches >= 100 and (runs >= 3000 or wickets >= 100):
        return 'International Ready'
    if matches >= 50 and (runs >= 1000 or wickets >= 40):
        return 'IPL Proven'
    if matches >= 20:
        return 'Domestic Star'
    return 'Emerging Talent'


def estimate_base_price(p, tier):
    """Estimate auction base price based on tier and stats."""
    if tier == 'International Ready':
        return 2.0
    if tier == 'IPL Proven':
        if p['batting']['runs'] > 2000 or p['bowling']['wickets'] > 80:
            return 1.5
        return 1.0
    if tier == 'Domestic Star':
        return 0.5
    return 0.2


def main():
    with open(INPUT_FILE) as f:
        all_players = json.load(f)

    # Take top 250 by matches
    top_players = all_players[:250]

    lines = []
    lines.append("// Auto-generated from Cricsheet IPL ball-by-ball data (1,175 matches)")
    lines.append("// Generated by scripts/generate_players.py")
    lines.append("")
    lines.append("export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'WK-Batsman'")
    lines.append("export type PlayerTier = 'International Ready' | 'IPL Proven' | 'Domestic Star' | 'Emerging Talent'")
    lines.append("export type PlayerStatus = 'pending' | 'active' | 'sold' | 'unsold'")
    lines.append("")
    lines.append("export interface PlayerStats {")
    lines.append("  ipl?: { matches: number; runs?: number; avg?: number; sr?: number; wickets?: number; economy?: number; highest?: number; fours?: number; sixes?: number; best?: string | null }")
    lines.append("  phases?: { powerplay: { bat_sr: number; bowl_economy: number }; death: { bat_sr: number; bowl_economy: number } }")
    lines.append("  seasons?: Record<string, { matches: number; runs: number; avg: number; sr: number; wickets: number; economy: number }>")
    lines.append("}")
    lines.append("")
    lines.append("export interface Player {")
    lines.append("  id: string")
    lines.append("  name: string")
    lines.append("  role: PlayerRole")
    lines.append("  battingStyle: string")
    lines.append("  bowlingStyle: string")
    lines.append("  state: string")
    lines.append("  iplTeam: string")
    lines.append("  basePriceCr: number")
    lines.append("  isCapped: boolean")
    lines.append("  tier: PlayerTier")
    lines.append("  age: number")
    lines.append("  stats: PlayerStats")
    lines.append("  status: PlayerStatus")
    lines.append("  soldToId?: string")
    lines.append("  soldPriceCr?: number")
    lines.append("}")
    lines.append("")
    lines.append("export const PLAYERS: Player[] = [")

    for i, p in enumerate(top_players):
        name = p['name']
        known = KNOWN_PLAYERS.get(name, {})

        role = known.get('role', infer_role(p))
        tier = infer_tier(p)
        bat_style = known.get('bat', 'Right-Hand')
        bowl_style = known.get('bowl', 'Right-Arm Medium' if p['bowling']['wickets'] > 10 else 'None')
        state = known.get('state', 'India')
        age = known.get('age', 28)
        team = known.get('team', p['teams'][-1] if p['teams'] else 'None')
        base_price = estimate_base_price(p, tier)
        is_capped = p['matches'] >= 30 or tier == 'International Ready'

        # Compact season stats (last 5 seasons)
        season_entries = sorted(p.get('seasons', {}).items(), reverse=True)[:5]
        seasons_str = ', '.join([
            f"'{s}': {{ matches: {d['matches']}, runs: {d['runs']}, avg: {d['avg']}, sr: {d['sr']}, wickets: {d['wickets']}, economy: {d['economy']} }}"
            for s, d in season_entries if d['matches'] > 0
        ])

        bat = p['batting']
        bowl = p['bowling']
        phases = p['phases']

        best_str = f", best: \"{bowl['best']}\"" if bowl['best'] else ''
        stats = (
            f"ipl: {{ matches: {p['matches']}, runs: {bat['runs']}, avg: {bat['avg']}, sr: {bat['sr']}, "
            f"highest: {bat['highest']}, fours: {bat['fours']}, sixes: {bat['sixes']}, "
            f"wickets: {bowl['wickets']}, economy: {bowl['economy']}"
            f"{best_str} }}, "
            f"phases: {{ powerplay: {{ bat_sr: {phases['powerplay']['bat_sr']}, bowl_economy: {phases['powerplay']['bowl_economy']} }}, "
            f"death: {{ bat_sr: {phases['death']['bat_sr']}, bowl_economy: {phases['death']['bowl_economy']} }} }}"
        )

        if seasons_str:
            stats += f", seasons: {{ {seasons_str} }}"

        line = (
            f"  {{ id: 'p{i+1}', name: '{name}', role: '{role}', battingStyle: '{bat_style}', "
            f"bowlingStyle: '{bowl_style}', state: '{state}', iplTeam: '{team}', "
            f"basePriceCr: {base_price}, isCapped: {'true' if is_capped else 'false'}, "
            f"tier: '{tier}', age: {age}, "
            f"stats: {{ {stats} }}, status: 'pending' }},"
        )
        lines.append(line)

    lines.append("]")
    lines.append("")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f"Generated {len(top_players)} players to {OUTPUT_FILE}")
    role_counts = {}
    for r in ['Batsman', 'Bowler', 'All-Rounder', 'WK-Batsman']:
        role_counts[r] = sum(1 for p in top_players if KNOWN_PLAYERS.get(p['name'], {}).get('role', infer_role(p)) == r)
    print(f"Roles: {role_counts}")


if __name__ == '__main__':
    main()
