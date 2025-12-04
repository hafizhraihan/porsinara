-- ============================================
-- QUICK FIX: Basketball Stats Permission Issues
-- ============================================
-- Run this script if you're getting permission errors

-- Step 1: Verify table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'basketball_stats'
  ) THEN
    RAISE NOTICE '✅ basketball_stats table EXISTS';
  ELSE
    RAISE EXCEPTION '❌ basketball_stats table DOES NOT EXIST - Run create-basketball-stats-table.sql first!';
  END IF;
END $$;

-- Step 2: Enable RLS
ALTER TABLE basketball_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Allow public read access" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated insert" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated update" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated delete" ON basketball_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable insert access for all users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable update access for all users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable delete access for all users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON basketball_stats;

DROP POLICY IF EXISTS "Allow public read access" ON players;
DROP POLICY IF EXISTS "Allow authenticated insert" ON players;
DROP POLICY IF EXISTS "Allow authenticated update" ON players;
DROP POLICY IF EXISTS "Allow authenticated delete" ON players;
DROP POLICY IF EXISTS "Enable read access for all users" ON players;
DROP POLICY IF EXISTS "Enable insert access for all users" ON players;
DROP POLICY IF EXISTS "Enable update access for all users" ON players;
DROP POLICY IF EXISTS "Enable delete access for all users" ON players;

-- Step 4: Create NEW policies with full access
-- Basketball Stats
CREATE POLICY "Enable read access for all users" 
ON basketball_stats FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON basketball_stats FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON basketball_stats FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all users" 
ON basketball_stats FOR DELETE 
USING (true);

-- Players
CREATE POLICY "Enable read access for all users" 
ON players FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON players FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON players FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all users" 
ON players FOR DELETE 
USING (true);

-- Step 5: Grant permissions to roles
GRANT ALL ON basketball_stats TO anon;
GRANT ALL ON basketball_stats TO authenticated;
GRANT ALL ON basketball_stats TO service_role;

GRANT ALL ON players TO anon;
GRANT ALL ON players TO authenticated;
GRANT ALL ON players TO service_role;

-- Step 6: Verify trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'basketball_stats'
      AND trigger_name = 'calculate_basketball_totals_trigger'
  ) THEN
    RAISE NOTICE '✅ Auto-calculation trigger EXISTS';
  ELSE
    RAISE WARNING '⚠️ Auto-calculation trigger MISSING - total_points and total_rebound won''t auto-calculate!';
  END IF;
END $$;

-- Step 7: Test INSERT (with valid match_id and player_id)
-- First, get a valid match_id
DO $$
DECLARE
  test_match_id uuid;
  test_player_id uuid;
  test_stat_id uuid;
BEGIN
  -- Get a basketball match
  SELECT id INTO test_match_id
  FROM matches
  WHERE competition_id IN ('basketball-putra', 'basketball-putri')
  LIMIT 1;

  -- Get a player
  SELECT id INTO test_player_id
  FROM players
  LIMIT 1;

  IF test_match_id IS NULL THEN
    RAISE WARNING '⚠️ No basketball matches found - cannot test INSERT';
  ELSIF test_player_id IS NULL THEN
    RAISE WARNING '⚠️ No players found - cannot test INSERT';
  ELSE
    -- Try INSERT
    BEGIN
      INSERT INTO basketball_stats (
        match_id,
        player_id,
        free_throw_attempt,
        free_throw_made,
        two_point_attempt,
        two_point_made
      ) VALUES (
        test_match_id,
        test_player_id,
        5,
        3,
        10,
        7
      )
      RETURNING id INTO test_stat_id;

      RAISE NOTICE '✅ INSERT test SUCCESSFUL - stat_id: %', test_stat_id;
      
      -- Verify auto-calculation
      DECLARE
        calc_points integer;
        calc_rebound integer;
      BEGIN
        SELECT total_points, total_rebound 
        INTO calc_points, calc_rebound
        FROM basketball_stats
        WHERE id = test_stat_id;
        
        IF calc_points = 17 THEN  -- 3 + (7*2) = 17
          RAISE NOTICE '✅ Auto-calculation WORKS - total_points: %', calc_points;
        ELSE
          RAISE WARNING '⚠️ Auto-calculation FAILED - expected 17, got %', calc_points;
        END IF;
      END;
      
      -- Cleanup test data
      DELETE FROM basketball_stats WHERE id = test_stat_id;
      RAISE NOTICE '🧹 Test data cleaned up';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ INSERT test FAILED: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 8: Summary
SELECT 
  '✅ SETUP COMPLETE' as status,
  'Run diagnose-basketball-stats.sql to verify everything works' as next_step;

-- Verify policies are active
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('basketball_stats', 'players')
ORDER BY tablename, policyname;


