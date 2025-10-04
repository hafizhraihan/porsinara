-- Add Arts Competition Scores table for individual faculty scores
-- Run this SQL in your Supabase SQL editor

-- Create Arts Competition Scores table (for individual faculty scores)
CREATE TABLE IF NOT EXISTS arts_competition_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, faculty_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_arts_competition_scores_match ON arts_competition_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_arts_competition_scores_faculty ON arts_competition_scores(faculty_id);

-- Enable Row Level Security
ALTER TABLE arts_competition_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to arts_competition_scores" ON arts_competition_scores FOR SELECT USING (true);
CREATE POLICY "Allow public write access to arts_competition_scores" ON arts_competition_scores FOR ALL USING (true);

-- Verify the table was created
SELECT * FROM arts_competition_scores LIMIT 1;
