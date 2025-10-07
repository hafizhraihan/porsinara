-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  
  -- Optional fields
  position VARCHAR(100), -- e.g., "Point Guard", "Striker", "Setter"
  jersey_number INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (LENGTH(name) > 0),
  CHECK (jersey_number > 0 AND jersey_number < 100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_faculty_id ON players(faculty_id);
CREATE INDEX IF NOT EXISTS idx_players_student_id ON players(student_id);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON players;
CREATE POLICY "Allow public read access" ON players
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON players;
CREATE POLICY "Allow authenticated insert" ON players
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON players;
CREATE POLICY "Allow authenticated update" ON players
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON players;
CREATE POLICY "Allow authenticated delete" ON players
  FOR DELETE
  USING (true);

-- Add comment to table
COMMENT ON TABLE players IS 'Stores player information for all sports competitions';

