#!/usr/bin/env python3
"""
Enrich players.role / batting_style / bowling_style / nationality.

Two passes:
  1. CURATED — hand-mapped metadata for ~180 famous players (highest impact)
  2. INFERRED — auto-detect role from ball patterns in player_match_stats
     for everyone else (Batsman/Bowler/All-Rounder/WK-Batsman)

Run: python scripts/enrich_player_metadata.py
"""

import json
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
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                return line.split('=', 1)[1].strip()
    return None


KEY = _load_key()
if not KEY or not KEY.startswith('sb_secret_'):
    print('ERROR: SUPABASE_SERVICE_ROLE_KEY missing in .env')
    sys.exit(1)

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
}


# -----------------------------------------------------------------
# CURATED METADATA — name-based, lowercase comparison
# Format: name_lower → (role, batting_style, bowling_style, nationality)
# bowling_style: 'None' means doesn't bowl
# -----------------------------------------------------------------
CURATED = {
    # --- INDIAN BATSMEN (Right-Hand) ---
    'virat kohli':        ('Batsman',    'Right-Hand', 'Right-Arm Medium', 'India'),
    'rohit sharma':       ('Batsman',    'Right-Hand', 'Right-Arm Off Spin', 'India'),
    'shubman gill':       ('Batsman',    'Right-Hand', 'None', 'India'),
    'suryakumar yadav':   ('Batsman',    'Right-Hand', 'None', 'India'),
    'sanju samson':       ('WK-Batsman', 'Right-Hand', 'None', 'India'),
    'kl rahul':           ('WK-Batsman', 'Right-Hand', 'None', 'India'),
    'cheteshwar pujara':  ('Batsman',    'Right-Hand', 'None', 'India'),
    'ajinkya rahane':     ('Batsman',    'Right-Hand', 'None', 'India'),
    'sachin tendulkar':   ('Batsman',    'Right-Hand', 'Leg Spin', 'India'),
    'rahul dravid':       ('Batsman',    'Right-Hand', 'None', 'India'),
    'vvs laxman':         ('Batsman',    'Right-Hand', 'None', 'India'),
    'virender sehwag':    ('Batsman',    'Right-Hand', 'Off Spin', 'India'),
    'mayank agarwal':     ('Batsman',    'Right-Hand', 'None', 'India'),
    'rinku singh':        ('Batsman',    'Left-Hand',  'None', 'India'),
    'tilak varma':        ('Batsman',    'Left-Hand',  'None', 'India'),
    'sai sudharsan':      ('Batsman',    'Left-Hand',  'None', 'India'),
    'shreyas iyer':       ('Batsman',    'Right-Hand', 'None', 'India'),
    'venkatesh iyer':     ('Batsman',    'Left-Hand',  'Right-Arm Medium', 'India'),
    'devdutt padikkal':   ('Batsman',    'Left-Hand',  'None', 'India'),
    'ruturaj gaikwad':    ('Batsman',    'Right-Hand', 'Off Spin', 'India'),

    # --- INDIAN LEFT-HAND BATSMEN ---
    'sourav ganguly':     ('Batsman',    'Left-Hand',  'Right-Arm Medium', 'India'),
    'yuvraj singh':       ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'India'),
    'suresh raina':       ('Batsman',    'Left-Hand',  'Off Spin', 'India'),
    'gautam gambhir':     ('Batsman',    'Left-Hand',  'None', 'India'),
    'shikhar dhawan':     ('Batsman',    'Left-Hand',  'None', 'India'),
    'yashasvi jaiswal':   ('Batsman',    'Left-Hand',  'Leg Spin', 'India'),

    # --- INDIAN WK-BATSMEN ---
    'ms dhoni':           ('WK-Batsman', 'Right-Hand', 'None', 'India'),
    'rishabh pant':       ('WK-Batsman', 'Left-Hand',  'None', 'India'),
    'ishan kishan':       ('WK-Batsman', 'Left-Hand',  'None', 'India'),
    'dinesh karthik':     ('WK-Batsman', 'Right-Hand', 'None', 'India'),
    'wriddhiman saha':    ('WK-Batsman', 'Right-Hand', 'None', 'India'),
    'parthiv patel':      ('WK-Batsman', 'Left-Hand',  'None', 'India'),

    # --- INDIAN ALL-ROUNDERS ---
    'ravindra jadeja':    ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'India'),
    'hardik pandya':      ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'India'),
    'krunal pandya':      ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'India'),
    'axar patel':         ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'India'),
    'washington sundar':  ('All-Rounder','Left-Hand',  'Off Spin', 'India'),
    'shardul thakur':     ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'India'),
    'shivam dube':        ('All-Rounder','Left-Hand',  'Right-Arm Medium', 'India'),
    'irfan pathan':       ('All-Rounder','Left-Hand',  'Left-Arm Fast', 'India'),

    # --- INDIAN BOWLERS ---
    'jasprit bumrah':     ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'mohammed shami':     ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'mohammed siraj':     ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'r ashwin':           ('Bowler',     'Right-Hand', 'Off Spin', 'India'),
    'ravichandran ashwin':('Bowler',     'Right-Hand', 'Off Spin', 'India'),
    'yuzvendra chahal':   ('Bowler',     'Right-Hand', 'Leg Spin', 'India'),
    'kuldeep yadav':      ('Bowler',     'Left-Hand',  'Chinaman', 'India'),
    'umesh yadav':        ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'bhuvneshwar kumar':  ('Bowler',     'Right-Hand', 'Right-Arm Medium', 'India'),
    'arshdeep singh':     ('Bowler',     'Left-Hand',  'Left-Arm Fast', 'India'),
    't natarajan':        ('Bowler',     'Right-Hand', 'Left-Arm Fast', 'India'),
    'deepak chahar':      ('Bowler',     'Right-Hand', 'Right-Arm Medium', 'India'),
    'harshal patel':      ('Bowler',     'Right-Hand', 'Right-Arm Medium', 'India'),
    'mukesh kumar':       ('Bowler',     'Right-Hand', 'Right-Arm Medium', 'India'),
    'avesh khan':         ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'prasidh krishna':    ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'mayank yadav':       ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'India'),
    'piyush chawla':      ('Bowler',     'Left-Hand',  'Leg Spin', 'India'),
    'rahul chahar':       ('Bowler',     'Right-Hand', 'Leg Spin', 'India'),
    'varun chakravarthy': ('Bowler',     'Right-Hand', 'Leg Spin', 'India'),
    'zaheer khan':        ('Bowler',     'Right-Hand', 'Left-Arm Fast', 'India'),
    'harbhajan singh':    ('Bowler',     'Right-Hand', 'Off Spin', 'India'),
    'anil kumble':        ('Bowler',     'Right-Hand', 'Leg Spin', 'India'),
    'pragyan ojha':       ('Bowler',     'Right-Hand', 'Slow Left-Arm Orthodox', 'India'),

    # --- AUSTRALIA ---
    'david warner':       ('Batsman',    'Left-Hand',  'None', 'Australia'),
    'steve smith':        ('Batsman',    'Right-Hand', 'Leg Spin', 'Australia'),
    'aaron finch':        ('Batsman',    'Right-Hand', 'None', 'Australia'),
    'glenn maxwell':      ('All-Rounder','Right-Hand', 'Off Spin', 'Australia'),
    'cameron green':      ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'Australia'),
    'marcus stoinis':     ('All-Rounder','Right-Hand', 'Right-Arm Medium', 'Australia'),
    'mitchell marsh':     ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'Australia'),
    'travis head':        ('Batsman',    'Left-Hand',  'Off Spin', 'Australia'),
    'pat cummins':        ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Australia'),
    'mitchell starc':     ('Bowler',     'Left-Hand',  'Left-Arm Fast', 'Australia'),
    'josh hazlewood':     ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Australia'),
    'adam zampa':         ('Bowler',     'Right-Hand', 'Leg Spin', 'Australia'),
    'nathan lyon':        ('Bowler',     'Right-Hand', 'Off Spin', 'Australia'),
    'adam gilchrist':     ('WK-Batsman', 'Left-Hand',  'None', 'Australia'),
    'matthew hayden':     ('Batsman',    'Left-Hand',  'None', 'Australia'),
    'ricky ponting':      ('Batsman',    'Right-Hand', 'Right-Arm Medium', 'Australia'),
    'shane warne':        ('Bowler',     'Right-Hand', 'Leg Spin', 'Australia'),
    'brett lee':          ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Australia'),

    # --- ENGLAND ---
    'jos buttler':        ('WK-Batsman', 'Right-Hand', 'None', 'England'),
    'joe root':           ('Batsman',    'Right-Hand', 'Off Spin', 'England'),
    'jonny bairstow':     ('WK-Batsman', 'Right-Hand', 'None', 'England'),
    'ben stokes':         ('All-Rounder','Left-Hand',  'Right-Arm Fast', 'England'),
    'moeen ali':          ('All-Rounder','Left-Hand',  'Off Spin', 'England'),
    'sam curran':         ('All-Rounder','Left-Hand',  'Left-Arm Fast', 'England'),
    'liam livingstone':   ('All-Rounder','Right-Hand', 'Leg Spin', 'England'),
    'eoin morgan':        ('Batsman',    'Left-Hand',  'None', 'England'),
    'jason roy':          ('Batsman',    'Right-Hand', 'None', 'England'),
    'phil salt':          ('WK-Batsman', 'Right-Hand', 'None', 'England'),
    'harry brook':        ('Batsman',    'Right-Hand', 'Right-Arm Medium', 'England'),
    'jofra archer':       ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'England'),
    'mark wood':          ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'England'),
    'adil rashid':        ('Bowler',     'Right-Hand', 'Leg Spin', 'England'),
    'kevin pietersen':    ('Batsman',    'Right-Hand', 'Off Spin', 'England'),
    'andrew flintoff':    ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'England'),

    # --- NEW ZEALAND ---
    'kane williamson':    ('Batsman',    'Right-Hand', 'Off Spin', 'New Zealand'),
    'devon conway':       ('WK-Batsman', 'Left-Hand',  'None', 'New Zealand'),
    'trent boult':        ('Bowler',     'Right-Hand', 'Left-Arm Fast', 'New Zealand'),
    'tim southee':        ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'New Zealand'),
    'lockie ferguson':    ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'New Zealand'),
    'martin guptill':     ('Batsman',    'Right-Hand', 'None', 'New Zealand'),
    'ross taylor':        ('Batsman',    'Right-Hand', 'None', 'New Zealand'),
    'brendon mccullum':   ('WK-Batsman', 'Right-Hand', 'None', 'New Zealand'),
    'mitchell santner':   ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'New Zealand'),
    'rachin ravindra':    ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'New Zealand'),
    'glenn phillips':     ('Batsman',    'Right-Hand', 'Off Spin', 'New Zealand'),
    'daniel vettori':     ('Bowler',     'Left-Hand',  'Slow Left-Arm Orthodox', 'New Zealand'),

    # --- SOUTH AFRICA ---
    'ab de villiers':     ('WK-Batsman', 'Right-Hand', 'None', 'South Africa'),
    'quinton de kock':    ('WK-Batsman', 'Left-Hand',  'None', 'South Africa'),
    'faf du plessis':     ('Batsman',    'Right-Hand', 'None', 'South Africa'),
    'heinrich klaasen':   ('WK-Batsman', 'Right-Hand', 'None', 'South Africa'),
    'aiden markram':      ('Batsman',    'Right-Hand', 'Off Spin', 'South Africa'),
    'david miller':       ('Batsman',    'Left-Hand',  'None', 'South Africa'),
    'kagiso rabada':      ('Bowler',     'Left-Hand',  'Right-Arm Fast', 'South Africa'),
    'anrich nortje':      ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'South Africa'),
    'lungi ngidi':        ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'South Africa'),
    'tabraiz shamsi':     ('Bowler',     'Right-Hand', 'Chinaman', 'South Africa'),
    'keshav maharaj':     ('Bowler',     'Right-Hand', 'Slow Left-Arm Orthodox', 'South Africa'),
    'dale steyn':         ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'South Africa'),
    'jacques kallis':     ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'South Africa'),
    'hashim amla':        ('Batsman',    'Right-Hand', 'None', 'South Africa'),

    # --- PAKISTAN ---
    'babar azam':         ('Batsman',    'Right-Hand', 'None', 'Pakistan'),
    'mohammad rizwan':    ('WK-Batsman', 'Right-Hand', 'None', 'Pakistan'),
    'fakhar zaman':       ('Batsman',    'Left-Hand',  'Slow Left-Arm Orthodox', 'Pakistan'),
    'imam-ul-haq':        ('Batsman',    'Left-Hand',  'None', 'Pakistan'),
    'shaheen afridi':     ('Bowler',     'Right-Hand', 'Left-Arm Fast', 'Pakistan'),
    'shadab khan':        ('All-Rounder','Right-Hand', 'Leg Spin', 'Pakistan'),
    'haris rauf':         ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Pakistan'),
    'naseem shah':        ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Pakistan'),
    'shahid afridi':      ('All-Rounder','Right-Hand', 'Leg Spin', 'Pakistan'),
    'wasim akram':        ('Bowler',     'Left-Hand',  'Left-Arm Fast', 'Pakistan'),

    # --- SRI LANKA ---
    'wanindu hasaranga':  ('All-Rounder','Right-Hand', 'Leg Spin', 'Sri Lanka'),
    'kusal mendis':       ('WK-Batsman', 'Right-Hand', 'None', 'Sri Lanka'),
    'dhananjaya de silva':('All-Rounder','Right-Hand', 'Off Spin', 'Sri Lanka'),
    'matheesha pathirana':('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Sri Lanka'),
    'kumar sangakkara':   ('WK-Batsman', 'Left-Hand',  'None', 'Sri Lanka'),
    'mahela jayawardene': ('Batsman',    'Right-Hand', 'None', 'Sri Lanka'),
    'sanath jayasuriya':  ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'Sri Lanka'),
    'muttiah muralitharan':('Bowler',    'Right-Hand', 'Off Spin', 'Sri Lanka'),
    'lasith malinga':     ('Bowler',     'Right-Hand', 'Right-Arm Fast', 'Sri Lanka'),

    # --- BANGLADESH ---
    'shakib al hasan':    ('All-Rounder','Left-Hand',  'Slow Left-Arm Orthodox', 'Bangladesh'),
    'mustafizur rahman':  ('Bowler',     'Left-Hand',  'Left-Arm Fast', 'Bangladesh'),
    'tamim iqbal':        ('Batsman',    'Left-Hand',  'None', 'Bangladesh'),
    'mushfiqur rahim':    ('WK-Batsman', 'Right-Hand', 'None', 'Bangladesh'),

    # --- WEST INDIES ---
    'chris gayle':        ('Batsman',    'Left-Hand',  'Off Spin', 'West Indies'),
    'andre russell':      ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'West Indies'),
    'kieron pollard':     ('All-Rounder','Right-Hand', 'Right-Arm Medium', 'West Indies'),
    'nicholas pooran':    ('WK-Batsman', 'Left-Hand',  'None', 'West Indies'),
    'sunil narine':       ('All-Rounder','Left-Hand',  'Off Spin', 'West Indies'),
    'shimron hetmyer':    ('Batsman',    'Left-Hand',  'None', 'West Indies'),
    'jason holder':       ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'West Indies'),
    'rovman powell':      ('Batsman',    'Right-Hand', 'None', 'West Indies'),
    'sherfane rutherford':('Batsman',    'Left-Hand',  'Right-Arm Medium', 'West Indies'),
    'romario shepherd':   ('All-Rounder','Right-Hand', 'Right-Arm Fast', 'West Indies'),
    'brian lara':         ('Batsman',    'Left-Hand',  'None', 'West Indies'),
    'viv richards':       ('Batsman',    'Right-Hand', 'Off Spin', 'West Indies'),

    # --- AFGHANISTAN ---
    'rashid khan':        ('All-Rounder','Right-Hand', 'Leg Spin', 'Afghanistan'),
    'mohammad nabi':      ('All-Rounder','Right-Hand', 'Off Spin', 'Afghanistan'),
    'mujeeb ur rahman':   ('Bowler',     'Right-Hand', 'Off Spin', 'Afghanistan'),
    'noor ahmad':         ('Bowler',     'Right-Hand', 'Chinaman', 'Afghanistan'),
    'fazalhaq farooqi':   ('Bowler',     'Right-Hand', 'Left-Arm Fast', 'Afghanistan'),
    'ibrahim zadran':     ('Batsman',    'Right-Hand', 'None', 'Afghanistan'),
    'rahmanullah gurbaz': ('WK-Batsman', 'Right-Hand', 'None', 'Afghanistan'),
}


