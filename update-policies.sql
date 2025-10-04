-- Update RLS policies to allow public write access for development
-- Run this in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public write access to matches" ON matches;
DROP POLICY IF EXISTS "Allow public write access to faculty_standings" ON faculty_standings;
DROP POLICY IF EXISTS "Allow public write access to table_standings" ON table_standings;

-- Create policies for public write access (for development - in production you'd want proper authentication)
CREATE POLICY "Allow public write access to matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow public write access to faculty_standings" ON faculty_standings FOR ALL USING (true);
CREATE POLICY "Allow public write access to table_standings" ON table_standings FOR ALL USING (true);
