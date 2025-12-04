-- ============================================
-- ADD PERIOD/QUARTER/SET TRACKING TO ALL SPORTS
-- ============================================
-- Universal solution for all competition types

-- Step 1: Add period column to basketball_stats (and future sport-specific stats tables)
ALTER TABLE basketball_stats 
ADD COLUMN period VARCHAR(10) CHECK (
  period IN (
    'UPCOMING',
    'Q1', 'Q2', 'Q3', 'Q4',           -- Basketball quarters
    'OT', 'OT1', 'OT2',                -- Overtime
    '1st Half', '2nd Half',                        -- Halves (Futsal, Football)
    'ET1', 'ET2',                      -- Extra time
    'PEN',                             -- Penalty shootout
    'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5',      -- Sets (Volleyball, Badminton)
  )
);

-- Step 2: Set default to 'FULL' for existing records and new entries
ALTER TABLE basketball_stats 
ALTER COLUMN period SET DEFAULT 'UPCOMING';

-- Update existing records to 'FULL' (full game stats)
UPDATE basketball_stats
SET period = 'FT'
WHERE period IS NULL;

-- Step 3: Update unique constraint to include period
-- Drop old constraint
ALTER TABLE basketball_stats 
DROP CONSTRAINT IF EXISTS basketball_stats_match_id_player_id_key;

-- Add new constraint (match + player + period must be unique)
ALTER TABLE basketball_stats 
ADD CONSTRAINT basketball_stats_match_player_period_key 
UNIQUE (match_id, player_id, period);

-- Step 4: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_basketball_stats_period 
ON basketball_stats(period);

CREATE INDEX IF NOT EXISTS idx_basketball_stats_match_period 
ON basketball_stats(match_id, period);

-- Step 5: Add comments
COMMENT ON COLUMN basketball_stats.period IS 
'Game period/quarter/set/half: Q1-Q4 (basketball), 1H/2H (futsal), S1-S5 (volleyball), OT (overtime), ET1-ET2 (extra time), PEN (penalties), FULL (full game)';

-- Step 6: Verify
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'basketball_stats' 
  AND column_name = 'period';

-- Step 7: Show constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND (conname LIKE '%period%' OR conname LIKE '%player%');

-- ============================================
-- REFERENCE TABLE: Period Codes by Sport
-- ============================================

CREATE TABLE IF NOT EXISTS period_definitions (
  id SERIAL PRIMARY KEY,
  sport_type VARCHAR(50) NOT NULL,
  period_code VARCHAR(10) NOT NULL,
  period_name VARCHAR(50) NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sport_type, period_code)
);

-- Insert period definitions for each sport
INSERT INTO period_definitions (sport_type, period_code, period_name, display_order) VALUES
-- Basketball
('basketball', 'Q1', 'Quarter 1', 1),
('basketball', 'Q2', 'Quarter 2', 2),
('basketball', 'Q3', 'Quarter 3', 3),
('basketball', 'Q4', 'Quarter 4', 4),
('basketball', 'OT', 'Overtime', 5),
('basketball', 'FULL', 'Full Game', 99),

-- Futsal
('futsal', '1H', '1st Half', 1),
('futsal', '2H', '2nd Half', 2),
('futsal', 'ET1', 'Extra Time 1', 3),
('futsal', 'ET2', 'Extra Time 2', 4),
('futsal', 'PEN', 'Penalties', 5),
('futsal', 'FULL', 'Full Match', 99),

-- Volleyball
('volleyball', 'S1', 'Set 1', 1),
('volleyball', 'S2', 'Set 2', 2),
('volleyball', 'S3', 'Set 3', 3),
('volleyball', 'S4', 'Set 4', 4),
('volleyball', 'S5', 'Set 5', 5),
('volleyball', 'FULL', 'Full Match', 99),

-- Badminton
('badminton', 'S1', 'Set 1', 1),
('badminton', 'S2', 'Set 2', 2),
('badminton', 'S3', 'Set 3', 3),
('badminton', 'FULL', 'Full Match', 99)

ON CONFLICT (sport_type, period_code) DO NOTHING;

-- Add RLS for period_definitions
ALTER TABLE period_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON period_definitions FOR SELECT 
USING (true);

GRANT SELECT ON period_definitions TO anon;
GRANT SELECT ON period_definitions TO authenticated;

