-- ============================================
-- REMOVE BASKETBALL STATS CONSTRAINTS
-- ============================================
-- ⚠️ WARNING: This removes data validation!
-- ⚠️ This allows invalid data like: made > attempt
-- ⚠️ Only run this if you're absolutely sure!

-- Step 1: Show current constraints before removal
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
  AND (
    conname LIKE '%check%' 
    OR conname LIKE '%made%' 
    OR conname LIKE '%attempt%'
  )
ORDER BY conname;

-- Step 2: Remove the "made <= attempt" constraints
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check;
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check1;
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check2;

-- These are the constraints being removed:
-- basketball_stats_check:  CHECK (free_throw_made <= free_throw_attempt)
-- basketball_stats_check1: CHECK (two_point_made <= two_point_attempt)
-- basketball_stats_check2: CHECK (three_point_made <= three_point_attempt)

-- Step 3: Verify constraints are removed
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
  AND (
    conname = 'basketball_stats_check'
    OR conname = 'basketball_stats_check1'
    OR conname = 'basketball_stats_check2'
  );

-- If empty result above, constraints are successfully removed

-- Step 4: Test that invalid data is now allowed (THIS IS BAD!)
DO $$
DECLARE
  test_match_id uuid;
  test_player_id uuid;
  test_stat_id uuid;
BEGIN
  SELECT id INTO test_match_id
  FROM matches
  WHERE competition_id IN ('basketball-putra', 'basketball-putri')
  LIMIT 1;

  SELECT id INTO test_player_id
  FROM players
  WHERE id NOT IN (SELECT player_id FROM basketball_stats WHERE match_id = test_match_id)
  LIMIT 1;

  IF test_match_id IS NULL OR test_player_id IS NULL THEN
    RAISE NOTICE '⚠️ Cannot test - no available match or player';
  ELSE
    -- Test: Insert INVALID data (made > attempt)
    BEGIN
      INSERT INTO basketball_stats (
        match_id, player_id,
        three_point_attempt, three_point_made
      ) VALUES (
        test_match_id, test_player_id,
        5, 10  -- INVALID: 10 > 5 (but will now be allowed!)
      )
      RETURNING id INTO test_stat_id;
      
      RAISE WARNING '⚠️ CONSTRAINTS REMOVED: Invalid data (made=10, attempt=5) was ACCEPTED!';
      RAISE WARNING '⚠️ This is BAD - your database can now store incorrect statistics!';
      
      -- Cleanup
      DELETE FROM basketball_stats WHERE id = test_stat_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '✅ Good news: Constraints still exist (error: %)', SQLERRM;
    END;
  END IF;
END $$;

-- Step 5: Show remaining constraints
SELECT 
  '⚠️ CONSTRAINTS REMOVED' as status,
  'Database can now accept invalid data (made > attempt)' as warning,
  'Consider adding application-level validation!' as recommendation;

SELECT 
  conname AS remaining_constraint,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
ORDER BY conname;

-- ============================================
-- WHAT THIS MEANS:
-- 
-- ✅ You can now save stats even if made > attempt
-- ❌ Database will accept invalid data like:
--    - 100 successful shots from 5 attempts
--    - 50 made free throws with 0 attempts
-- 
-- ⚠️ YOU ARE RESPONSIBLE FOR VALIDATION IN YOUR APP!
-- ⚠️ Add validation in handleSaveAllBasketballStats()
-- 
-- To restore constraints, run:
-- fix-basketball-constraints.sql
-- ============================================

