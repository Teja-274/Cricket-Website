"""
Lookup tables for normalizing IPL data.
Maps raw Cricsheet names to clean, consistent names.
"""

# ============================================================
# TEAM NAME MAPPINGS
# Maps every raw Cricsheet team name → (current_name, short_name, color)
# ============================================================
TEAM_MAP = {
    # Active franchises
    'Mumbai Indians':                   ('Mumbai Indians', 'MI', '#004BA0'),
    'Chennai Super Kings':              ('Chennai Super Kings', 'CSK', '#FCCA06'),
    'Royal Challengers Bangalore':      ('Royal Challengers Bengaluru', 'RCB', '#EC1C24'),
    'Royal Challengers Bengaluru':      ('Royal Challengers Bengaluru', 'RCB', '#EC1C24'),
    'Kolkata Knight Riders':            ('Kolkata Knight Riders', 'KKR', '#3A225D'),
    'Delhi Daredevils':                 ('Delhi Capitals', 'DC', '#004C93'),
    'Delhi Capitals':                   ('Delhi Capitals', 'DC', '#004C93'),
    'Sunrisers Hyderabad':              ('Sunrisers Hyderabad', 'SRH', '#FF822A'),
    'Kings XI Punjab':                  ('Punjab Kings', 'PBKS', '#ED1B24'),
    'Punjab Kings':                     ('Punjab Kings', 'PBKS', '#ED1B24'),
    'Rajasthan Royals':                 ('Rajasthan Royals', 'RR', '#EA1A85'),
    'Lucknow Super Giants':             ('Lucknow Super Giants', 'LSG', '#A72056'),
    'Gujarat Titans':                   ('Gujarat Titans', 'GT', '#1C1C1C'),

    # Defunct franchises
    'Deccan Chargers':                  ('Deccan Chargers', 'DC*', '#4A4A4A'),
    'Pune Warriors':                    ('Pune Warriors', 'PWI', '#6B6B6B'),
    'Kochi Tuskers Kerala':             ('Kochi Tuskers Kerala', 'KTK', '#7B2D26'),
    'Rising Pune Supergiant':           ('Rising Pune Supergiant', 'RPS', '#6B3FA0'),
    'Rising Pune Supergiants':          ('Rising Pune Supergiant', 'RPS', '#6B3FA0'),
    'Gujarat Lions':                    ('Gujarat Lions', 'GL', '#E04F16'),
}

