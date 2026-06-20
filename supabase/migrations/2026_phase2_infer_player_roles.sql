-- =====================================================================
-- Phase 2.1 — Server-side player role inference
-- =====================================================================
-- Infers role (Batsman/Bowler/All-Rounder/WK-Batsman) for every player
-- WITHOUT an explicit role set, based on their aggregate ball/stumping
-- patterns in player_match_stats.
--
-- Runs in a single SQL statement — much faster than client-side loop.
-- Safe to re-run: only updates players whose role would change.
-- =====================================================================

WITH aggregates AS (
    SELECT
        pms.player_id,
        SUM(pms.balls_faced)      AS total_balls_faced,
        SUM(pms.overs_bowled) * 6 AS total_balls_bowled,
        SUM(pms.stumpings)        AS total_stumpings,
        SUM(pms.catches)          AS total_catches,
        COUNT(DISTINCT pms.match_id) AS total_matches
    FROM player_match_stats pms
    GROUP BY pms.player_id
),
inferred AS (
    SELECT
        a.player_id,
        CASE
            -- Wicket-keeper: has stumpings, OR catches lots without bowling
            WHEN a.total_stumpings >= 3
              OR (a.total_matches >= 10 AND a.total_catches > a.total_matches * 0.5 AND a.total_balls_bowled < 30)
                THEN 'WK-Batsman'
            -- All-Rounder: substantial bowler AND batter
            WHEN a.total_balls_bowled > 60
             AND a.total_balls_faced > 30
             AND a.total_balls_bowled > a.total_balls_faced * 0.4
                THEN 'All-Rounder'
            -- Pure bowler: bowls a lot, barely bats
            WHEN a.total_balls_bowled > 60
             AND a.total_balls_faced < 50
                THEN 'Bowler'
            -- Anyone else with meaningful bat data
            WHEN a.total_balls_faced > 30
                THEN 'Batsman'
            -- Very little data — default to Batsman (no-op)
            ELSE 'Batsman'
        END AS inferred_role
    FROM aggregates a
)
UPDATE players p
SET role = i.inferred_role
FROM inferred i
WHERE p.id = i.player_id
  -- Only update if (a) curated metadata hasn't been set, OR
  -- (b) current role is the default 'Batsman' and inference says otherwise.
  -- Curated entries have non-default batting_style or bowling_style set.
  AND p.batting_style = 'Right-Hand'        -- curated entries override this
  AND COALESCE(p.bowling_style, 'None') = 'None'  -- curated entries override this
  AND p.role != i.inferred_role;            -- skip rows already correct

-- Verify
SELECT role, COUNT(*) AS count FROM players GROUP BY role ORDER BY count DESC;
