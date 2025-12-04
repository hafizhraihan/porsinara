-- ============================================
-- ADD SET/PERIOD SCORE COLUMNS TO MATCHES TABLE
-- ============================================
-- Simple approach: Add columns for up to 5 sets/periods
-- Works for all sports with creative column usage:
-- - Basketball: Use set1-4 for Q1-Q4, set5 for OT
-- - Futsal: Use set1 for 1st Half, set2 for 2nd Half, set3 for Penalties
-- - Volleyball: Use set1-5 for Set 1-5
-- - Badminton: Use set1-3 for Set 1-3

-- Step 1: Add score columns for each set/period (faculty1)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS set1_score1 INTEGER DEFAULT NULL CHECK (set1_score1 >= 0),
ADD COLUMN IF NOT EXISTS set2_score1 INTEGER DEFAULT NULL CHECK (set2_score1 >= 0),
ADD COLUMN IF NOT EXISTS set3_score1 INTEGER DEFAULT NULL CHECK (set3_score1 >= 0),
ADD COLUMN IF NOT EXISTS set4_score1 INTEGER DEFAULT NULL CHECK (set4_score1 >= 0),
ADD COLUMN IF NOT EXISTS set5_score1 INTEGER DEFAULT NULL CHECK (set5_score1 >= 0);

-- Step 2: Add score columns for each set/period (faculty2)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS set1_score2 INTEGER DEFAULT NULL CHECK (set1_score2 >= 0),
ADD COLUMN IF NOT EXISTS set2_score2 INTEGER DEFAULT NULL CHECK (set2_score2 >= 0),
ADD COLUMN IF NOT EXISTS set3_score2 INTEGER DEFAULT NULL CHECK (set3_score2 >= 0),
ADD COLUMN IF NOT EXISTS set4_score2 INTEGER DEFAULT NULL CHECK (set4_score2 >= 0),
ADD COLUMN IF NOT EXISTS set5_score2 INTEGER DEFAULT NULL CHECK (set5_score2 >= 0);

-- Step 3: Add current_period column to track which period is active
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS current_period VARCHAR(20) DEFAULT 'UPCOMING' CHECK (
  current_period IN (
    'UPCOMING',           -- Not started
    'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5',  -- Generic periods
    'HT',                 -- Half Time
    'FT'                  -- Full Time (finished)
  )
);

-- Step 4: Add comments for clarity
COMMENT ON COLUMN matches.set1_score1 IS 'Faculty1 score for Set/Period 1 (Q1 for basketball, 1st Half for futsal, Set 1 for volleyball/badminton)';
COMMENT ON COLUMN matches.set2_score1 IS 'Faculty1 score for Set/Period 2 (Q2 for basketball, 2nd Half for futsal, Set 2 for volleyball/badminton)';
COMMENT ON COLUMN matches.set3_score1 IS 'Faculty1 score for Set/Period 3 (Q3 for basketball, Penalties for futsal, Set 3 for volleyball/badminton)';
COMMENT ON COLUMN matches.set4_score1 IS 'Faculty1 score for Set/Period 4 (Q4 for basketball, Set 4 for volleyball)';
COMMENT ON COLUMN matches.set5_score1 IS 'Faculty1 score for Set/Period 5 (OT for basketball, Set 5 for volleyball)';

COMMENT ON COLUMN matches.set1_score2 IS 'Faculty2 score for Set/Period 1';
COMMENT ON COLUMN matches.set2_score2 IS 'Faculty2 score for Set/Period 2';
COMMENT ON COLUMN matches.set3_score2 IS 'Faculty2 score for Set/Period 3';
COMMENT ON COLUMN matches.set4_score2 IS 'Faculty2 score for Set/Period 4';
COMMENT ON COLUMN matches.set5_score2 IS 'Faculty2 score for Set/Period 5';

COMMENT ON COLUMN matches.current_period IS 'Current period/set being played';

