-- Add new columns to futsal_stats table
-- passing, dribble, dribble_success, intercept

ALTER TABLE futsal_stats
ADD COLUMN IF NOT EXISTS passing INTEGER DEFAULT 0;

ALTER TABLE futsal_stats
ADD COLUMN IF NOT EXISTS dribble INTEGER DEFAULT 0;

ALTER TABLE futsal_stats
ADD COLUMN IF NOT EXISTS dribble_success INTEGER DEFAULT 0;

ALTER TABLE futsal_stats
ADD COLUMN IF NOT EXISTS intercept INTEGER DEFAULT 0;

-- Add constraints for new columns (drop first if they exist)
ALTER TABLE futsal_stats
DROP CONSTRAINT IF EXISTS check_passing_non_negative;

ALTER TABLE futsal_stats
DROP CONSTRAINT IF EXISTS check_dribble_non_negative;

ALTER TABLE futsal_stats
DROP CONSTRAINT IF EXISTS check_dribble_success_non_negative;

ALTER TABLE futsal_stats
DROP CONSTRAINT IF EXISTS check_intercept_non_negative;

ALTER TABLE futsal_stats
ADD CONSTRAINT check_passing_non_negative CHECK (passing >= 0);

ALTER TABLE futsal_stats
ADD CONSTRAINT check_dribble_non_negative CHECK (dribble >= 0);

ALTER TABLE futsal_stats
ADD CONSTRAINT check_dribble_success_non_negative CHECK (dribble_success >= 0);

ALTER TABLE futsal_stats
ADD CONSTRAINT check_intercept_non_negative CHECK (intercept >= 0);

-- Update table comment
COMMENT ON COLUMN futsal_stats.passing IS 'Total number of passes made';
COMMENT ON COLUMN futsal_stats.dribble IS 'Total dribble attempts';
COMMENT ON COLUMN futsal_stats.dribble_success IS 'Successful dribbles';
COMMENT ON COLUMN futsal_stats.intercept IS 'Interceptions made';

