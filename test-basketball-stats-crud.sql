-- ============================================
-- TEST CRUD OPERATIONS ON BASKETBALL_STATS
-- ============================================
-- Run this to test if INSERT/UPDATE/SELECT work

-- 1. Get a valid match_id (basketball match)
SELECT 
  id as match_id,
  team1_name,
  team2_name,
  competition_id
FROM matches
WHERE competition_id IN ('basketball-putra', 'basketball-putri')
LIMIT 1;

-- 2. Get a valid player_id
SELECT 
  id as player_id,
  name,
  faculty_id
FROM players
LIMIT 1;

-- 3. Test INSERT (replace the UUIDs below with actual values from steps 1 & 2)
-- Example:
-- INSERT INTO basketball_stats (
--   match_id,
--   player_id,
--   free_throw_attempt,
--   free_throw_made,
--   two_point_attempt,
--   two_point_made
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual match_id
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual player_id
--   5,
--   3,
--   10,
--   7
-- );

-- 4. Test SELECT after insert
-- SELECT * FROM basketball_stats 
-- WHERE match_id = '00000000-0000-0000-0000-000000000000';

-- 5. Test UPDATE
-- UPDATE basketball_stats
-- SET assists = 5, turnovers = 2
-- WHERE match_id = '00000000-0000-0000-0000-000000000000'
--   AND player_id = '00000000-0000-0000-0000-000000000000';

-- 6. Verify total_points and total_rebound are auto-calculated
-- SELECT 
--   player_id,
--   free_throw_made,
--   two_point_made,
--   three_point_made,
--   total_points, -- Should be: FT + (2PT * 2) + (3PT * 3)
--   offensive_rebound,
--   defensive_rebound,
--   total_rebound -- Should be: OFF + DEF
-- FROM basketball_stats
-- WHERE match_id = '00000000-0000-0000-0000-000000000000';

-- 7. Test DELETE (cleanup test data)
-- DELETE FROM basketball_stats
-- WHERE match_id = '00000000-0000-0000-0000-000000000000'
--   AND player_id = '00000000-0000-0000-0000-000000000000';

-- ============================================
-- INSTRUCTIONS:
-- 1. Run query #1 to get a match_id
-- 2. Run query #2 to get a player_id
-- 3. Uncomment and update the INSERT with actual IDs
-- 4. Run the INSERT
-- 5. Uncomment and run SELECT to verify
-- 6. If any query fails, check error message for clues
-- ============================================