# ============================================================
# VENUE NAME MAPPINGS
# Maps every raw Cricsheet venue name → (clean_name, city)
# ============================================================
VENUE_MAP = {
    # Mumbai
    'Wankhede Stadium':                     ('Wankhede Stadium', 'Mumbai'),
    'Wankhede Stadium, Mumbai':             ('Wankhede Stadium', 'Mumbai'),
    'Brabourne Stadium':                    ('Brabourne Stadium', 'Mumbai'),
    'Brabourne Stadium, Mumbai':            ('Brabourne Stadium', 'Mumbai'),
    'Dr DY Patil Sports Academy':           ('DY Patil Stadium', 'Mumbai'),
    'Dr DY Patil Sports Academy, Mumbai':   ('DY Patil Stadium', 'Mumbai'),

    # Bengaluru
    'M Chinnaswamy Stadium':                ('M Chinnaswamy Stadium', 'Bengaluru'),
    'M Chinnaswamy Stadium, Bengaluru':     ('M Chinnaswamy Stadium', 'Bengaluru'),
    'M.Chinnaswamy Stadium':                ('M Chinnaswamy Stadium', 'Bengaluru'),

    # Chennai
    'MA Chidambaram Stadium':               ('MA Chidambaram Stadium', 'Chennai'),
    'MA Chidambaram Stadium, Chepauk':      ('MA Chidambaram Stadium', 'Chennai'),
    'MA Chidambaram Stadium, Chepauk, Chennai': ('MA Chidambaram Stadium', 'Chennai'),

    # Kolkata
    'Eden Gardens':                         ('Eden Gardens', 'Kolkata'),
    'Eden Gardens, Kolkata':                ('Eden Gardens', 'Kolkata'),

    # Delhi
    'Feroz Shah Kotla':                     ('Arun Jaitley Stadium', 'Delhi'),
    'Arun Jaitley Stadium':                 ('Arun Jaitley Stadium', 'Delhi'),
    'Arun Jaitley Stadium, Delhi':          ('Arun Jaitley Stadium', 'Delhi'),

    # Hyderabad
    'Rajiv Gandhi International Stadium':                   ('Rajiv Gandhi International Stadium', 'Hyderabad'),
    'Rajiv Gandhi International Stadium, Uppal':            ('Rajiv Gandhi International Stadium', 'Hyderabad'),
    'Rajiv Gandhi International Stadium, Uppal, Hyderabad': ('Rajiv Gandhi International Stadium', 'Hyderabad'),

    # Jaipur
    'Sawai Mansingh Stadium':               ('Sawai Mansingh Stadium', 'Jaipur'),
    'Sawai Mansingh Stadium, Jaipur':       ('Sawai Mansingh Stadium', 'Jaipur'),

    # Mohali / Chandigarh
    'Punjab Cricket Association Stadium, Mohali':                   ('PCA Stadium', 'Mohali'),
    'Punjab Cricket Association IS Bindra Stadium':                 ('PCA Stadium', 'Mohali'),
    'Punjab Cricket Association IS Bindra Stadium, Mohali':         ('PCA Stadium', 'Mohali'),
    'Punjab Cricket Association IS Bindra Stadium, Mohali, Chandigarh': ('PCA Stadium', 'Mohali'),
    'Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur':    ('MYSI Stadium', 'Mullanpur'),
    'Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh': ('MYSI Stadium', 'Mullanpur'),

    # Ahmedabad
    'Narendra Modi Stadium, Ahmedabad':     ('Narendra Modi Stadium', 'Ahmedabad'),
    'Sardar Patel Stadium, Motera':         ('Narendra Modi Stadium', 'Ahmedabad'),
    'Saurashtra Cricket Association Stadium': ('SCA Stadium', 'Rajkot'),

    # Pune
    'Maharashtra Cricket Association Stadium':      ('MCA Stadium', 'Pune'),
    'Maharashtra Cricket Association Stadium, Pune': ('MCA Stadium', 'Pune'),
    'Subrata Roy Sahara Stadium':                   ('MCA Stadium', 'Pune'),

    # Lucknow
    'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow': ('Ekana Stadium', 'Lucknow'),

    # Vizag
    'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium':                 ('ACA-VDCA Stadium', 'Visakhapatnam'),
    'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam':  ('ACA-VDCA Stadium', 'Visakhapatnam'),

    # Other India
    'Holkar Cricket Stadium':               ('Holkar Cricket Stadium', 'Indore'),
    'Barabati Stadium':                     ('Barabati Stadium', 'Cuttack'),
    'JSCA International Stadium Complex':   ('JSCA Stadium', 'Ranchi'),
    'Green Park':                           ('Green Park', 'Kanpur'),
    'Nehru Stadium':                        ('Nehru Stadium', 'Kochi'),
    'Shaheed Veer Narayan Singh International Stadium': ('VNS Stadium', 'Raipur'),
    'Himachal Pradesh Cricket Association Stadium':             ('HPCA Stadium', 'Dharamsala'),
    'Himachal Pradesh Cricket Association Stadium, Dharamsala': ('HPCA Stadium', 'Dharamsala'),
    'Barsapara Cricket Stadium, Guwahati':  ('Barsapara Stadium', 'Guwahati'),
    'Vidarbha Cricket Association Stadium, Jamtha': ('VCA Stadium', 'Nagpur'),

    # UAE
    'Dubai International Cricket Stadium':  ('Dubai International Stadium', 'Dubai'),
    'Sheikh Zayed Stadium':                 ('Sheikh Zayed Stadium', 'Abu Dhabi'),
    'Sharjah Cricket Stadium':              ('Sharjah Cricket Stadium', 'Sharjah'),
    'Zayed Cricket Stadium, Abu Dhabi':     ('Sheikh Zayed Stadium', 'Abu Dhabi'),

    # South Africa
    'Kingsmead':                            ('Kingsmead', 'Durban'),
    'SuperSport Park':                      ('SuperSport Park', 'Centurion'),
    'New Wanderers Stadium':                ('Wanderers Stadium', 'Johannesburg'),
    'Newlands':                             ('Newlands', 'Cape Town'),
    "St George's Park":                     ("St George's Park", 'Gqeberha'),
    'Buffalo Park':                         ('Buffalo Park', 'East London'),
    'De Beers Diamond Oval':                ('Diamond Oval', 'Kimberley'),
    'OUTsurance Oval':                      ('OUTsurance Oval', 'Bloemfontein'),
}


