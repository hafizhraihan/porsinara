-- ============================================
-- FIX BASKETBALL STATS CONSTRAINTS
-- ============================================
-- This script fixes overly strict constraints that might block valid data

-- Step 1: Check current constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c' -- Check constraints only
ORDER BY conname;

-- Step 2: Drop the problematic constraints
-- These are TOO STRICT - they prevent entering "attempt" without "made"
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check1;
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check2;
ALTER TABLE basketball_stats DROP CONSTRAINT IF EXISTS basketball_stats_check3;

-- Step 3: Add BETTER constraints
-- Only check that made <= attempt (not that made > 0 requires attempt > 0)

-- Free Throw constraints
ALTER TABLE basketball_stats 
ADD CONSTRAINT free_throw_valid 
CHECK (free_throw_made <= free_throw_attempt);

-- Two Point constraints
ALTER TABLE basketball_stats 
ADD CONSTRAINT two_point_valid 
CHECK (two_point_made <= two_point_attempt);

-- Three Point constraints
ALTER TABLE basketball_stats 
ADD CONSTRAINT three_point_valid 
CHECK (three_point_made <= three_point_attempt);

-- Step 4: Verify new constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
  AND conname LIKE '%valid%'
ORDER BY conname;

-- Step 5: Test with valid data
DO $$
DECLARE
  test_match_id uuid;
  test_player_id uuid;
  test_stat_id uuid;
BEGIN
  -- Get IDs
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
    -- Test 1: Valid data (made < attempt)
    BEGIN
      INSERT INTO basketball_stats (
        match_id, player_id,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id,
        5, 3,  -- Valid: 3 <= 5
        10, 7  -- Valid: 7 <= 10
      )
      RETURNING id INTO test_stat_id;
      
      RAISE NOTICE '✅ Test 1 PASSED: Can insert with made < attempt';
      DELETE FROM basketball_stats WHERE id = test_stat_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test 1 FAILED: %', SQLERRM;
    END;

    -- Test 2: Valid data (made = attempt)
    BEGIN
      INSERT INTO basketball_stats (
        match_id, player_id,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id,
        5, 5,  -- Valid: 5 = 5
        10, 10 -- Valid: 10 = 10
      )
      RETURNING id INTO test_stat_id;
      
      RAISE NOTICE '✅ Test 2 PASSED: Can insert with made = attempt';
      DELETE FROM basketball_stats WHERE id = test_stat_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test 2 FAILED: %', SQLERRM;
    END;

    -- Test 3: Valid data (only attempts, no made)
    BEGIN
      INSERT INTO basketball_stats (
        match_id, player_id,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id,
        5, 0,  -- Valid: 0 <= 5 (missed all)
        10, 0  -- Valid: 0 <= 10 (missed all)
      )
      RETURNING id INTO test_stat_id;
      
      RAISE NOTICE '✅ Test 3 PASSED: Can insert with only attempts (0 made)';
      DELETE FROM basketball_stats WHERE id = test_stat_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test 3 FAILED: %', SQLERRM;
    END;

    -- Test 4: Invalid data (made > attempt) - SHOULD FAIL
    BEGIN
      INSERT INTO basketball_stats (
        match_id, player_id,
        free_throw_attempt, free_throw_made
      ) VALUES (
        test_match_id, test_player_id,
        5, 10  -- Invalid: 10 > 5
      );
      
      RAISE WARNING '❌ Test 4 FAILED: Should have rejected made > attempt';
      DELETE FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '✅ Test 4 PASSED: Correctly rejected made > attempt';
    END;
  END IF;
END $$;

-- Step 6: Summary
SELECT 
  '✅ CONSTRAINTS FIXED' as status,
  'Can now enter attempts without made shots' as improvement,
  'Still validates that made <= attempt' as safety;

-- Show all check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
ORDER BY conname;

