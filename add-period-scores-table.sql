-- ============================================
-- PERIOD SCORES TABLE
-- ============================================
-- Store scores for each period/set/half separately
-- Supports: Basketball quarters, Volleyball sets, Badminton sets, Futsal halves, Penalties

CREATE TABLE IF NOT EXISTS period_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (
    period IN (
      'Q1', 'Q2', 'Q3', 'Q4',              -- Basketball quarters
      'OT', 'OT1', 'OT2',                  -- Overtime
      '1st Half', '2nd Half',              -- Halves (Futsal, Football)
      'ET1', 'ET2',                        -- Extra time
      'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5',  -- Sets (Volleyball, Badminton)
      'PEN'                                -- Penalty shootout
    )
  ),
  faculty1_score INTEGER DEFAULT 0 CHECK (faculty1_score >= 0),
  faculty2_score INTEGER DEFAULT 0 CHECK (faculty2_score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one score record per match per period
  UNIQUE(match_id, period)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_period_scores_match_id ON period_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_period_scores_period ON period_scores(period);

-- RLS policies
ALTER TABLE period_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON period_scores FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON period_scores FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON period_scores FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all users" 
ON period_scores FOR DELETE 
USING (true);

GRANT ALL ON period_scores TO anon;
GRANT ALL ON period_scores TO authenticated;

-- Add comment
COMMENT ON TABLE period_scores IS 'Stores scores for each period/quarter/set/half of a match';
COMMENT ON COLUMN period_scores.period IS 'Period identifier: Q1-Q4 (basketball), Set 1-5 (volleyball), 1st Half/2nd Half (futsal), PEN (penalties)';

-- ============================================
-- TRIGGER: Auto-update matches.score1 and matches.score2
-- ============================================

CREATE OR REPLACE FUNCTION update_match_total_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the match total scores based on period scores
  UPDATE matches m
  SET 
    score1 = (
      SELECT COALESCE(SUM(faculty1_score), 0)
      FROM period_scores
      WHERE match_id = m.id
    ),
    score2 = (
      SELECT COALESCE(SUM(faculty2_score), 0)
      FROM period_scores
      WHERE match_id = m.id
    ),
    updated_at = NOW()
  WHERE m.id = COALESCE(NEW.match_id, OLD.match_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_scores_trigger ON period_scores;

CREATE TRIGGER update_match_scores_trigger
AFTER INSERT OR UPDATE OR DELETE ON period_scores
FOR EACH ROW
EXECUTE FUNCTION update_match_total_scores();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to upsert period score
CREATE OR REPLACE FUNCTION upsert_period_score(
  p_match_id UUID,
  p_period VARCHAR,
  p_faculty1_score INTEGER,
  p_faculty2_score INTEGER
) RETURNS period_scores AS $$
DECLARE
  result period_scores;
BEGIN
  INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score)
  VALUES (p_match_id, p_period, p_faculty1_score, p_faculty2_score)
  ON CONFLICT (match_id, period) 
  DO UPDATE SET
    faculty1_score = p_faculty1_score,
    faculty2_score = p_faculty2_score,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get period scores for a match
CREATE OR REPLACE FUNCTION get_period_scores(p_match_id UUID)
RETURNS TABLE(
  period VARCHAR,
  faculty1_score INTEGER,
  faculty2_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.period, ps.faculty1_score, ps.faculty2_score
  FROM period_scores ps
  WHERE ps.match_id = p_match_id
  ORDER BY
    CASE ps.period
      WHEN 'Q1' THEN 1
      WHEN 'Q2' THEN 2
      WHEN 'Q3' THEN 3
      WHEN 'Q4' THEN 4
      WHEN 'OT' THEN 5
      WHEN '1st Half' THEN 1
      WHEN '2nd Half' THEN 2
      WHEN 'ET1' THEN 3
      WHEN 'ET2' THEN 4
      WHEN 'Set 1' THEN 1
      WHEN 'Set 2' THEN 2
      WHEN 'Set 3' THEN 3
      WHEN 'Set 4' THEN 4
      WHEN 'Set 5' THEN 5
      WHEN 'PEN' THEN 99
      ELSE 100
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Basketball - Store quarter scores
-- INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score) VALUES
-- ('match-uuid', 'Q1', 12, 10),
-- ('match-uuid', 'Q2', 15, 14),
-- ('match-uuid', 'Q3', 18, 16),
-- ('match-uuid', 'Q4', 20, 17);
-- Result: matches.score1 = 65 (12+15+18+20), matches.score2 = 57 (auto-updated)

-- Example 2: Volleyball - Store set scores
-- INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score) VALUES
-- ('match-uuid', 'Set 1', 25, 22),
-- ('match-uuid', 'Set 2', 23, 25),
-- ('match-uuid', 'Set 3', 25, 20);
-- Result: Faculty1 wins 2-1 (sets won, not total points)

