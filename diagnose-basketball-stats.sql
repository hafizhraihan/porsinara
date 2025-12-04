-- ============================================
-- DIAGNOSTIC SCRIPT FOR BASKETBALL_STATS TABLE
-- ============================================
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if table exists
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'basketball_stats';

-- 2. Check all columns in basketball_stats
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'basketball_stats'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'basketball_stats';

-- 4. Check RLS (Row Level Security) status
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'basketball_stats';

-- 5. List ALL RLS policies on basketball_stats
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'basketball_stats';

-- 6. Check if trigger exists for auto-calculation
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'basketball_stats';

-- 7. Test SELECT permission (should return empty result if table is empty)
SELECT COUNT(*) as total_records FROM basketball_stats;

-- 8. Check if players table exists and is accessible
SELECT COUNT(*) as total_players FROM players;

-- 9. Check if matches table is accessible
SELECT COUNT(*) as total_matches FROM matches;

-- 10. Try a simple JOIN to test relationships
SELECT 
  bs.id,
  m.competition_id,
  f1.short_name as team1,
  f2.short_name as team2,
  p.name as player_name,
  p.jersey_number,
  bs.total_points
FROM basketball_stats bs
LEFT JOIN matches m ON bs.match_id = m.id
LEFT JOIN faculties f1 ON m.faculty1_id = f1.id
LEFT JOIN faculties f2 ON m.faculty2_id = f2.id
LEFT JOIN players p ON bs.player_id = p.id
LIMIT 5;

-- 11. Check for any existing basketball stats data
SELECT 
  COUNT(*) as total_stats,
  COUNT(DISTINCT match_id) as unique_matches,
  COUNT(DISTINCT player_id) as unique_players
FROM basketball_stats;

-- 12. Get sample basketball match IDs (for testing inserts)
SELECT 
  m.id as match_id,
  c.name as competition,
  f1.short_name || ' vs ' || f2.short_name as matchup,
  m.status,
  m.date
FROM matches m
JOIN competitions c ON m.competition_id = c.id
JOIN faculties f1 ON m.faculty1_id = f1.id
JOIN faculties f2 ON m.faculty2_id = f2.id
WHERE c.id IN ('basketball-putra', 'basketball-putri')
ORDER BY m.date DESC
LIMIT 3;

-- 13. Get sample player IDs (for testing inserts)
SELECT 
  p.id as player_id,
  p.name,
  p.jersey_number,
  f.short_name as faculty
FROM players p
JOIN faculties f ON p.faculty_id = f.id
ORDER BY p.name
LIMIT 5;

-- ============================================
-- EXPECTED RESULTS:
-- 1. Table should exist (1 row returned)
-- 2. Should list all 20+ columns (free_throw_made, free_throw_attempt, etc.)
-- 3. Should show FK to matches and players
-- 4. rls_enabled should be TRUE
-- 5. Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- 6. Should show calculate_basketball_totals_trigger (BEFORE INSERT OR UPDATE)
-- 7-13. Should return counts/data without errors
--
-- If ANY query fails:
-- - "permission denied" → Run fix-basketball-stats-permissions.sql
-- - "relation does not exist" → Run create-basketball-stats-table.sql
-- - "column does not exist" → Schema mismatch, verify table structure
-- ============================================

