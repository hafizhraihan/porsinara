-- Test basketball stats auto-calculation
-- Make sure you have a basketball match created first!
-- Replace 'YOUR-MATCH-ID' with an actual match ID from your matches table

-- First, let's see available basketball matches
SELECT 
  m.id,
  m.date,
  c.name as competition,
  f1.name as faculty1,
  f2.name as faculty2
FROM matches m
JOIN competitions c ON m.competition_id = c.id
JOIN faculties f1 ON m.faculty1_id = f1.id
JOIN faculties f2 ON m.faculty2_id = f2.id
WHERE c.name LIKE '%Basketball%'
ORDER BY m.date DESC
LIMIT 5;

-- Get player IDs (John Doe from SoCS)
SELECT id, name, jersey_number, position 
FROM players 
WHERE name = 'John Doe' 
LIMIT 1;

-- ============================================
-- INSERT TEST STATS
-- ============================================
-- IMPORTANT: Replace these IDs with actual values from above queries:
-- - Replace 'YOUR-MATCH-ID' with a real match ID
-- - Replace 'YOUR-PLAYER-ID' with John Doe's player ID

-- Example stats for John Doe:
-- FT: 8/10 = 8 points
-- 2PT: 5/12 = 10 points
-- 3PT: 3/7 = 9 points
-- Total: 27 points (auto-calculated)
-- Rebounds: 3 OFF + 5 DEF = 8 total (auto-calculated)

/*
INSERT INTO basketball_stats (
  match_id,
  player_id,
  -- Shooting
  free_throw_made, free_throw_attempt,
  two_point_made, two_point_attempt,
  three_point_made, three_point_attempt,
  -- Rebounds
  offensive_rebound, defensive_rebound,
  -- Other stats
  assists, steals, blocks, turnovers, fouls,
  -- Game info
  minutes_played, is_starter
) VALUES (
  'YOUR-MATCH-ID',  -- Replace with actual match ID
  'YOUR-PLAYER-ID', -- Replace with actual player ID (John Doe)
  -- Shooting
  8, 10,  -- Free throws: 8 made, 10 attempted
  5, 12,  -- 2-pointers: 5 made, 12 attempted
  3, 7,   -- 3-pointers: 3 made, 7 attempted
  -- Rebounds
  3, 5,   -- 3 offensive, 5 defensive
  -- Other stats
  4,      -- 4 assists
  2,      -- 2 steals
  1,      -- 1 block
  3,      -- 3 turnovers
  4,      -- 4 fouls
  -- Game info
  28,     -- 28 minutes played
  true    -- Starting lineup
);
*/

-- After inserting, verify auto-calculation worked:
/*
SELECT 
  p.name,
  p.jersey_number,
  -- Shooting
  bs.free_throw_made, bs.free_throw_attempt,
  bs.two_point_made, bs.two_point_attempt,
  bs.three_point_made, bs.three_point_attempt,
  -- Auto-calculated
  bs.total_points,    -- Should be: 8 + (5*2) + (3*3) = 27
  bs.total_rebound,   -- Should be: 3 + 5 = 8
  -- Other stats
  bs.assists, bs.steals, bs.blocks, bs.turnovers, bs.fouls,
  bs.minutes_played, bs.is_starter
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE p.name = 'John Doe';
*/

-- Calculate shooting percentages (frontend would do this):
/*
SELECT 
  p.name,
  -- Free throw percentage
  ROUND((bs.free_throw_made::decimal / NULLIF(bs.free_throw_attempt, 0) * 100), 1) as ft_percent,
  -- 2-point percentage
  ROUND((bs.two_point_made::decimal / NULLIF(bs.two_point_attempt, 0) * 100), 1) as two_pt_percent,
  -- 3-point percentage
  ROUND((bs.three_point_made::decimal / NULLIF(bs.three_point_attempt, 0) * 100), 1) as three_pt_percent,
  -- Field goal percentage (all shots except FT)
  ROUND(((bs.two_point_made + bs.three_point_made)::decimal / 
         NULLIF(bs.two_point_attempt + bs.three_point_attempt, 0) * 100), 1) as fg_percent,
  -- Totals
  bs.total_points,
  bs.total_rebound
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE p.name = 'John Doe';
*/