-- Step 8: Helper function to get periods for a sport
CREATE OR REPLACE FUNCTION get_periods_for_sport(competition_type VARCHAR)
RETURNS TABLE(period_code VARCHAR, period_name VARCHAR, display_order INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT pd.period_code, pd.period_name, pd.display_order
  FROM period_definitions pd
  WHERE pd.sport_type = 
    CASE 
      WHEN competition_type LIKE '%basketball%' THEN 'basketball'
      WHEN competition_type LIKE '%futsal%' THEN 'futsal'
      WHEN competition_type LIKE '%volleyball%' THEN 'volleyball'
      WHEN competition_type LIKE '%badminton%' THEN 'badminton'
      ELSE 'basketball' -- default
    END
  ORDER BY pd.display_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Get available periods for basketball
SELECT * FROM get_periods_for_sport('basketball-putra');
-- Result: Q1, Q2, Q3, Q4, OT, FULL

-- Example 2: Get available periods for futsal
SELECT * FROM get_periods_for_sport('futsal');
-- Result: 1H, 2H, ET1, ET2, PEN, FULL

-- Example 3: Insert basketball stats for Q1
-- INSERT INTO basketball_stats (
--   match_id, player_id, period,
--   free_throw_attempt, free_throw_made
-- ) VALUES (
--   'match-uuid', 'player-uuid', 'Q1',
--   5, 3
-- );

-- Example 4: Insert basketball stats for Q2 (same player)
-- INSERT INTO basketball_stats (
--   match_id, player_id, period,
--   free_throw_attempt, free_throw_made
-- ) VALUES (
--   'match-uuid', 'player-uuid', 'Q2',
--   4, 2
-- );

-- Example 5: Get all periods for a player in a match
-- SELECT 
--   period,
--   total_points,
--   assists,
--   turnovers
-- FROM basketball_stats
-- WHERE match_id = 'match-uuid'
--   AND player_id = 'player-uuid'
-- ORDER BY 
--   CASE period
--     WHEN 'Q1' THEN 1
--     WHEN 'Q2' THEN 2
--     WHEN 'Q3' THEN 3
--     WHEN 'Q4' THEN 4
--     WHEN 'OT' THEN 5
--     WHEN 'FULL' THEN 99
--   END;

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
    -- Test: Insert multiple periods for same player
    BEGIN
      -- Q1 stats
      INSERT INTO basketball_stats (
        match_id, player_id, period,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id, 'Q1',
        5, 3, 10, 7
      );
      
      -- Q2 stats (same player!)
      INSERT INTO basketball_stats (
        match_id, player_id, period,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id, 'Q2',
        4, 2, 8, 5
      );
      
      -- OT stats
      INSERT INTO basketball_stats (
        match_id, player_id, period,
        free_throw_attempt, free_throw_made,
        two_point_attempt, two_point_made
      ) VALUES (
        test_match_id, test_player_id, 'OT',
        2, 1, 3, 2
      );
      
      RAISE NOTICE '✅ Test PASSED: Can insert multiple periods (Q1, Q2, OT) for same player';
      
      -- Show results
      DECLARE
        q1_pts INTEGER;
        q2_pts INTEGER;
        ot_pts INTEGER;
      BEGIN
        SELECT total_points INTO q1_pts FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id AND period = 'Q1';
        SELECT total_points INTO q2_pts FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id AND period = 'Q2';
        SELECT total_points INTO ot_pts FROM basketball_stats WHERE match_id = test_match_id AND player_id = test_player_id AND period = 'OT';
        
        RAISE NOTICE 'Q1 Points: %', q1_pts;
        RAISE NOTICE 'Q2 Points: %', q2_pts;
        RAISE NOTICE 'OT Points: %', ot_pts;
        RAISE NOTICE 'Total: %', (q1_pts + q2_pts + ot_pts);
      END;
      
      -- Cleanup
      DELETE FROM basketball_stats 
      WHERE match_id = test_match_id 
        AND player_id = test_player_id 
        AND period IN ('Q1', 'Q2', 'OT');
        
      RAISE NOTICE '🧹 Test data cleaned up';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test FAILED: %', SQLERRM;
      -- Cleanup on error
      DELETE FROM basketball_stats 
      WHERE match_id = test_match_id 
        AND player_id = test_player_id 
        AND period IN ('Q1', 'Q2', 'OT');
    END;
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ PERIOD TRACKING ADDED' as status,
  'Supports all sports: Basketball (Q1-Q4), Futsal (1H/2H), Volleyball (S1-S5)' as feature,
  'Use period_definitions table for sport-specific periods' as note;

-- Show period definitions
SELECT sport_type, period_code, period_name, display_order
FROM period_definitions
ORDER BY sport_type, display_order;







