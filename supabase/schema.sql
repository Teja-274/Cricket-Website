-- ============================================================
-- Scout India - IPL Cricket Database Schema
-- Clean, normalized schema for Supabase (PostgreSQL)
-- Source: Cricsheet.org ball-by-ball data (1,175 IPL matches)
-- ============================================================

-- 1. Players
CREATE TABLE IF NOT EXISTS players (
    id          TEXT PRIMARY KEY,               -- Cricsheet registry UUID (8-char hex)
    name        TEXT NOT NULL,                   -- Full display name
    short_name  TEXT NOT NULL,                   -- Cricsheet abbreviated name
    role        TEXT DEFAULT 'Batsman',          -- Batsman / Bowler / All-Rounder / WK-Batsman
    batting_style TEXT DEFAULT 'Right-Hand',     -- Right-Hand / Left-Hand
    bowling_style TEXT DEFAULT 'None',           -- Right-Arm Fast / Left-Arm Spin / None / etc.
    nationality TEXT DEFAULT 'India',            -- India / International
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Teams
CREATE TABLE IF NOT EXISTS teams (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,        -- Current franchise name
    short_name      TEXT NOT NULL,               -- MI, CSK, RCB, etc.
    historical_names TEXT[] DEFAULT '{}',         -- All name variants from Cricsheet
    color           TEXT DEFAULT '#333333',       -- Hex color for UI
    is_active       BOOLEAN DEFAULT TRUE          -- FALSE for defunct teams
);

-- 3. Venues
CREATE TABLE IF NOT EXISTS venues (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,            -- Clean venue name
    city        TEXT NOT NULL,
    raw_names   TEXT[] DEFAULT '{}'              -- All Cricsheet name variants
);

-- 4. Seasons
CREATE TABLE IF NOT EXISTS seasons (
    id          SERIAL PRIMARY KEY,
    year        INT NOT NULL UNIQUE,             -- 2008, 2009, ..., 2026
    raw_label   TEXT                             -- Original Cricsheet format
);

-- 5. Matches
CREATE TABLE IF NOT EXISTS matches (
    id              TEXT PRIMARY KEY,            -- Cricsheet match file ID
    season_id       INT REFERENCES seasons(id),
    date            DATE,
    venue_id        INT REFERENCES venues(id),
    team1_id        INT REFERENCES teams(id),    -- First batting team
    team2_id        INT REFERENCES teams(id),    -- Second batting team
    toss_winner_id  INT REFERENCES teams(id),
    toss_decision   TEXT,                        -- 'bat' or 'field'
    winner_id       INT REFERENCES teams(id),    -- NULL if no result
    win_by_runs     INT,
    win_by_wickets  INT,
    player_of_match TEXT REFERENCES players(id),
    stage           TEXT DEFAULT 'league',       -- league / qualifier / eliminator / final
    team1_score     INT,
    team1_wickets   INT,
    team1_overs     DECIMAL(4,1),
    team2_score     INT,
    team2_wickets   INT,
    team2_overs     DECIMAL(4,1)
);

-- 6. Innings
CREATE TABLE IF NOT EXISTS innings (
    id              SERIAL PRIMARY KEY,
    match_id        TEXT REFERENCES matches(id),
    innings_number  INT NOT NULL,                -- 1, 2, 3 (super over), 4
    batting_team_id INT REFERENCES teams(id),
    bowling_team_id INT REFERENCES teams(id),
    total_runs      INT DEFAULT 0,
    total_wickets   INT DEFAULT 0,
    total_overs     DECIMAL(4,1) DEFAULT 0,
    target_runs     INT,                         -- NULL for 1st innings
    is_super_over   BOOLEAN DEFAULT FALSE
);

-- 7. Deliveries (the big table — ~280k rows)
CREATE TABLE IF NOT EXISTS deliveries (
    id              BIGSERIAL PRIMARY KEY,
    innings_id      INT REFERENCES innings(id),
    match_id        TEXT REFERENCES matches(id), -- Denormalized for speed
    over_number     INT NOT NULL,                -- 0-19
    ball_number     INT NOT NULL,                -- 1-based within over
    phase           TEXT NOT NULL,                -- powerplay / middle / death
    batter_id       TEXT REFERENCES players(id),
    bowler_id       TEXT REFERENCES players(id),
    non_striker_id  TEXT REFERENCES players(id),
    batter_runs     INT DEFAULT 0,
    extra_runs      INT DEFAULT 0,
    total_runs      INT DEFAULT 0,
    extra_type      TEXT,                         -- NULL / wide / noball / bye / legbye
    is_legal        BOOLEAN DEFAULT TRUE,
    is_boundary     BOOLEAN DEFAULT FALSE,
    is_dot          BOOLEAN DEFAULT FALSE
);

-- 8. Wickets
CREATE TABLE IF NOT EXISTS wickets (
    id              SERIAL PRIMARY KEY,
    delivery_id     BIGINT REFERENCES deliveries(id),
    match_id        TEXT REFERENCES matches(id),
    innings_id      INT REFERENCES innings(id),
    batter_id       TEXT REFERENCES players(id), -- Player who got out
    bowler_id       TEXT REFERENCES players(id),
    fielder_id      TEXT REFERENCES players(id), -- NULL if no fielder
    kind            TEXT NOT NULL,                -- caught / bowled / lbw / run out / stumped / etc.
    is_bowler_wicket BOOLEAN DEFAULT TRUE         -- FALSE for run outs
);

-- 9. Player Match Stats (precomputed aggregates)
CREATE TABLE IF NOT EXISTS player_match_stats (
    id              SERIAL PRIMARY KEY,
    match_id        TEXT REFERENCES matches(id),
    player_id       TEXT REFERENCES players(id),
    team_id         INT REFERENCES teams(id),
    season_id       INT REFERENCES seasons(id),
    -- Batting
    runs_scored     INT DEFAULT 0,
    balls_faced     INT DEFAULT 0,
    fours           INT DEFAULT 0,
    sixes           INT DEFAULT 0,
    is_not_out      BOOLEAN DEFAULT TRUE,
    dismissal_kind  TEXT,
    -- Bowling
    overs_bowled    DECIMAL(3,1) DEFAULT 0,
    runs_conceded   INT DEFAULT 0,
    wickets_taken   INT DEFAULT 0,
    dots_bowled     INT DEFAULT 0,
    extras_conceded INT DEFAULT 0,
    -- Fielding
    catches         INT DEFAULT 0,
    run_outs        INT DEFAULT 0,
    stumpings       INT DEFAULT 0,
    -- Unique constraint
    UNIQUE(match_id, player_id)
);

-- ============================================================
-- INDEXES for fast queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_deliveries_match ON deliveries(match_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_batter ON deliveries(batter_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_bowler ON deliveries(bowler_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_phase ON deliveries(phase);
CREATE INDEX IF NOT EXISTS idx_deliveries_innings ON deliveries(innings_id);
CREATE INDEX IF NOT EXISTS idx_wickets_batter ON wickets(batter_id);
CREATE INDEX IF NOT EXISTS idx_wickets_bowler ON wickets(bowler_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_season ON player_match_stats(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_venue ON matches(venue_id);
CREATE INDEX IF NOT EXISTS idx_innings_match ON innings(match_id);

-- ============================================================
-- USEFUL VIEWS for common queries
-- ============================================================

-- Player career batting stats
CREATE OR REPLACE VIEW player_career_batting AS
SELECT
    p.id, p.name, p.role,
    COUNT(DISTINCT pms.match_id) AS matches,
    SUM(pms.runs_scored) AS total_runs,
    SUM(pms.balls_faced) AS total_balls,
    ROUND(SUM(pms.runs_scored)::DECIMAL / NULLIF(COUNT(*) - SUM(CASE WHEN pms.is_not_out THEN 1 ELSE 0 END), 0), 2) AS average,
    ROUND((SUM(pms.runs_scored)::DECIMAL / NULLIF(SUM(pms.balls_faced), 0)) * 100, 2) AS strike_rate,
    SUM(pms.fours) AS fours,
    SUM(pms.sixes) AS sixes,
    MAX(pms.runs_scored) AS highest_score
FROM players p
JOIN player_match_stats pms ON p.id = pms.player_id
WHERE pms.balls_faced > 0
GROUP BY p.id, p.name, p.role
ORDER BY total_runs DESC;

-- Player career bowling stats
CREATE OR REPLACE VIEW player_career_bowling AS
SELECT
    p.id, p.name, p.role,
    COUNT(DISTINCT pms.match_id) AS matches,
    SUM(pms.wickets_taken) AS total_wickets,
    SUM(pms.runs_conceded) AS total_runs_conceded,
    SUM(pms.overs_bowled) AS total_overs,
    ROUND(SUM(pms.runs_conceded)::DECIMAL / NULLIF(SUM(pms.overs_bowled), 0), 2) AS economy,
    ROUND(SUM(pms.runs_conceded)::DECIMAL / NULLIF(SUM(pms.wickets_taken), 0), 2) AS bowling_avg,
    SUM(pms.dots_bowled) AS total_dots
FROM players p
JOIN player_match_stats pms ON p.id = pms.player_id
WHERE pms.overs_bowled > 0
GROUP BY p.id, p.name, p.role
ORDER BY total_wickets DESC;

-- Enable realtime for auction tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE matches, deliveries, player_match_stats;