-- Step 5: Create trigger to auto-update total scores
CREATE OR REPLACE FUNCTION update_match_total_from_sets()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate total score from set scores
  -- For basketball/futsal: sum all sets
  -- For volleyball/badminton: count sets won (handled in application)
  
  NEW.score1 := COALESCE(NEW.set1_score1, 0) + 
                COALESCE(NEW.set2_score1, 0) + 
                COALESCE(NEW.set3_score1, 0) + 
                COALESCE(NEW.set4_score1, 0) + 
                COALESCE(NEW.set5_score1, 0);
  
  NEW.score2 := COALESCE(NEW.set1_score2, 0) + 
                COALESCE(NEW.set2_score2, 0) + 
                COALESCE(NEW.set3_score2, 0) + 
                COALESCE(NEW.set4_score2, 0) + 
                COALESCE(NEW.set5_score2, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_scores_trigger ON matches;

CREATE TRIGGER update_total_scores_trigger
BEFORE INSERT OR UPDATE OF set1_score1, set2_score1, set3_score1, set4_score1, set5_score1,
                            set1_score2, set2_score2, set3_score2, set4_score2, set5_score2
ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_total_from_sets();

-- Step 6: Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_set_scores 
ON matches(set1_score1, set2_score1, set3_score1, set4_score1, set5_score1);

-- Step 7: Verify columns
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'matches' 
  AND column_name LIKE '%set%_score%'
ORDER BY column_name;

-- ============================================
-- USAGE EXAMPLES BY SPORT
-- ============================================

-- BASKETBALL (Q1-Q4 + OT)
-- =============================
-- Set 1 = Q1
-- Set 2 = Q2
-- Set 3 = Q3
-- Set 4 = Q4
-- Set 5 = OT (if needed)

-- Example: Basketball match BBS vs SOD
-- UPDATE matches SET
--   set1_score1 = 12, set1_score2 = 10,  -- Q1: 12-10
--   set2_score1 = 15, set2_score2 = 14,  -- Q2: 15-14
--   set3_score1 = 18, set3_score2 = 16,  -- Q3: 18-16
--   set4_score1 = 20, set4_score2 = 17,  -- Q4: 20-17
--   current_period = 'FT'
-- WHERE id = 'basketball-match-uuid';
-- Result: score1 = 65 (12+15+18+20), score2 = 57 (auto-calculated)

-- FUTSAL (1H + 2H + Penalties)
-- =============================
-- Set 1 = 1st Half
-- Set 2 = 2nd Half
-- Set 3 = Penalties

-- Example: Futsal match with penalties
-- UPDATE matches SET
--   set1_score1 = 1, set1_score2 = 1,  -- 1st Half: 1-1
--   set2_score1 = 1, set2_score2 = 1,  -- 2nd Half: 1-1
--   set3_score1 = 4, set3_score2 = 3,  -- Penalties: 4-3
--   current_period = 'FT'
-- WHERE id = 'futsal-match-uuid';
-- Result: score1 = 6, score2 = 5 (but regulation was 2-2, penalties 4-3)

-- VOLLEYBALL (Set 1-5)
-- =============================
-- Set 1-5 = Set 1-5

-- Example: Volleyball match
-- UPDATE matches SET
--   set1_score1 = 25, set1_score2 = 22,  -- Set 1: 25-22 (SOCS wins)
--   set2_score1 = 23, set2_score2 = 25,  -- Set 2: 23-25 (BBS wins)
--   set3_score1 = 25, set3_score2 = 20,  -- Set 3: 25-20 (SOCS wins)
--   current_period = 'FT'
-- WHERE id = 'volleyball-match-uuid';
-- Result: score1 = 73, score2 = 67 (total points)
-- But winner is determined by sets won: SOCS 2-1 BBS

-- BADMINTON (Set 1-3)
-- =============================
-- Set 1-3 = Set 1-3

-- Example: Badminton match
-- UPDATE matches SET
--   set1_score1 = 21, set1_score2 = 18,  -- Set 1: 21-18 (SOD wins)
--   set2_score1 = 19, set2_score2 = 21,  -- Set 2: 19-21 (FDCHT wins)
--   set3_score1 = 21, set3_score2 = 15,  -- Set 3: 21-15 (SOD wins)
--   current_period = 'FT'
-- WHERE id = 'badminton-match-uuid';
-- Result: score1 = 61, score2 = 54 (total points)
-- But winner is SOD (2-1 in sets)

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to count sets won (for volleyball/badminton)
CREATE OR REPLACE FUNCTION get_sets_won(
  p_match_id UUID
) RETURNS TABLE(
  sets_won_faculty1 INTEGER,
  sets_won_faculty2 INTEGER
) AS $$
DECLARE
  s1_f1 INTEGER; s1_f2 INTEGER;
  s2_f1 INTEGER; s2_f2 INTEGER;
  s3_f1 INTEGER; s3_f2 INTEGER;
  s4_f1 INTEGER; s4_f2 INTEGER;
  s5_f1 INTEGER; s5_f2 INTEGER;
  f1_wins INTEGER := 0;
  f2_wins INTEGER := 0;
BEGIN
  -- Get set scores
  SELECT set1_score1, set1_score2,
         set2_score1, set2_score2,
         set3_score1, set3_score2,
         set4_score1, set4_score2,
         set5_score1, set5_score2
  INTO s1_f1, s1_f2, s2_f1, s2_f2, s3_f1, s3_f2, s4_f1, s4_f2, s5_f1, s5_f2
  FROM matches
  WHERE id = p_match_id;
  
  -- Count sets won
  IF s1_f1 > s1_f2 THEN f1_wins := f1_wins + 1; ELSIF s1_f2 > s1_f1 THEN f2_wins := f2_wins + 1; END IF;
  IF s2_f1 > s2_f2 THEN f1_wins := f1_wins + 1; ELSIF s2_f2 > s2_f1 THEN f2_wins := f2_wins + 1; END IF;
  IF s3_f1 > s3_f2 THEN f1_wins := f1_wins + 1; ELSIF s3_f2 > s3_f1 THEN f2_wins := f2_wins + 1; END IF;
  IF s4_f1 > s4_f2 THEN f1_wins := f1_wins + 1; ELSIF s4_f2 > s4_f1 THEN f2_wins := f2_wins + 1; END IF;
  IF s5_f1 > s5_f2 THEN f1_wins := f1_wins + 1; ELSIF s5_f2 > s5_f1 THEN f2_wins := f2_wins + 1; END IF;
  
  RETURN QUERY SELECT f1_wins, f2_wins;
END;
$$ LANGUAGE plpgsql;

-- Function to get regulation score (exclude penalties for futsal)
CREATE OR REPLACE FUNCTION get_regulation_score(
  p_match_id UUID
) RETURNS TABLE(
  regulation_score1 INTEGER,
  regulation_score2 INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(set1_score1, 0) + COALESCE(set2_score1, 0),
    COALESCE(set1_score2, 0) + COALESCE(set2_score2, 0)
  FROM matches
  WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTING
-- ============================================

DO $$
DECLARE
  test_match_id UUID;
BEGIN
  -- Get a basketball match for testing
  SELECT id INTO test_match_id
  FROM matches
  WHERE competition_id LIKE '%basketball%'
  LIMIT 1;

  IF test_match_id IS NULL THEN
    RAISE NOTICE '⚠️ No basketball match found for testing';
  ELSE
    RAISE NOTICE '✅ Testing with match: %', test_match_id;
    
    -- Set quarter scores
    UPDATE matches SET
      set1_score1 = 12, set1_score2 = 10,
      set2_score1 = 15, set2_score2 = 14,
      set3_score1 = 18, set3_score2 = 16,
      set4_score1 = 20, set4_score2 = 17
    WHERE id = test_match_id;
    
    RAISE NOTICE '✅ Set quarter scores (Q1-Q4)';
    
    -- Check auto-calculated totals
    DECLARE
      total1 INTEGER;
      total2 INTEGER;
    BEGIN
      SELECT score1, score2 INTO total1, total2
      FROM matches
      WHERE id = test_match_id;
      
      RAISE NOTICE '✅ Auto-calculated totals:';
      RAISE NOTICE '   Faculty1: % (should be 65)', total1;
      RAISE NOTICE '   Faculty2: % (should be 57)', total2;
      
      IF total1 = 65 AND total2 = 57 THEN
        RAISE NOTICE '✅ Auto-calculation CORRECT!';
      ELSE
        RAISE WARNING '⚠️ Auto-calculation incorrect';
      END IF;
    END;
    
    -- Reset
    UPDATE matches SET
      set1_score1 = NULL, set1_score2 = NULL,
      set2_score1 = NULL, set2_score2 = NULL,
      set3_score1 = NULL, set3_score2 = NULL,
      set4_score1 = NULL, set4_score2 = NULL,
      set5_score1 = NULL, set5_score2 = NULL,
      score1 = 0, score2 = 0
    WHERE id = test_match_id;
    
    RAISE NOTICE '🧹 Test data reset';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ SET SCORE COLUMNS ADDED' as status,
  '10 columns added (set1-5 for each faculty)' as columns,
  'Auto-calculation trigger created' as automation,
  'Works for all sports with creative mapping' as versatility;

-- Show column mapping guide
SELECT 
  'Sport' as sport,
  'Set 1' as set1_usage,
  'Set 2' as set2_usage,
  'Set 3' as set3_usage,
  'Set 4' as set4_usage,
  'Set 5' as set5_usage
UNION ALL
SELECT 'Basketball', 'Q1', 'Q2', 'Q3', 'Q4', 'OT'
UNION ALL
SELECT 'Futsal', '1st Half', '2nd Half', 'Penalties', 'n/a', 'n/a'
UNION ALL
SELECT 'Volleyball', 'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'
UNION ALL
SELECT 'Badminton', 'Set 1', 'Set 2', 'Set 3', 'n/a', 'n/a';







