-- ============================================
-- ADD PERIOD/QUARTER/SET TRACKING TO MATCHES TABLE
-- ============================================
-- Store current period information in the matches table
-- This allows tracking which period is currently being played

-- Step 1: Add period column to matches table
ALTER TABLE matches 
ADD COLUMN current_period VARCHAR(20) CHECK (
  current_period IN (
    'UPCOMING',                           -- Match not started yet
    'Q1', 'Q2', 'Q3', 'Q4',              -- Basketball quarters
    'OT', 'OT1', 'OT2',                  -- Overtime
    '1st Half', '2nd Half',              -- Halves (Futsal, Football)
    'ET1', 'ET2',                        -- Extra time
    'PEN',                               -- Penalty shootout
    'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5',  -- Sets (Volleyball, Badminton)
    'HT',                                -- Half Time
    'FT'                                 -- Full Time (match finished)
  )
);

-- Step 2: Set default based on match status
ALTER TABLE matches 
ALTER COLUMN current_period SET DEFAULT 'UPCOMING';

-- Update existing records based on status
UPDATE matches
SET current_period = CASE
  WHEN status = 'scheduled' THEN 'UPCOMING'
  WHEN status = 'completed' THEN 'FT'
  WHEN status = 'live' THEN 
    CASE 
      WHEN competition_id LIKE '%basketball%' THEN 'Q1'
      WHEN competition_id LIKE '%futsal%' THEN '1st Half'
      WHEN competition_id LIKE '%volleyball%' THEN 'Set 1'
      WHEN competition_id LIKE '%badminton%' THEN 'Set 1'
      ELSE 'Q1'
    END
  ELSE 'UPCOMING'
END
WHERE current_period IS NULL;

-- Step 3: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_current_period 
ON matches(current_period);

CREATE INDEX IF NOT EXISTS idx_matches_status_period 
ON matches(status, current_period);

-- Step 4: Add comment
COMMENT ON COLUMN matches.current_period IS 
'Current period/quarter/set/half of the match: UPCOMING (not started), Q1-Q4 (basketball), 1st Half/2nd Half (futsal), Set 1-5 (volleyball), HT (half time), FT (finished)';

-- Step 5: Create helper function to get next period
CREATE OR REPLACE FUNCTION get_next_period(
  current_period_val VARCHAR,
  competition_type VARCHAR
) RETURNS VARCHAR AS $$
BEGIN
  -- Basketball progression
  IF competition_type LIKE '%basketball%' THEN
    RETURN CASE current_period_val
      WHEN 'UPCOMING' THEN 'Q1'
      WHEN 'Q1' THEN 'Q2'
      WHEN 'Q2' THEN 'HT'
      WHEN 'HT' THEN 'Q3'
      WHEN 'Q3' THEN 'Q4'
      WHEN 'Q4' THEN 'FT'
      WHEN 'FT' THEN 'OT'  -- If game goes to overtime
      WHEN 'OT' THEN 'FT'
      ELSE 'FT'
    END;
  
  -- Futsal progression
  ELSIF competition_type LIKE '%futsal%' THEN
    RETURN CASE current_period_val
      WHEN 'UPCOMING' THEN '1st Half'
      WHEN '1st Half' THEN 'HT'
      WHEN 'HT' THEN '2nd Half'
      WHEN '2nd Half' THEN 'FT'
      WHEN 'FT' THEN 'ET1'  -- If game goes to extra time
      WHEN 'ET1' THEN 'ET2'
      WHEN 'ET2' THEN 'PEN'
      WHEN 'PEN' THEN 'FT'
      ELSE 'FT'
    END;
  
  -- Volleyball progression
  ELSIF competition_type LIKE '%volleyball%' THEN
    RETURN CASE current_period_val
      WHEN 'UPCOMING' THEN 'Set 1'
      WHEN 'Set 1' THEN 'Set 2'
      WHEN 'Set 2' THEN 'Set 3'
      WHEN 'Set 3' THEN 'Set 4'
      WHEN 'Set 4' THEN 'Set 5'
      WHEN 'Set 5' THEN 'FT'
      ELSE 'FT'
    END;
  
  -- Badminton progression
  ELSIF competition_type LIKE '%badminton%' THEN
    RETURN CASE current_period_val
      WHEN 'UPCOMING' THEN 'Set 1'
      WHEN 'Set 1' THEN 'Set 2'
      WHEN 'Set 2' THEN 'Set 3'
      WHEN 'Set 3' THEN 'FT'
      ELSE 'FT'
    END;
  
  ELSE
    RETURN 'FT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to advance period