-- Example 3: Futsal - Store half scores + penalties
-- INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score) VALUES
-- ('match-uuid', '1st Half', 1, 1),
-- ('match-uuid', '2nd Half', 1, 1),
-- ('match-uuid', 'PEN', 4, 3);  -- Penalty shootout
-- Result: 2-2 in regulation, 4-3 in penalties

-- Example 4: Badminton - Store set scores
-- INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score) VALUES
-- ('match-uuid', 'Set 1', 21, 18),
-- ('match-uuid', 'Set 2', 19, 21),
-- ('match-uuid', 'Set 3', 21, 15);
-- Result: Faculty1 wins 2-1 (sets)

-- Example 5: Upsert (insert or update)
-- SELECT upsert_period_score('match-uuid', 'Q1', 15, 12);
-- -- Updates Q1 score if exists, inserts if not

-- Example 6: Get all period scores for a match
-- SELECT * FROM get_period_scores('match-uuid');
-- Result:
-- period | faculty1_score | faculty2_score
-- Q1     | 12             | 10
-- Q2     | 15             | 14
-- Q3     | 18             | 16
-- Q4     | 20             | 17

-- ============================================
-- TESTING
-- ============================================

DO $$
DECLARE
  test_match_id uuid;
  test_comp_id VARCHAR;
BEGIN
  -- Get a basketball match for testing
  SELECT id, competition_id INTO test_match_id, test_comp_id
  FROM matches
  WHERE competition_id LIKE '%basketball%'
  LIMIT 1;

  IF test_match_id IS NULL THEN
    RAISE NOTICE '⚠️ No basketball match found for testing';
  ELSE
    RAISE NOTICE '✅ Testing with match: %', test_match_id;
    
    -- Insert quarter scores
    INSERT INTO period_scores (match_id, period, faculty1_score, faculty2_score) VALUES
    (test_match_id, 'Q1', 12, 10),
    (test_match_id, 'Q2', 15, 14),
    (test_match_id, 'Q3', 18, 16),
    (test_match_id, 'Q4', 20, 17);
    
    RAISE NOTICE '✅ Inserted 4 quarter scores';
    
    -- Check match total (should auto-update via trigger)
    DECLARE
      total1 INTEGER;
      total2 INTEGER;
    BEGIN
      SELECT score1, score2 INTO total1, total2
      FROM matches
      WHERE id = test_match_id;
      
      RAISE NOTICE '✅ Match totals auto-updated:';
      RAISE NOTICE '   Faculty 1: % (12+15+18+20)', total1;
      RAISE NOTICE '   Faculty 2: % (10+14+16+17)', total2;
      
      IF total1 = 65 AND total2 = 57 THEN
        RAISE NOTICE '✅ Auto-calculation CORRECT!';
      ELSE
        RAISE WARNING '⚠️ Auto-calculation incorrect: expected 65-57, got %-% ', total1, total2;
      END IF;
    END;
    
    -- Test upsert (update Q1 score)
    PERFORM upsert_period_score(test_match_id, 'Q1', 20, 15);
    RAISE NOTICE '✅ Updated Q1 score to 20-15';
    
    -- Check updated total
    DECLARE
      new_total1 INTEGER;
      new_total2 INTEGER;
    BEGIN
      SELECT score1, score2 INTO new_total1, new_total2
      FROM matches
      WHERE id = test_match_id;
      
      RAISE NOTICE '✅ New totals: %-% (should be 73-62)', new_total1, new_total2;
    END;
    
    -- Cleanup
    DELETE FROM period_scores WHERE match_id = test_match_id;
    UPDATE matches SET score1 = 0, score2 = 0 WHERE id = test_match_id;
    
    RAISE NOTICE '🧹 Test data cleaned up';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '✅ PERIOD_SCORES TABLE CREATED' as status,
  'Stores scores per quarter/set/half' as feature,
  'Auto-updates matches total scores via trigger' as automation;

