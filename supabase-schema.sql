-- PORSINARA Database Schema
-- Run this SQL in your Supabase SQL editor

-- Create Faculties table
CREATE TABLE IF NOT EXISTS faculties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('sport', 'art')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('team', 'individual', 'mixed')),
  max_participants INTEGER,
  icon VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL CHECK (format IN ('elimination', 'table')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id VARCHAR(50) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  faculty1_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  faculty2_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  round VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Faculty Standings table (for medal tally)
CREATE TABLE IF NOT EXISTS faculty_standings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  competition_id VARCHAR(50) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  gold INTEGER DEFAULT 0,
  silver INTEGER DEFAULT 0,
  bronze INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, competition_id)
);

-- Create Table Standings table (for arts competitions)
CREATE TABLE IF NOT EXISTS table_standings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  competition_id VARCHAR(50) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, competition_id)
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_faculty_standings_faculty ON faculty_standings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_standings_competition ON faculty_standings(competition_id);
CREATE INDEX IF NOT EXISTS idx_table_standings_faculty ON table_standings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_table_standings_competition ON table_standings(competition_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_faculties_updated_at BEFORE UPDATE ON faculties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_standings_updated_at BEFORE UPDATE ON faculty_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_table_standings_updated_at BEFORE UPDATE ON table_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
-- Faculties
INSERT INTO faculties (id, name, short_name, color, icon) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'School of Computer Science', 'SOCS', '#2563eb', 'FaCode'),
  ('550e8400-e29b-41d4-a716-446655440002', 'School of Design', 'SOD', '#7c3aed', 'FaPalette'),
  ('550e8400-e29b-41d4-a716-446655440003', 'BINUS Business School', 'BBS', '#059669', 'FaBriefcase'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Faculty of Digital Communication and Hotel & Tourism', 'FDCHT', '#ec4899', 'FaGlobe')
ON CONFLICT (short_name) DO NOTHING;

-- Competitions
INSERT INTO competitions (id, name, type, category, max_participants, icon, format) VALUES
  -- Sports - Elimination Bracket Format
  ('futsal', 'Futsal', 'sport', 'team', 2, 'FaFutbol', 'elimination'),
  ('basketball-putra', 'Basketball Putra', 'sport', 'team', 2, 'FaBasketballBall', 'elimination'),
  ('basketball-putri', 'Basketball Putri', 'sport', 'team', 2, 'FaBasketballBall', 'elimination'),
  ('volleyball', 'Volleyball', 'sport', 'team', 2, 'FaVolleyballBall', 'elimination'),
  ('badminton-putra', 'Badminton Putra', 'sport', 'individual', NULL, 'GiShuttlecock', 'elimination'),
  ('badminton-putri', 'Badminton Putri', 'sport', 'individual', NULL, 'GiShuttlecock', 'elimination'),
  ('badminton-mixed', 'Badminton Mixed', 'sport', 'mixed', NULL, 'GiShuttlecock', 'elimination'),
  ('esports', 'Esports (Mobile Legends)', 'sport', 'team', 2, 'FaGamepad', 'elimination'),
  
  -- Arts - Table Standing Format
  ('band', 'Band', 'art', 'team', NULL, 'FaGuitar', 'table'),
  ('dance', 'Dance', 'art', 'team', NULL, 'FaTheaterMasks', 'table')
ON CONFLICT (id) DO NOTHING;

-- Sample matches data
INSERT INTO matches (competition_id, faculty1_id, faculty2_id, score1, score2, status, date, time, location, round) VALUES
  ('futsal', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 2, 1, 'completed', '2025-10-11', '09:00:00', 'Main Field', 'Semifinal'),
  ('futsal', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 1, 3, 'completed', '2025-10-11', '10:30:00', 'Main Field', 'Semifinal'),
  ('futsal', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 2, 1, 'completed', '2025-10-11', '14:00:00', 'Main Field', 'Final'),
  ('futsal', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 1, 0, 'completed', '2025-10-11', '15:30:00', 'Main Field', '3rd Place'),
  ('basketball-putra', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 45, 42, 'live', '2025-10-11', '16:00:00', 'Basketball Court', 'Semifinal')
ON CONFLICT DO NOTHING;

-- Sample faculty standings (medal tally)
INSERT INTO faculty_standings (faculty_id, competition_id, gold, silver, bronze, total_points) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'futsal', 0, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'futsal', 1, 0, 0, 3),
  ('550e8400-e29b-41d4-a716-446655440003', 'futsal', 0, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440004', 'futsal', 0, 1, 0, 2)
ON CONFLICT (faculty_id, competition_id) DO NOTHING;

-- Sample table standings (for arts)
INSERT INTO table_standings (faculty_id, competition_id, points, rank) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'band', 85, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'band', 78, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'band', 72, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'band', 68, 4),
  ('550e8400-e29b-41d4-a716-446655440001', 'dance', 92, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'dance', 88, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'dance', 75, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'dance', 70, 4)
ON CONFLICT (faculty_id, competition_id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE arts_competition_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to faculties" ON faculties FOR SELECT USING (true);
CREATE POLICY "Allow public read access to competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access to faculty_standings" ON faculty_standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to table_standings" ON table_standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to arts_competition_scores" ON arts_competition_scores FOR SELECT USING (true);

-- Create policies for public write access (for development - in production you'd want proper authentication)
CREATE POLICY "Allow public write access to matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow public write access to faculty_standings" ON faculty_standings FOR ALL USING (true);
CREATE POLICY "Allow public write access to table_standings" ON table_standings FOR ALL USING (true);
CREATE POLICY "Allow public write access to arts_competition_scores" ON arts_competition_scores FOR ALL USING (true);

-- For production, you would use these instead:
-- CREATE POLICY "Allow admin write access to matches" ON matches FOR ALL USING (auth.role() = 'admin');
-- CREATE POLICY "Allow admin write access to faculty_standings" ON faculty_standings FOR ALL USING (auth.role() = 'admin');
-- CREATE POLICY "Allow admin write access to table_standings" ON table_standings FOR ALL USING (auth.role() = 'admin');
