-- Template for adding new competitions
-- Copy this template and modify the values as needed

-- Example 1: Add Esports (Valorant)
INSERT INTO competitions (id, name, type, category, icon, format, created_at, updated_at)
VALUES (
  'esports-valorant',              -- ID: Unique identifier (lowercase-with-hyphens)
  'Esports (Valorant)',            -- Name: Display name (user-facing)
  'sport',                          -- Type: 'sport' or 'art'
  'team',                           -- Category: 'team', 'individual', or 'mixed'
  'FaGamepad',                      -- Icon: Icon name from react-icons
  'elimination',                    -- Format: 'elimination' or 'table'
  NOW(),
  NOW()
);

-- Example 2: Add Table Tennis Men's
INSERT INTO competitions (id, name, type, category, icon, format, created_at, updated_at)
VALUES (
  'table-tennis-mens',
  'Table Tennis Men''s',
  'sport',
  'individual',
  'FaTableTennis',
  'elimination',
  NOW(),
  NOW()
);

-- Example 3: Add Choir (Arts)
INSERT INTO competitions (id, name, type, category, icon, format, created_at, updated_at)
VALUES (
  'choir',
  'Choir',
  'art',
  'team',
  'FaMusic',
  'table',                          -- Arts typically use 'table' format (judged by points)
  NOW(),
  NOW()
);

INSERT INTO competitions (id, name, type, category, icon, format, created_at, updated_at)
VALUES (
  'badminton-mens-double',
  'Badminton Men''s Double',
  'sport',
  'mixed',
  'FaShuttlecock',
  'elimination',
  NOW(),
  NOW()
);

INSERT INTO competitions (id, name, type, category, icon, format, created_at, updated_at)
VALUES (
  'badminton-womens-double',
  'Badminton Women''s Double',
  'sport',
  'mixed',
  'FaShuttlecock',
  'elimination',
  NOW(),
  NOW()
);

-- ============================================
-- FIELD DESCRIPTIONS
-- ============================================

-- id:
--   - Unique identifier
--   - Use lowercase with hyphens
--   - Examples: 'basketball-mens', 'esports-valorant', 'badminton-mixed-double'

-- name:
--   - User-facing display name
--   - Use proper capitalization
--   - For possessive, use two single quotes: 'Men''s' or 'Women''s'
--   - Examples: 'Basketball Men''s', 'Esports (Valorant)', 'Badminton Mixed Double'

-- type:
--   - 'sport' for physical/esports competitions
--   - 'art' for artistic/performance competitions

-- category:
--   - 'team' for team sports (5v5, 11v11, etc.)
--   - 'individual' for solo competitions (singles badminton, chess, etc.)
--   - 'mixed' for mixed gender team/pair competitions

-- icon:
--   - Icon name from react-icons (https://react-icons.github.io/react-icons/)
--   - Common icons:
--     * Sports: FaFutbol, FaBasketballBall, FaVolleyballBall, FaTableTennis
--     * Esports: FaGamepad, FaDesktop
--     * Arts: FaMusic, FaGuitar, FaDrum, FaMicrophone

-- format:
--   - 'elimination' for knockout/bracket tournaments
--   - 'table' for round-robin/points-based (common for arts competitions)

-- ============================================
-- COMMON COMPETITION PATTERNS
-- ============================================

-- Sports with Men's/Women's divisions:
-- - Use separate IDs: 'sport-mens' and 'sport-womens'
-- - Example: 'basketball-mens', 'basketball-womens'

-- Badminton variations:
-- - Singles: 'badminton-mens-single', 'badminton-womens-single'
-- - Doubles: 'badminton-mens-double', 'badminton-womens-double'
-- - Mixed: 'badminton-mixed-double'

-- Esports with different games:
-- - Use game name in ID: 'esports-mlbb', 'esports-valorant', 'esports-pubg'
-- - Display name includes game: 'Esports (Mobile Legends)', 'Esports (Valorant)'

-- ============================================
-- VERIFY YOUR ADDITION
-- ============================================

-- View all competitions
SELECT id, name, type, category, format FROM competitions ORDER BY type, name;

-- Count competitions by type
SELECT type, COUNT(*) as count FROM competitions GROUP BY type;