-- ============================================
-- SPECIAL CASES
-- ============================================

-- VOLLEYBALL / BADMINTON: Sets Won (not total points)
-- For set-based sports, you might want to count sets won instead of total points
-- Create a view:

CREATE OR REPLACE VIEW match_results_with_sets AS
SELECT 
  m.id,
  m.competition_id,
  m.faculty1_id,
  m.faculty2_id,
  m.status,
  m.score1 as total_points_faculty1,
  m.score2 as total_points_faculty2,
  -- Count sets won
  (SELECT COUNT(*) 
   FROM period_scores ps 
   WHERE ps.match_id = m.id 
     AND ps.faculty1_score > ps.faculty2_score) as sets_won_faculty1,
  (SELECT COUNT(*) 
   FROM period_scores ps 
   WHERE ps.match_id = m.id 
     AND ps.faculty2_score > ps.faculty1_score) as sets_won_faculty2,
  m.current_period,
  m.date,
  m.time
FROM matches m;

-- Query example:
-- SELECT * FROM match_results_with_sets
-- WHERE competition_id = 'volleyball';
-- Shows both total points AND sets won

-- ============================================
-- PENALTIES HANDLING (FUTSAL)
-- ============================================

-- For futsal with penalties, you can:
-- 1. Store regulation time in 1st Half + 2nd Half
-- 2. Store penalty shootout in PEN period
-- 3. Display winner based on:
--    - If total (1H + 2H) is tied → winner from PEN
--    - Else → winner from total

CREATE OR REPLACE FUNCTION get_match_winner(p_match_id UUID)
RETURNS TABLE(
  winner_faculty_id UUID,
  win_type VARCHAR
) AS $$
DECLARE
  f1_id UUID;
  f2_id UUID;
  reg_score1 INTEGER;
  reg_score2 INTEGER;
  pen_score1 INTEGER;
  pen_score2 INTEGER;
BEGIN
  -- Get faculty IDs
  SELECT faculty1_id, faculty2_id INTO f1_id, f2_id
  FROM matches WHERE id = p_match_id;
  
  -- Get regulation time score (exclude PEN)
  SELECT 
    COALESCE(SUM(faculty1_score), 0),
    COALESCE(SUM(faculty2_score), 0)
  INTO reg_score1, reg_score2
  FROM period_scores
  WHERE match_id = p_match_id
    AND period != 'PEN';
  
  -- Check if tied in regulation
  IF reg_score1 = reg_score2 THEN
    -- Get penalty scores
    SELECT faculty1_score, faculty2_score
    INTO pen_score1, pen_score2
    FROM period_scores
    WHERE match_id = p_match_id
      AND period = 'PEN';
    
    -- Determine winner from penalties
    IF pen_score1 > pen_score2 THEN
      RETURN QUERY SELECT f1_id, 'Penalties'::VARCHAR;
    ELSIF pen_score2 > pen_score1 THEN
      RETURN QUERY SELECT f2_id, 'Penalties'::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 'Draw'::VARCHAR;
    END IF;
  ELSE
    -- Winner from regulation
    IF reg_score1 > reg_score2 THEN
      RETURN QUERY SELECT f1_id, 'Regulation'::VARCHAR;
    ELSE
      RETURN QUERY SELECT f2_id, 'Regulation'::VARCHAR;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_match_winner('match-uuid');
-- Returns: winner_faculty_id | win_type
--          uuid-xxx           | 'Penalties'







