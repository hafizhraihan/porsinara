-- Create basketball_stats table
CREATE TABLE IF NOT EXISTS basketball_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Shooting statistics
  free_throw_made INTEGER DEFAULT 0,
  free_throw_attempt INTEGER DEFAULT 0,
  two_point_made INTEGER DEFAULT 0,
  two_point_attempt INTEGER DEFAULT 0,
  three_point_made INTEGER DEFAULT 0,
  three_point_attempt INTEGER DEFAULT 0,
  
  -- Rebound statistics
  offensive_rebound INTEGER DEFAULT 0,
  defensive_rebound INTEGER DEFAULT 0,
  total_rebound INTEGER DEFAULT 0, -- Can be calculated: offensive + defensive
  
  -- Other statistics
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  
  -- Calculated field (can be computed from shooting stats)
  total_points INTEGER DEFAULT 0, -- free_throw_made + (2 * two_point_made) + (3 * three_point_made)
  
  -- Game metadata
  minutes_played INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(match_id, player_id),
  CHECK (free_throw_made >= 0),
  CHECK (free_throw_attempt >= 0),
  CHECK (free_throw_made <= free_throw_attempt),
  CHECK (two_point_made >= 0),
  CHECK (two_point_attempt >= 0),
  CHECK (two_point_made <= two_point_attempt),
  CHECK (three_point_made >= 0),
  CHECK (three_point_attempt >= 0),
  CHECK (three_point_made <= three_point_attempt),
  CHECK (offensive_rebound >= 0),
  CHECK (defensive_rebound >= 0),
  CHECK (total_rebound >= 0),
  CHECK (assists >= 0),
  CHECK (steals >= 0),
  CHECK (blocks >= 0),
  CHECK (turnovers >= 0),
  CHECK (fouls >= 0),
  CHECK (total_points >= 0),
  CHECK (minutes_played >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_basketball_stats_match_id ON basketball_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_basketball_stats_player_id ON basketball_stats(player_id);

-- Enable Row Level Security
ALTER TABLE basketball_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON basketball_stats;
CREATE POLICY "Allow public read access" ON basketball_stats
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON basketball_stats;
CREATE POLICY "Allow authenticated insert" ON basketball_stats
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON basketball_stats;
CREATE POLICY "Allow authenticated update" ON basketball_stats
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON basketball_stats;
CREATE POLICY "Allow authenticated delete" ON basketball_stats
  FOR DELETE
  USING (true);

-- Add comment to table
COMMENT ON TABLE basketball_stats IS 'Stores individual player statistics for basketball matches (both Putra and Putri competitions)';

-- Create function to auto-calculate total_points and total_rebound
CREATE OR REPLACE FUNCTION calculate_basketball_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total points: FT + (2PT * 2) + (3PT * 3)
  NEW.total_points := NEW.free_throw_made + (NEW.two_point_made * 2) + (NEW.three_point_made * 3);
  
  -- Calculate total rebounds: offensive + defensive
  NEW.total_rebound := NEW.offensive_rebound + NEW.defensive_rebound;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate before insert or update
DROP TRIGGER IF EXISTS calculate_basketball_totals_trigger ON basketball_stats;
CREATE TRIGGER calculate_basketball_totals_trigger
  BEFORE INSERT OR UPDATE ON basketball_stats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_basketball_totals();

