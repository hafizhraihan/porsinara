-- Add volleyball set scores to matches table
-- This approach stores all set scores directly in the matches table
-- Simpler than separate volleyball_sets table

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS set1_score1 INTEGER DEFAULT NULL CHECK (set1_score1 >= 0),
ADD COLUMN IF NOT EXISTS set2_score1 INTEGER DEFAULT NULL CHECK (set2_score1 >= 0),
ADD COLUMN IF NOT EXISTS set3_score1 INTEGER DEFAULT NULL CHECK (set3_score1 >= 0),
ADD COLUMN IF NOT EXISTS set4_score1 INTEGER DEFAULT NULL CHECK (set4_score1 >= 0),
ADD COLUMN IF NOT EXISTS set5_score1 INTEGER DEFAULT NULL CHECK (set5_score1 >= 0);

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS set1_score2 INTEGER DEFAULT NULL CHECK (set1_score2 >= 0),
ADD COLUMN IF NOT EXISTS set2_score2 INTEGER DEFAULT NULL CHECK (set2_score2 >= 0),
ADD COLUMN IF NOT EXISTS set3_score2 INTEGER DEFAULT NULL CHECK (set3_score2 >= 0),
ADD COLUMN IF NOT EXISTS set4_score2 INTEGER DEFAULT NULL CHECK (set4_score2 >= 0),
ADD COLUMN IF NOT EXISTS set5_score2 INTEGER DEFAULT NULL CHECK (set5_score2 >= 0);

-- Add comments for clarity
COMMENT ON COLUMN matches.set1_score1 IS 'Team 1 score in Set 1';
COMMENT ON COLUMN matches.set1_score2 IS 'Team 2 score in Set 1';
COMMENT ON COLUMN matches.set2_score1 IS 'Team 1 score in Set 2';
COMMENT ON COLUMN matches.set2_score2 IS 'Team 2 score in Set 2';
COMMENT ON COLUMN matches.set3_score1 IS 'Team 1 score in Set 3';
COMMENT ON COLUMN matches.set3_score2 IS 'Team 2 score in Set 3';
COMMENT ON COLUMN matches.set4_score1 IS 'Team 1 score in Set 4';
COMMENT ON COLUMN matches.set4_score2 IS 'Team 2 score in Set 4';
COMMENT ON COLUMN matches.set5_score1 IS 'Team 1 score in Set 5';
COMMENT ON COLUMN matches.set5_score2 IS 'Team 2 score in Set 5';
