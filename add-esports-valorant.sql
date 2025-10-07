-- Add new Esports (Valorant) competition

INSERT INTO competitions (
  id,
  name,
  type,
  category,
  icon,
  format,
  created_at,
  updated_at
) VALUES (
  'esports-valorant',              -- Unique ID
  'Esports (Valorant)',            -- Display name
  'sport',                          -- Type: 'sport' or 'art'
  'team',                           -- Category: 'team', 'individual', or 'mixed'
  'FaGamepad',                      -- Icon (same as Mobile Legends or use different)
  'elimination',                    -- Format: 'elimination' or 'table'
  NOW(),                            -- Created timestamp
  NOW()                             -- Updated timestamp
);

-- Verify the new competition was added
SELECT id, name, type, category, format FROM competitions WHERE id = 'esports-valorant';

-- See all esports competitions
SELECT id, name, type, category, format FROM competitions WHERE type = 'sport' AND name LIKE 'Esports%' ORDER BY name;