# ============================================================
# SEASON NORMALIZATION
# Maps raw season string → integer year
# ============================================================
def normalize_season(raw: str) -> int:
    """Convert Cricsheet season format to integer year.
    Uses the FIRST year to avoid collisions (2020/21 → 2020, not 2021).
    """
    raw = str(raw)
    if '/' in raw:
        # "2007/08" → 2008, "2009/10" → 2010, "2020/21" → 2020
        parts = raw.split('/')
        base = int(parts[0])
        suffix = int(parts[1])
        # For early seasons where format is YYYY/YY and refers to next year
        if base < 2015 and suffix < 100:
            return base + 1
        # For 2020/21, keep as 2020 to avoid collision with 2021
        return base
    return int(raw)


# ============================================================
# PLAYER FULL NAMES (top 200 by matches)
# Maps Cricsheet short name → full display name
# ============================================================
PLAYER_FULL_NAMES = {
    'V Kohli': 'Virat Kohli',
    'RG Sharma': 'Rohit Sharma',
    'MS Dhoni': 'MS Dhoni',
    'RA Jadeja': 'Ravindra Jadeja',
    'S Dhawan': 'Shikhar Dhawan',
    'KD Karthik': 'Dinesh Karthik',
    'R Ashwin': 'Ravichandran Ashwin',
    'SK Raina': 'Suresh Raina',
    'RV Uthappa': 'Robin Uthappa',
    'PP Chawla': 'Piyush Chawla',
    'AB de Villiers': 'AB de Villiers',
    'DA Warner': 'David Warner',
    'CH Gayle': 'Chris Gayle',
    'KA Pollard': 'Kieron Pollard',
    'DJ Bravo': 'Dwayne Bravo',
    'SP Narine': 'Sunil Narine',
    'YK Pathan': 'Yusuf Pathan',
    'AM Rahane': 'Ajinkya Rahane',
    'AT Rayudu': 'Ambati Rayudu',
    'Harbhajan Singh': 'Harbhajan Singh',
    'JJ Bumrah': 'Jasprit Bumrah',
    'SA Yadav': 'Suryakumar Yadav',
    'KL Rahul': 'KL Rahul',
    'RR Pant': 'Rishabh Pant',
    'SV Samson': 'Sanju Samson',
    'HH Pandya': 'Hardik Pandya',
    'KH Pandya': 'Krunal Pandya',
    'Rashid Khan': 'Rashid Khan',
    'AD Russell': 'Andre Russell',
    'GJ Maxwell': 'Glenn Maxwell',
    'F du Plessis': 'Faf du Plessis',
    'A Mishra': 'Amit Mishra',
    'I Sharma': 'Ishant Sharma',
    'MM Sharma': 'Mohit Sharma',
    'UT Yadav': 'Umesh Yadav',
    'B Kumar': 'Bhuvneshwar Kumar',
    'AR Patel': 'Axar Patel',
    'Imran Tahir': 'Imran Tahir',
    'YS Chahal': 'Yuzvendra Chahal',
    'P Kumar': 'Praveen Kumar',
    'M Morkel': 'Morne Morkel',
    'DL Chahar': 'Deepak Chahar',
    'SN Thakur': 'Shardul Thakur',
    'RA Tripathi': 'Rahul Tripathi',
    'WP Saha': 'Wriddhiman Saha',
    'KS Williamson': 'Kane Williamson',
    'JC Buttler': 'Jos Buttler',
    'Q de Kock': 'Quinton de Kock',
    'SS Iyer': 'Shreyas Iyer',
    'Yuvraj Singh': 'Yuvraj Singh',
    'DJ Hooda': 'Deepak Hooda',
    'MA Agarwal': 'Mayank Agarwal',
    'Mandeep Singh': 'Mandeep Singh',
    'PA Patel': 'Parthiv Patel',
    'Mohammed Shami': 'Mohammed Shami',
    'Mohammed Siraj': 'Mohammed Siraj',
    'Arshdeep Singh': 'Arshdeep Singh',
    'K Rabada': 'Kagiso Rabada',
    'PJ Cummins': 'Pat Cummins',
    'TA Boult': 'Trent Boult',
    'MA Starc': 'Mitchell Starc',
    'JD Unadkat': 'Jaydev Unadkat',
    'Kuldeep Yadav': 'Kuldeep Yadav',
    'R Bishnoi': 'Ravi Bishnoi',
    'Sandeep Sharma': 'Sandeep Sharma',
    'Washington Sundar': 'Washington Sundar',
    'DW Steyn': 'Dale Steyn',
    'YBK Jaiswal': 'Yashasvi Jaiswal',
    'Shubman Gill': 'Shubman Gill',
    'RD Gaikwad': 'Ruturaj Gaikwad',
    'Tilak Varma': 'Tilak Varma',
    'Rinku Singh': 'Rinku Singh',
    'Abhishek Sharma': 'Abhishek Sharma',
    'R Parag': 'Riyan Parag',
    'Prithvi Shaw': 'Prithvi Shaw',
    'SL Malinga': 'Lasith Malinga',
    'DR Smith': 'Dwayne Smith',
    'SR Watson': 'Shane Watson',
    'MEK Hussey': 'Mike Hussey',
    'SE Marsh': 'Shaun Marsh',
    'MR Marsh': 'Mitchell Marsh',
    'TM Head': 'Travis Head',
    'HE van der Dussen': 'Rassie van der Dussen',
    'AJ Finch': 'Aaron Finch',
    'PD Salt': 'Phil Salt',
    'N Rana': 'Nitish Rana',
    'VR Iyer': 'Venkatesh Iyer',
    'Avesh Khan': 'Avesh Khan',
    'T Natarajan': 'T Natarajan',
    'Harshal Patel': 'Harshal Patel',
    'Umran Malik': 'Umran Malik',
    'Varun Chakravarthy': 'Varun Chakravarthy',
    'Rahul Chahar': 'Rahul Chahar',
    'SN Khan': 'Sarfaraz Khan',
    'NM Coulter-Nile': 'Nathan Coulter-Nile',
    'JR Hazlewood': 'Josh Hazlewood',
    'KM Jadhav': 'Kedar Jadhav',
    'SV Samson': 'Sanju Samson',
    'Shahbaz Ahmed': 'Shahbaz Ahmed',
    'S Dube': 'Shivam Dube',
    'N Pooran': 'Nicholas Pooran',
    'LS Livingstone': 'Liam Livingstone',
    'SM Curran': 'Sam Curran',
    'MP Stoinis': 'Marcus Stoinis',
    'M Pathirana': 'Matheesha Pathirana',
    'JC Archer': 'Jofra Archer',
    'TD Paine': 'Tim David',
    'Mukesh Kumar': 'Mukesh Kumar',
    'Tushar Deshpande': 'Tushar Deshpande',
    'Akash Deep': 'Akash Deep',
    'Mayank Yadav': 'Mayank Yadav',
    'Harshit Rana': 'Harshit Rana',
    'N Kumar Reddy': 'Nitish Kumar Reddy',
}

# For players not in the mapping, try to expand initials
def get_full_name(short_name: str) -> str:
    """Get full display name from Cricsheet short name."""
    if short_name in PLAYER_FULL_NAMES:
        return PLAYER_FULL_NAMES[short_name]
    # Return as-is if no mapping found
    return short_name
