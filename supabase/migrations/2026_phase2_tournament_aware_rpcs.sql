-- =====================================================================
-- Phase 2.1 — Tournament-aware RPC fixes
-- =====================================================================
-- Fixes:
--   #1 Tournament filter has no effect on data
--   #3 AI search returns 0 rows
--   #5 IPL 2024 shows "Bahrain" (T20I team)
--   #6 Matchup explorer pulls from all tournaments
--   #7 Over-by-over team analysis pulls from all tournaments
--
-- Strategy: every RPC accepts `p_tournaments TEXT[] DEFAULT ARRAY['IPL']`.
-- Backwards-compatible: existing frontend calls (no tournament arg) get
-- IPL-only behavior. New calls can pass any tournament codes.
-- =====================================================================

-- ============================================================
-- 1. FIX: search_players_filtered
--    Was: returned 0 rows even for permissive queries
--    Now: real LEFT JOIN on player_match_stats with tournament filter
-- ============================================================
DROP FUNCTION IF EXISTS search_players_filtered CASCADE;

CREATE FUNCTION search_players_filtered(
    p_role          TEXT DEFAULT NULL,
    p_batting_style TEXT DEFAULT NULL,
    p_bowling_style TEXT DEFAULT NULL,
    p_min_matches   INT DEFAULT 0,
    p_name_contains TEXT DEFAULT NULL,
    p_intent        TEXT DEFAULT NULL,    -- accepted but not yet used
    p_tournaments   TEXT[] DEFAULT ARRAY['IPL'],
    lim             INT DEFAULT 10
)
RETURNS TABLE (id TEXT, name TEXT, reason TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        format(
            '%s%s%s | %s matches',
            COALESCE(p.role, 'Player'),
            CASE WHEN p.batting_style IS NOT NULL AND p.batting_style != 'Right-Hand'
                 THEN ' (' || p.batting_style || ')' ELSE '' END,
            CASE WHEN p.bowling_style IS NOT NULL AND p.bowling_style != 'None'
                 THEN ' / ' || p.bowling_style ELSE '' END,
            COUNT(DISTINCT pms.match_id)
        )::TEXT AS reason
    FROM players p
    LEFT JOIN player_match_stats pms
        ON p.id = pms.player_id
        AND pms.tournament = ANY(p_tournaments)
    WHERE
        (p_role IS NULL OR p.role = p_role)
        AND (p_batting_style IS NULL OR p.batting_style = p_batting_style)
        AND (p_bowling_style IS NULL OR COALESCE(p.bowling_style, '') ILIKE '%' || p_bowling_style || '%')
        AND (p_name_contains IS NULL OR p.name ILIKE '%' || p_name_contains || '%')
    GROUP BY p.id, p.name, p.role, p.batting_style, p.bowling_style
    HAVING COUNT(DISTINCT pms.match_id) >= COALESCE(p_min_matches, 0)
    ORDER BY COUNT(DISTINCT pms.match_id) DESC NULLS LAST
    LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 2. FIX: get_top_batsmen — add tournament filter
-- ============================================================
DROP FUNCTION IF EXISTS get_top_batsmen CASCADE;

CREATE FUNCTION get_top_batsmen(
    lim INT DEFAULT 20,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    player_id   TEXT,
    player_name TEXT,
    matches     BIGINT,
    innings     BIGINT,
    runs        BIGINT,
    balls       BIGINT,
    fours       BIGINT,
    sixes       BIGINT,
    not_outs    BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id            AS player_id,
        p.name          AS player_name,
        COUNT(DISTINCT pms.match_id) AS matches,
        COUNT(*) FILTER (WHERE pms.balls_faced > 0) AS innings,
        SUM(pms.runs_scored)::BIGINT AS runs,
        SUM(pms.balls_faced)::BIGINT AS balls,
        SUM(pms.fours)::BIGINT       AS fours,
        SUM(pms.sixes)::BIGINT       AS sixes,
        SUM(CASE WHEN pms.is_not_out THEN 1 ELSE 0 END)::BIGINT AS not_outs
    FROM players p
    JOIN player_match_stats pms
        ON p.id = pms.player_id
        AND pms.tournament = ANY(p_tournaments)
    WHERE pms.balls_faced > 0
    GROUP BY p.id, p.name
    HAVING SUM(pms.runs_scored) > 0
    ORDER BY runs DESC NULLS LAST
    LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 3. FIX: get_top_bowlers — add tournament filter
--    Returns columns matching what queries.ts expects: `overs`, `innings`
-- ============================================================
DROP FUNCTION IF EXISTS get_top_bowlers CASCADE;

CREATE FUNCTION get_top_bowlers(
    lim INT DEFAULT 20,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    player_id     TEXT,
    player_name   TEXT,
    matches       BIGINT,
    innings       BIGINT,
    wickets       BIGINT,
    runs_conceded BIGINT,
    overs         NUMERIC,
    dots          BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id   AS player_id,
        p.name AS player_name,
        COUNT(DISTINCT pms.match_id) AS matches,
        COUNT(*) FILTER (WHERE pms.overs_bowled > 0) AS innings,
        SUM(pms.wickets_taken)::BIGINT AS wickets,
        SUM(pms.runs_conceded)::BIGINT AS runs_conceded,
        SUM(pms.overs_bowled)::NUMERIC AS overs,
        SUM(pms.dots_bowled)::BIGINT   AS dots
    FROM players p
    JOIN player_match_stats pms
        ON p.id = pms.player_id
        AND pms.tournament = ANY(p_tournaments)
    WHERE pms.overs_bowled > 0
    GROUP BY p.id, p.name
    HAVING SUM(pms.wickets_taken) > 0
    ORDER BY wickets DESC NULLS LAST
    LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 4. FIX: get_season_leaderboard — Bahrain bug fix
--    Returns SAME columns existing frontend expects.
-- ============================================================
DROP FUNCTION IF EXISTS get_season_leaderboard CASCADE;

CREATE FUNCTION get_season_leaderboard(
    season_yr INT,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    player_id     TEXT,
    player_name   TEXT,
    runs_scored   BIGINT,
    balls_faced   BIGINT,
    fours         BIGINT,
    sixes         BIGINT,
    innings       BIGINT,
    not_outs      BIGINT,
    wickets_taken BIGINT,
    runs_conceded BIGINT,
    overs_bowled  NUMERIC,
    dots_bowled   BIGINT
) AS $$
DECLARE
    season_id_var INT;
BEGIN
    SELECT id INTO season_id_var FROM seasons WHERE year = season_yr LIMIT 1;
    IF season_id_var IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.id   AS player_id,
        p.name AS player_name,
        COALESCE(SUM(pms.runs_scored), 0)::BIGINT  AS runs_scored,
        COALESCE(SUM(pms.balls_faced), 0)::BIGINT  AS balls_faced,
        COALESCE(SUM(pms.fours), 0)::BIGINT        AS fours,
        COALESCE(SUM(pms.sixes), 0)::BIGINT        AS sixes,
        COUNT(*) FILTER (WHERE pms.balls_faced > 0 OR pms.overs_bowled > 0) AS innings,
        COALESCE(SUM(CASE WHEN pms.is_not_out THEN 1 ELSE 0 END), 0)::BIGINT AS not_outs,
        COALESCE(SUM(pms.wickets_taken), 0)::BIGINT AS wickets_taken,
        COALESCE(SUM(pms.runs_conceded), 0)::BIGINT AS runs_conceded,
        COALESCE(SUM(pms.overs_bowled), 0)::NUMERIC AS overs_bowled,
        COALESCE(SUM(pms.dots_bowled), 0)::BIGINT  AS dots_bowled
    FROM players p
    JOIN player_match_stats pms
        ON p.id = pms.player_id
        AND pms.season_id = season_id_var
        AND pms.tournament = ANY(p_tournaments)
    GROUP BY p.id, p.name
    HAVING COUNT(DISTINCT pms.match_id) > 0
    ORDER BY SUM(pms.runs_scored) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 5. FIX: get_season_champion — Bahrain bug fix
--    Returns SAME columns existing frontend expects.
-- ============================================================
DROP FUNCTION IF EXISTS get_season_champion CASCADE;

CREATE FUNCTION get_season_champion(
    season_yr INT,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    champion        TEXT,
    runner_up       TEXT,
    final_date      DATE,
    win_by_runs     INT,
    win_by_wickets  INT
) AS $$
DECLARE
    season_id_var INT;
    final_match RECORD;
BEGIN
    SELECT id INTO season_id_var FROM seasons WHERE year = season_yr LIMIT 1;
    IF season_id_var IS NULL THEN
        RETURN;
    END IF;

    -- Try to find the actual final match for this tournament+season
    SELECT m.*, wt.name AS winner_name,
           CASE WHEN m.winner_id = m.team1_id THEN t2.name ELSE t1.name END AS loser_name
    INTO final_match
    FROM matches m
    LEFT JOIN teams t1 ON m.team1_id = t1.id
    LEFT JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN teams wt ON m.winner_id = wt.id
    WHERE m.season_id = season_id_var
      AND m.tournament = ANY(p_tournaments)
      AND m.stage = 'final'
    ORDER BY m.date DESC
    LIMIT 1;

    IF final_match.id IS NULL THEN
        -- No final flagged → fall back to most-recent match of the season
        SELECT m.*, wt.name AS winner_name,
               CASE WHEN m.winner_id = m.team1_id THEN t2.name ELSE t1.name END AS loser_name
        INTO final_match
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        LEFT JOIN teams wt ON m.winner_id = wt.id
        WHERE m.season_id = season_id_var
          AND m.tournament = ANY(p_tournaments)
        ORDER BY m.date DESC
        LIMIT 1;
    END IF;

    IF final_match.id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY SELECT
        final_match.winner_name::TEXT     AS champion,
        final_match.loser_name::TEXT      AS runner_up,
        final_match.date                  AS final_date,
        final_match.win_by_runs           AS win_by_runs,
        final_match.win_by_wickets        AS win_by_wickets;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 6. FIX: get_team_over_stats — Over-by-over team analysis
-- ============================================================
DROP FUNCTION IF EXISTS get_team_over_stats CASCADE;

CREATE FUNCTION get_team_over_stats(
    team_name TEXT,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    over_num      INT,
    avg_runs      NUMERIC,
    total_runs    BIGINT,
    wickets_lost  BIGINT,
    innings_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.over_number AS over_num,
        ROUND(SUM(d.total_runs)::NUMERIC / NULLIF(COUNT(DISTINCT d.innings_id), 0), 2) AS avg_runs,
        SUM(d.total_runs)::BIGINT AS total_runs,
        COUNT(w.id)::BIGINT AS wickets_lost,
        COUNT(DISTINCT d.innings_id) AS innings_count
    FROM deliveries d
    JOIN innings i ON d.innings_id = i.id
    JOIN teams t ON i.batting_team_id = t.id
    LEFT JOIN wickets w ON w.delivery_id = d.id
    WHERE t.name = team_name
      AND d.tournament = ANY(p_tournaments)
    GROUP BY d.over_number
    ORDER BY d.over_number;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 7. FIX: explore_matchups — Matchup explorer
-- ============================================================
DROP FUNCTION IF EXISTS explore_matchups CASCADE;

CREATE FUNCTION explore_matchups(
    bowl_style TEXT DEFAULT NULL,
    bat_style  TEXT DEFAULT NULL,
    phase_filter TEXT DEFAULT NULL,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL'],
    lim INT DEFAULT 50
)
RETURNS TABLE (
    batter_id    TEXT,
    batter_name  TEXT,
    bowler_id    TEXT,
    bowler_name  TEXT,
    balls        BIGINT,
    runs         BIGINT,
    dismissals   BIGINT,
    sr           NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bat.id   AS batter_id,
        bat.name AS batter_name,
        bowl.id  AS bowler_id,
        bowl.name AS bowler_name,
        COUNT(*) FILTER (WHERE d.is_legal) AS balls,
        SUM(d.batter_runs)::BIGINT AS runs,
        COUNT(w.id) FILTER (WHERE w.is_bowler_wicket) AS dismissals,
        ROUND(SUM(d.batter_runs)::NUMERIC * 100 / NULLIF(COUNT(*) FILTER (WHERE d.is_legal), 0), 2) AS sr
    FROM deliveries d
    JOIN players bat  ON d.batter_id = bat.id
    JOIN players bowl ON d.bowler_id = bowl.id
    LEFT JOIN wickets w ON w.delivery_id = d.id AND w.batter_id = d.batter_id
    WHERE
        d.tournament = ANY(p_tournaments)
        AND (bowl_style IS NULL OR bowl.bowling_style ILIKE '%' || bowl_style || '%')
        AND (bat_style  IS NULL OR bat.batting_style = bat_style)
        AND (phase_filter IS NULL OR d.phase = phase_filter)
    GROUP BY bat.id, bat.name, bowl.id, bowl.name
    HAVING COUNT(*) FILTER (WHERE d.is_legal) >= 10
    ORDER BY balls DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 8. FIX: get_player_career_stats — add tournament filter
--    Column names match what queries.ts expects: `overs` not `overs_bowled`
-- ============================================================
DROP FUNCTION IF EXISTS get_player_career_stats CASCADE;

CREATE FUNCTION get_player_career_stats(
    p_id TEXT,
    p_tournaments TEXT[] DEFAULT ARRAY['IPL']
)
RETURNS TABLE (
    matches       BIGINT,
    innings       BIGINT,
    runs          BIGINT,
    balls         BIGINT,
    fours         BIGINT,
    sixes         BIGINT,
    highest_score INT,
    not_outs      BIGINT,
    wickets       BIGINT,
    runs_conceded BIGINT,
    overs         NUMERIC,
    dots_bowled   BIGINT,
    catches       BIGINT,
    stumpings     BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT pms.match_id) AS matches,
        COUNT(*) FILTER (WHERE pms.balls_faced > 0) AS innings,
        COALESCE(SUM(pms.runs_scored), 0)::BIGINT AS runs,
        COALESCE(SUM(pms.balls_faced), 0)::BIGINT AS balls,
        COALESCE(SUM(pms.fours), 0)::BIGINT AS fours,
        COALESCE(SUM(pms.sixes), 0)::BIGINT AS sixes,
        COALESCE(MAX(pms.runs_scored), 0)::INT AS highest_score,
        COALESCE(SUM(CASE WHEN pms.is_not_out THEN 1 ELSE 0 END), 0)::BIGINT AS not_outs,
        COALESCE(SUM(pms.wickets_taken), 0)::BIGINT AS wickets,
        COALESCE(SUM(pms.runs_conceded), 0)::BIGINT AS runs_conceded,
        COALESCE(SUM(pms.overs_bowled), 0)::NUMERIC AS overs,
        COALESCE(SUM(pms.dots_bowled), 0)::BIGINT AS dots_bowled,
        COALESCE(SUM(pms.catches), 0)::BIGINT AS catches,
        COALESCE(SUM(pms.stumpings), 0)::BIGINT AS stumpings
    FROM player_match_stats pms
    WHERE pms.player_id = p_id
      AND pms.tournament = ANY(p_tournaments);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- VERIFY
-- =====================================================================
-- After running, these should all return real, tournament-filtered data:
--
-- SELECT * FROM search_players_filtered(p_role := 'Bowler', p_min_matches := 5, lim := 5);
-- SELECT * FROM get_top_batsmen(5);
-- SELECT * FROM get_season_champion(2024);  -- IPL 2024, NOT Bahrain
-- SELECT * FROM get_season_champion(2024, ARRAY['T20I']);  -- Now CAN show Bahrain
-- SELECT * FROM get_top_batsmen(5, ARRAY['T20I']);  -- T20I-specific
