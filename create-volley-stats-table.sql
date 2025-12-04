-- Create volley_stats table
CREATE TABLE IF NOT EXISTS volley_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Serve statistics
  serve_attempt INTEGER DEFAULT 0,
  serve_ace INTEGER DEFAULT 0,
  serve_error INTEGER DEFAULT 0,
  
  -- Spike statistics
  spike_attempt INTEGER DEFAULT 0,
  spike_kill INTEGER DEFAULT 0,
  spike_error INTEGER DEFAULT 0,
  
  -- Block statistics
  block_attempt INTEGER DEFAULT 0,
  block_success INTEGER DEFAULT 0,
  
  -- Set statistics
  set_attempt INTEGER DEFAULT 0,
  set_assist INTEGER DEFAULT 0,
  
  -- Dig statistics
  dig_attempt INTEGER DEFAULT 0,
  dig_success INTEGER DEFAULT 0,
  
  -- Receive statistics
  receive_attempt INTEGER DEFAULT 0,
  receive_good INTEGER DEFAULT 0,
  
  -- Total errors
  total_error INTEGER DEFAULT 0,
  
  -- Game metadata
  minutes_played INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(match_id, player_id),
  
  -- Non-negative constraints
  CHECK (serve_attempt >= 0),
  CHECK (serve_ace >= 0),
  CHECK (serve_error >= 0),
  CHECK (spike_attempt >= 0),
  CHECK (spike_kill >= 0),
  CHECK (spike_error >= 0),
  CHECK (block_attempt >= 0),
  CHECK (block_success >= 0),
  CHECK (set_attempt >= 0),
  CHECK (set_assist >= 0),
  CHECK (dig_attempt >= 0),
  CHECK (dig_success >= 0),
  CHECK (receive_attempt >= 0),
  CHECK (receive_good >= 0),
  CHECK (total_error >= 0),
  CHECK (minutes_played >= 0)
  
  -- Logical constraints (commented out)
  -- CHECK (serve_ace <= serve_attempt),
  -- CHECK (serve_error <= serve_attempt),
  -- CHECK (spike_kill <= spike_attempt),
  -- CHECK (spike_error <= spike_attempt),
  -- CHECK (block_success <= block_attempt),
  -- CHECK (set_assist <= set_attempt),
  -- CHECK (dig_success <= dig_attempt),
  -- CHECK (receive_good <= receive_attempt)
);

-- Create indexes for better query performance
DROP INDEX IF EXISTS idx_volley_stats_match_id;
CREATE INDEX idx_volley_stats_match_id ON volley_stats(match_id);

DROP INDEX IF EXISTS idx_volley_stats_player_id;
CREATE INDEX idx_volley_stats_player_id ON volley_stats(player_id);

-- Enable Row Level Security
ALTER TABLE volley_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON volley_stats;
CREATE POLICY "Allow public read access" ON volley_stats
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON volley_stats;
CREATE POLICY "Allow authenticated insert" ON volley_stats
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON volley_stats;
CREATE POLICY "Allow authenticated update" ON volley_stats
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON volley_stats;
CREATE POLICY "Allow authenticated delete" ON volley_stats
  FOR DELETE
  USING (true);

-- Add comment to table
COMMENT ON TABLE volley_stats IS 'Stores individual player statistics for volleyball matches';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_volley_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_volley_stats_updated_at_trigger ON volley_stats;
CREATE TRIGGER update_volley_stats_updated_at_trigger
  BEFORE UPDATE ON volley_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_volley_stats_updated_at();