# -----------------------------------------------------------------
# HTTP HELPERS
# -----------------------------------------------------------------
def fetch(path):
    req = urllib.request.Request(f'{SUPABASE_URL}{path}', headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def patch(path, body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        f'{SUPABASE_URL}{path}',
        data=data,
        headers=dict(HEADERS, **{'Prefer': 'return=minimal'}),
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return True, ''
    except urllib.error.HTTPError as e:
        return False, f'HTTP {e.code}: {e.read().decode()[:200]}'


def rpc(name, body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/{name}',
        data=data, headers=HEADERS, method='POST'
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


# -----------------------------------------------------------------
# PASS 1: CURATED — apply hand-mapped metadata
# -----------------------------------------------------------------
def apply_curated():
    print('=== PASS 1: applying curated metadata ===')
    # Fetch all players (paginated)
    players = []
    offset = 0
    while True:
        batch = fetch(f'/rest/v1/players?select=id,name&limit=1000&offset={offset}')
        players.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    print(f'Total players in DB: {len(players):,}')

    matched = 0
    skipped = 0
    for p in players:
        name_lower = p['name'].lower().strip()
        if name_lower in CURATED:
            role, bat, bowl, nat = CURATED[name_lower]
            ok, err = patch(f'/rest/v1/players?id=eq.{p["id"]}',
                            {'role': role, 'batting_style': bat,
                             'bowling_style': bowl, 'nationality': nat})
            if ok:
                matched += 1
            else:
                print(f'  WARN patch {p["name"]}: {err}')
        else:
            skipped += 1

    print(f'  Curated match: {matched} / {len(CURATED)} entries')
    print(f'  Not in curated list: {skipped:,}')
    return matched


# -----------------------------------------------------------------
# PASS 2: INFERRED — figure role from ball patterns
# -----------------------------------------------------------------
def infer_roles():
    print('\n=== PASS 2: inferring roles from player_match_stats ===')

    # Get aggregated stats per player via raw SQL-like aggregation through PostgREST
    # Use an aggregate query: sum balls_faced, sum overs_bowled, sum stumpings per player.
    # PostgREST doesn't do SUM aggregation easily — call a custom RPC instead.

    # Simpler: fetch in batches by ID, aggregate client-side
    print('  Fetching PMS aggregates (this may take 30-60 sec)...')

    # Pull aggregates in chunks
    aggregates = {}
    # First get list of players NOT in curated list
    all_players = []
    offset = 0
    while True:
        batch = fetch(f'/rest/v1/players?select=id,name,role&limit=1000&offset={offset}')
        all_players.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    uncurated = [p for p in all_players if p['name'].lower().strip() not in CURATED]
    print(f'  {len(uncurated):,} uncurated players to infer')

    # For each uncurated player, fetch their PMS aggregate via filter
    # This is N requests = slow. Optimize: fetch ALL pms in chunks and aggregate locally.
    print('  Fetching ALL player_match_stats for inference...')
    all_pms = []
    offset = 0
    while True:
        batch = fetch(f'/rest/v1/player_match_stats?select=player_id,balls_faced,overs_bowled,stumpings,catches&limit=10000&offset={offset}')
        all_pms.extend(batch)
        print(f'    fetched {len(all_pms):,} rows')
        if len(batch) < 10000:
            break
        offset += 10000

    print(f'  Aggregating across {len(all_pms):,} PMS rows...')
    for row in all_pms:
        pid = row['player_id']
        if pid not in aggregates:
            aggregates[pid] = {'balls': 0, 'overs': 0.0, 'stumpings': 0, 'catches': 0, 'matches': 0}
        a = aggregates[pid]
        a['balls'] += row.get('balls_faced') or 0
        a['overs'] += float(row.get('overs_bowled') or 0)
        a['stumpings'] += row.get('stumpings') or 0
        a['catches'] += row.get('catches') or 0
        a['matches'] += 1

    print(f'  {len(aggregates):,} players have PMS data')

    # Now infer role for each uncurated player
    inferred_count = {'Batsman': 0, 'Bowler': 0, 'All-Rounder': 0, 'WK-Batsman': 0, 'no_data': 0}
    update_batches = []
    for p in uncurated:
        pid = p['id']
        a = aggregates.get(pid)
        if not a:
            inferred_count['no_data'] += 1
            continue

        balls_faced = a['balls']
        balls_bowled = a['overs'] * 6
        stumpings = a['stumpings']
        catches = a['catches']
        matches = a['matches']

        # WK-Batsman: has stumpings, OR catches > 50% of matches AND no bowling
        if stumpings >= 3 or (matches >= 10 and catches > matches * 0.5 and balls_bowled < 30):
            role = 'WK-Batsman'
        elif balls_bowled > 60 and balls_faced > 30 and balls_bowled > balls_faced * 0.4:
            role = 'All-Rounder'
        elif balls_bowled > 60 and balls_faced < 50:
            role = 'Bowler'
        elif balls_faced > 30:
            role = 'Batsman'
        else:
            # Very little data — default to Batsman
            role = 'Batsman'

        inferred_count[role] += 1
        update_batches.append({'id': pid, 'role': role})

    print(f'\n  Inferred role distribution:')
    for role, count in inferred_count.items():
        print(f'    {role:15s} {count:6,}')

    # Apply updates in batches (~500 at a time)
    print(f'\n  Updating {len(update_batches):,} player rows...')
    BATCH = 100
    updated = 0
    for i in range(0, len(update_batches), BATCH):
        batch = update_batches[i:i+BATCH]
        # Bulk PATCH not supported directly via PostgREST — do individual PATCHes
        # OR use upsert
        for u in batch:
            ok, err = patch(f'/rest/v1/players?id=eq.{u["id"]}', {'role': u['role']})
            if ok:
                updated += 1
        if updated % 200 == 0:
            print(f'    {updated:,} updated')

    print(f'  Updated {updated:,} player roles')


def main():
    print(f'Endpoint: {SUPABASE_URL}\n')
    curated_count = apply_curated()
    infer_roles()
    print('\nDone. Now test with:')
    print('  python -c "import urllib.request, json; ..."')
    print('Or just open the Scout page and try "Left-Hand Batsman".')


if __name__ == '__main__':
    main()
