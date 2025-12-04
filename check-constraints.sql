-- ============================================
-- CHECK ALL CONSTRAINTS ON BASKETBALL_STATS
-- ============================================

-- 1. List ALL constraints on basketball_stats
SELECT 
  conname AS constraint_name,
  contype AS type,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    ELSE contype::text
  END AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
ORDER BY contype, conname;

-- 2. Specifically check for basketball_stats_check2
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND conname = 'basketball_stats_check2';

-- 3. Show all CHECK constraints only
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'basketball_stats'::regclass
  AND contype = 'c'
ORDER BY conname;

-- ============================================
-- EXPECTED ISSUES:
-- 
-- Common problematic constraints:
-- 1. basketball_stats_check1: CHECK (free_throw_made <= free_throw_attempt)
-- 2. basketball_stats_check2: CHECK (two_point_made <= two_point_attempt)  
-- 3. basketball_stats_check3: CHECK (three_point_made <= three_point_attempt)
--
-- These are GOOD constraints BUT might be combined with:
-- - CHECK (free_throw_made > 0) IMPLIES (free_throw_attempt > 0)
-- - Or other complex logic that blocks valid data
-- ============================================

