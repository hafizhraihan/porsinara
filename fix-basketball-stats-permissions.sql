-- ============================================
-- FIX PERMISSIONS FOR BASKETBALL_STATS TABLE
-- ============================================
-- Run this if RLS policies are missing or incorrect

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated insert" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated update" ON basketball_stats;
DROP POLICY IF EXISTS "Allow authenticated delete" ON basketball_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON basketball_stats;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON basketball_stats;

-- Ensure RLS is enabled
ALTER TABLE basketball_stats ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations
-- Option 1: Public access (if you want anyone to read/write)
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

-- Option 2: Authenticated users only (uncomment if preferred)
-- CREATE POLICY "Enable read access for authenticated users" 
-- ON basketball_stats FOR SELECT 
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Enable insert access for authenticated users" 
-- ON basketball_stats FOR INSERT 
-- TO authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Enable update access for authenticated users" 
-- ON basketball_stats FOR UPDATE 
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Enable delete access for authenticated users" 
-- ON basketball_stats FOR DELETE 
-- TO authenticated
-- USING (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON basketball_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON basketball_stats TO authenticated;

-- Also ensure players table has proper permissions
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON players;
DROP POLICY IF EXISTS "Enable insert access for all users" ON players;
DROP POLICY IF EXISTS "Enable update access for all users" ON players;
DROP POLICY IF EXISTS "Enable delete access for all users" ON players;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON players TO authenticated;

-- Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd AS command
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('basketball_stats', 'players')
ORDER BY tablename, policyname;


