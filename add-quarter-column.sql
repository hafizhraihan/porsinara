-- ============================================
-- ADD QUARTER TRACKING TO BASKETBALL STATS
-- ============================================
-- This allows tracking which quarter the stats are from (Q1, Q2, Q3, Q4)

-- Option 1: Single column with enum (RECOMMENDED)
-- ================================================

-- Step 1: Add quarter column
ALTER TABLE basketball_stats 
ADD COLUMN quarter VARCHAR(2) CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4'));

-- Step 2: Set default to NULL (for full game stats) or Q1 (for new entries)
-- Choose one:

-- Option A: Default NULL (stats without quarter = full game stats)
ALTER TABLE basketball_stats 
ALTER COLUMN quarter SET DEFAULT NULL;

-- Option B: Default Q1 (force quarter selection)
-- ALTER TABLE basketball_stats 
-- ALTER COLUMN quarter SET DEFAULT 'Q1';

-- Step 3: Update unique constraint to allow same player, different quarters
-- Drop old constraint
ALTER TABLE basketball_stats 
DROP CONSTRAINT IF EXISTS basketball_stats_match_id_player_id_key;

-- Add new constraint (match + player + quarter must be unique)
ALTER TABLE basketball_stats 
ADD CONSTRAINT basketball_stats_match_player_quarter_key 
UNIQUE (match_id, player_id, quarter);

-- Step 4: Add comment
COMMENT ON COLUMN basketball_stats.quarter IS 'Basketball quarter: Q1, Q2, Q3, Q4, or NULL for full game stats';

-- Step 5: Verify
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'basketball_stats' 
  AND column_name = 'quarter';

-- Step 6: Show new unique constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND conname LIKE '%quarter%';

-- ============================================
-- USAGE EXAMPLES:
-- ============================================

-- Example 1: Insert stats for Q1
-- INSERT INTO basketball_stats (
--   match_id, player_id, quarter,
--   free_throw_attempt, free_throw_made
-- ) VALUES (
--   'match-uuid', 'player-uuid', 'Q1',
--   5, 3
-- );

-- Example 2: Insert stats for Q2 (same player, same match)
-- INSERT INTO basketball_stats (
--   match_id, player_id, quarter,
--   free_throw_attempt, free_throw_made
-- ) VALUES (
--   'match-uuid', 'player-uuid', 'Q2',
--   4, 2
-- );

-- Example 3: Get all quarters for a player in a match
-- SELECT 
--   quarter,
--   free_throw_attempt,
--   free_throw_made,
--   total_points
-- FROM basketball_stats
-- WHERE match_id = 'match-uuid'
--   AND player_id = 'player-uuid'
-- ORDER BY quarter;

-- Example 4: Get total stats across all quarters
-- SELECT 
--   player_id,
--   SUM(free_throw_made) as total_ft_made,
--   SUM(free_throw_attempt) as total_ft_attempt,
--   SUM(two_point_made) as total_2pt_made,
--   SUM(two_point_attempt) as total_2pt_attempt,
--   SUM(three_point_made) as total_3pt_made,
--   SUM(three_point_attempt) as total_3pt_attempt,
--   SUM(total_points) as total_points
-- FROM basketball_stats
-- WHERE match_id = 'match-uuid'
-- GROUP BY player_id;

-- ============================================
-- TESTING
-- ============================================

DO $$
DECLARE
  test_match_id uuid;
  test_player_id uuid;
BEGIN
  -- Get test IDs
  SELECT id INTO test_match_id
  FROM matches
  WHERE competition_id IN ('basketball-putra', 'basketball-putri')
  LIMIT 1;

  SELECT id INTO test_player_id
  FROM players
  LIMIT 1;

  IF test_match_id IS NULL OR test_player_id IS NULL THEN
    RAISE NOTICE '⚠️ No test data available';
  ELSE
    -- Test: Insert same player, different quarters
    BEGIN
      -- Q1 stats
      INSERT INTO basketball_stats (
        match_id, player_id, quarter,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id, 'Q1',
        5, 3, 10, 7
      );
      
      -- Q2 stats (same player!)
      INSERT INTO basketball_stats (
        match_id, player_id, quarter,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id, 'Q2',
        4, 2, 8, 5
      );
      
      RAISE NOTICE '✅ Test PASSED: Can insert multiple quarters for same player';
      
      -- Show results
      RAISE NOTICE 'Q1 Points: %', (SELECT total_points FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id AND quarter = 'Q1');
      RAISE NOTICE 'Q2 Points: %', (SELECT total_points FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id AND quarter = 'Q2');
      
      -- Cleanup
      DELETE FROM basketball_stats 
      WHERE match_id = test_match_id 
        AND player_id = test_player_id 
        AND quarter IN ('Q1', 'Q2');
        
      RAISE NOTICE '🧹 Test data cleaned up';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test FAILED: %', SQLERRM;
      -- Cleanup on error
      DELETE FROM basketball_stats 
      WHERE match_id = test_match_id 
        AND player_id = test_player_id 
        AND quarter IN ('Q1', 'Q2');
    END;
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ QUARTER COLUMN ADDED' as status,
  'Can now track stats per quarter (Q1, Q2, Q3, Q4)' as feature,
  'Same player can have multiple rows (one per quarter)' as note;


