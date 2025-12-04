-- Add current_period column to matches table
-- This column tracks the current period/quarter/half of a match
-- Supports multiple sports: Basketball, Futsal, Volleyball, etc.

ALTER TABLE matches
ADD COLUMN current_period VARCHAR(20) DEFAULT 'UPCOMING' CHECK (
  current_period IN (
    'UPCOMING',                           -- Match not started yet
    'Q1', 'Q2', 'Q3', 'Q4',              -- Basketball quarters
    'OT', 'OT1', 'OT2',                  -- Overtime
    '1st Half', '2nd Half',              -- Halves (Futsal, Football)
    'ET1', 'ET2',                        -- Extra time
    'PEN',                               -- Penalty shootout
    'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5',  -- Sets (Volleyball, Badminton)
    'HT',                                -- Half Time
    'FT'                                 -- Full Time (match finished)
  )
);

-- Update existing matches to have appropriate default values
UPDATE matches 
SET current_period = 'UPCOMING' 
WHERE status = 'upcoming';

UPDATE matches 
SET current_period = 'Q1' 
WHERE status = 'ongoing' AND current_period = 'UPCOMING';

UPDATE matches 
SET current_period = 'FT' 
WHERE status = 'completed';
