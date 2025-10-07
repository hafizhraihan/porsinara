-- Verify that tables were created successfully

-- Check if players table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'players'
) as players_exists;

-- Check if basketball_stats table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'basketball_stats'
) as basketball_stats_exists;

-- View players table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;

-- View basketball_stats table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'basketball_stats'
ORDER BY ordinal_position;

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'basketball_stats';

