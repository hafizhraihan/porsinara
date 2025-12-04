-- Create futsal_stats table
CREATE TABLE IF NOT EXISTS futsal_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Shooting statistics
  shots_on_target INTEGER DEFAULT 0,
  shots_off_target INTEGER DEFAULT 0,
  
  -- Scoring and assists
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  
  -- Defensive statistics
  clearances INTEGER DEFAULT 0,
  
  -- Discipline statistics
  fouls INTEGER DEFAULT 0,
  
  -- Offensive statistics
  turnovers INTEGER DEFAULT 0,
  
  -- Passing and dribbling statistics
  passing INTEGER DEFAULT 0,
  dribble INTEGER DEFAULT 0,
  dribble_success INTEGER DEFAULT 0,
  
  -- Defensive statistics
  intercept INTEGER DEFAULT 0,
  
  -- Goalkeeper statistics (NULL for field players, populated for keepers)
  shots_received INTEGER DEFAULT NULL,
  saves INTEGER DEFAULT NULL,
  
  -- Game metadata
  minutes_played INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT false,
  is_goalkeeper BOOLEAN DEFAULT false, -- Indicates if this player is a goalkeeper
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(match_id, player_id),
  
  -- Non-negative constraints
  CHECK (shots_on_target >= 0),
  CHECK (shots_off_target >= 0),
  CHECK (goals >= 0),
  CHECK (assists >= 0),
  CHECK (clearances >= 0),
  CHECK (fouls >= 0),
  CHECK (turnovers >= 0),
  CHECK (passing >= 0),
  CHECK (dribble >= 0),
  CHECK (dribble_success >= 0),
  CHECK (intercept >= 0),
  CHECK (shots_received IS NULL OR shots_received >= 0),
  CHECK (saves IS NULL OR saves >= 0),
  CHECK (minutes_played >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_futsal_stats_match_id ON futsal_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_futsal_stats_player_id ON futsal_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_futsal_stats_goalkeeper ON futsal_stats(is_goalkeeper);

-- Enable Row Level Security
ALTER TABLE futsal_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON futsal_stats;
CREATE POLICY "Allow public read access" ON futsal_stats
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON futsal_stats;
CREATE POLICY "Allow authenticated insert" ON futsal_stats
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON futsal_stats;
CREATE POLICY "Allow authenticated update" ON futsal_stats
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON futsal_stats;
CREATE POLICY "Allow authenticated delete" ON futsal_stats
  FOR DELETE
  USING (true);

-- Add comment to table
COMMENT ON TABLE futsal_stats IS 'Stores individual player statistics for futsal matches including goalkeeper stats';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_futsal_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_futsal_stats_updated_at_trigger ON futsal_stats;
CREATE TRIGGER update_futsal_stats_updated_at_trigger
  BEFORE UPDATE ON futsal_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_futsal_stats_updated_at();