CREATE OR REPLACE FUNCTION advance_match_period(match_id_val UUID)
RETURNS VARCHAR AS $$
DECLARE
  current_comp VARCHAR;
  current_per VARCHAR;
  next_per VARCHAR;
BEGIN
  -- Get current period and competition
  SELECT competition_id, current_period 
  INTO current_comp, current_per
  FROM matches
  WHERE id = match_id_val;
  
  -- Get next period
  next_per := get_next_period(current_per, current_comp);
  
  -- Update match
  UPDATE matches
  SET current_period = next_per,
      status = CASE 
        WHEN next_per = 'FT' THEN 'completed'
        WHEN next_per != 'UPCOMING' THEN 'live'
        ELSE status
      END
  WHERE id = match_id_val;
  
  RETURN next_per;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Verify
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'matches' 
  AND column_name = 'current_period';

-- Step 8: Show sample data
SELECT 
  id,
  competition_id,
  status,
  current_period,
  score1,
  score2
FROM matches
ORDER BY date DESC, time DESC
LIMIT 5;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Get all live matches with their current period
-- SELECT 
--   m.id,
--   c.name as competition,
--   f1.short_name || ' vs ' || f2.short_name as matchup,
--   m.current_period,
--   m.score1 || '-' || m.score2 as score
-- FROM matches m
-- JOIN competitions c ON m.competition_id = c.id
-- JOIN faculties f1 ON m.faculty1_id = f1.id
-- JOIN faculties f2 ON m.faculty2_id = f2.id
-- WHERE m.status = 'live'
-- ORDER BY m.date, m.time;

-- Example 2: Advance a match to next period
-- SELECT advance_match_period('match-uuid');
-- -- This will move Q1 -> Q2, or 1st Half -> HT, etc.

-- Example 3: Manually set match period
-- UPDATE matches
-- SET current_period = 'Q3'
-- WHERE id = 'match-uuid';

-- Example 4: Get matches in specific period
-- SELECT * FROM matches
-- WHERE current_period = 'Q4'
--   AND status = 'live';

-- Example 5: Reset match to upcoming
-- UPDATE matches
-- SET current_period = 'UPCOMING',
--     status = 'scheduled'
-- WHERE id = 'match-uuid';

-- ============================================
-- TESTING
-- ============================================

DO $$
DECLARE
  test_match_id uuid;
  test_competition VARCHAR;
  current_per VARCHAR;
  next_per VARCHAR;
BEGIN
  -- Get a basketball match
  SELECT id, competition_id INTO test_match_id, test_competition
  FROM matches
  WHERE competition_id LIKE '%basketball%'
  LIMIT 1;

  IF test_match_id IS NULL THEN
    RAISE NOTICE '⚠️ No basketball match found for testing';
  ELSE
    RAISE NOTICE '✅ Testing with match: %', test_match_id;
    
    -- Test period progression
    UPDATE matches SET current_period = 'UPCOMING' WHERE id = test_match_id;
    
    -- Test Q1
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'UPCOMING → %', next_per;
    
    -- Test Q2
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'Q1 → %', next_per;
    
    -- Test HT
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'Q2 → %', next_per;
    
    -- Test Q3
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'HT → %', next_per;
    
    -- Test Q4
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'Q3 → %', next_per;
    
    -- Test FT
    next_per := advance_match_period(test_match_id);
    RAISE NOTICE 'Q4 → %', next_per;
    
    -- Reset to original state
    UPDATE matches 
    SET current_period = 'UPCOMING', status = 'scheduled'
    WHERE id = test_match_id;
    
    RAISE NOTICE '✅ Period progression test completed';
    RAISE NOTICE '🧹 Match reset to UPCOMING';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ PERIOD COLUMN ADDED TO MATCHES' as status,
  'Tracks current period for all sports' as feature,
  'Use advance_match_period() to move to next period' as note;

-- Show period distribution
SELECT 
  current_period,
  COUNT(*) as match_count
FROM matches
GROUP BY current_period
ORDER BY match_count DESC;

-- ============================================
-- INTEGRATION WITH BASKETBALL_STATS (OPTIONAL)
-- ============================================

-- If you also want to track stats per period in basketball_stats,
-- you can add a period column there too:

-- ALTER TABLE basketball_stats 
-- ADD COLUMN period VARCHAR(20) REFERENCES matches(current_period);

-- Or use the match's current_period when querying:
-- SELECT bs.*, m.current_period
-- FROM basketball_stats bs
-- JOIN matches m ON bs.match_id = m.id
-- WHERE m.id = 'match-uuid';







