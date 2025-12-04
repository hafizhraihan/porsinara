-- ============================================
-- ALTERNATIVE: SEPARATE COLUMNS FOR EACH QUARTER
-- ============================================
-- This stores Q1, Q2, Q3, Q4 as separate columns (denormalized)
-- Good for: Simple queries, easy to understand
-- Bad for: More columns, harder to aggregate

-- ⚠️ ONLY RUN THIS IF YOU PREFER SEPARATE COLUMNS
-- ⚠️ RECOMMENDED: Use add-quarter-column.sql instead (single quarter column)

-- Add quarter breakdown columns
ALTER TABLE basketball_stats
ADD COLUMN q1_points INTEGER DEFAULT 0 CHECK (q1_points >= 0),
ADD COLUMN q2_points INTEGER DEFAULT 0 CHECK (q2_points >= 0),
ADD COLUMN q3_points INTEGER DEFAULT 0 CHECK (q3_points >= 0),
ADD COLUMN q4_points INTEGER DEFAULT 0 CHECK (q4_points >= 0);

-- Add comments
COMMENT ON COLUMN basketball_stats.q1_points IS 'Points scored in Quarter 1';
COMMENT ON COLUMN basketball_stats.q2_points IS 'Points scored in Quarter 2';
COMMENT ON COLUMN basketball_stats.q3_points IS 'Points scored in Quarter 3';
COMMENT ON COLUMN basketball_stats.q4_points IS 'Points scored in Quarter 4';

-- Verify
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'basketball_stats' 
  AND column_name LIKE 'q%_points'
ORDER BY column_name;

-- Example usage:
-- UPDATE basketball_stats
-- SET 
--   q1_points = 10,
--   q2_points = 15,
--   q3_points = 8,
--   q4_points = 12
-- WHERE match_id = 'match-uuid' AND player_id = 'player-uuid';

-- ============================================
-- COMPARISON: Single Column vs Separate Columns
-- ============================================

/*
SINGLE COLUMN (RECOMMENDED - add-quarter-column.sql):
===================================================
Structure:
  match_id | player_id | quarter | points
  uuid-1   | player-1  | Q1      | 10
  uuid-1   | player-1  | Q2      | 15
  uuid-1   | player-1  | Q3      | 8
  uuid-1   | player-1  | Q4      | 12

Pros:
  ✅ Normalized (proper database design)
  ✅ Easy to add Q5, OT1, OT2 later
  ✅ Easy to query specific quarter
  ✅ Easy to aggregate (SUM, AVG per quarter)
  ✅ Flexible

Cons:
  ⚠️ Multiple rows per player
  ⚠️ Need JOINs for full game view

---

SEPARATE COLUMNS (THIS FILE):
==============================
Structure:
  match_id | player_id | q1_points | q2_points | q3_points | q4_points
  uuid-1   | player-1  | 10        | 15        | 8         | 12

Pros:
  ✅ Single row per player
  ✅ Simple to understand
  ✅ Easy to display all quarters at once

Cons:
  ❌ Hard to add overtime quarters
  ❌ Harder to query "which quarter had most points?"
  ❌ Need separate columns for FT/2PT/3PT per quarter (12+ more columns!)
  ❌ Denormalized

---

RECOMMENDATION: Use SINGLE COLUMN approach!
*/

-- ============================================
-- IF YOU WANT FULL STATS PER QUARTER (NOT RECOMMENDED)
-- ============================================

-- This would need 60+ columns! (15 stats × 4 quarters)
-- 
-- ALTER TABLE basketball_stats
-- ADD COLUMN q1_free_throw_made INTEGER DEFAULT 0,
-- ADD COLUMN q1_free_throw_attempt INTEGER DEFAULT 0,
-- ADD COLUMN q1_two_point_made INTEGER DEFAULT 0,
-- ADD COLUMN q1_two_point_attempt INTEGER DEFAULT 0,
-- ... (repeat for Q2, Q3, Q4)
--
-- ❌ DON'T DO THIS! Use single quarter column instead!







