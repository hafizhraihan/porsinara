-- ⚠️ WARNING: This will update competition IDs and all related foreign key references
-- Only run this if you're absolutely sure you want to change the IDs
-- Make sure to backup your database first!

-- Step 1: Update foreign key references in matches table
UPDATE matches SET competition_id = 'basketball-mens' WHERE competition_id = 'basketball-putra';
UPDATE matches SET competition_id = 'basketball-womens' WHERE competition_id = 'basketball-putri';
UPDATE matches SET competition_id = 'badminton-mens-single' WHERE competition_id = 'badminton-putra';
UPDATE matches SET competition_id = 'badminton-womens-single' WHERE competition_id = 'badminton-putri';
UPDATE matches SET competition_id = 'badminton-mixed-double' WHERE competition_id = 'badminton-mixed';

-- Step 2: Update foreign key references in faculty_standings table
UPDATE faculty_standings SET competition_id = 'basketball-mens' WHERE competition_id = 'basketball-putra';
UPDATE faculty_standings SET competition_id = 'basketball-womens' WHERE competition_id = 'basketball-putri';
UPDATE faculty_standings SET competition_id = 'badminton-mens-single' WHERE competition_id = 'badminton-putra';
UPDATE faculty_standings SET competition_id = 'badminton-womens-single' WHERE competition_id = 'badminton-putri';
UPDATE faculty_standings SET competition_id = 'badminton-mixed-double' WHERE competition_id = 'badminton-mixed';

-- Step 3: Update foreign key references in table_standings table (if exists)
UPDATE table_standings SET competition_id = 'basketball-mens' WHERE competition_id = 'basketball-putra';
UPDATE table_standings SET competition_id = 'basketball-womens' WHERE competition_id = 'basketball-putri';
UPDATE table_standings SET competition_id = 'badminton-mens-single' WHERE competition_id = 'badminton-putra';
UPDATE table_standings SET competition_id = 'badminton-womens-single' WHERE competition_id = 'badminton-putri';
UPDATE table_standings SET competition_id = 'badminton-mixed-double' WHERE competition_id = 'badminton-mixed';

-- Step 4: Finally, update the competition IDs themselves
UPDATE competitions SET id = 'basketball-mens', name = 'Basketball Men''s' WHERE id = 'basketball-putra';
UPDATE competitions SET id = 'basketball-womens', name = 'Basketball Women''s' WHERE id = 'basketball-putri';
UPDATE competitions SET id = 'badminton-mens-single', name = 'Badminton Men''s Single' WHERE id = 'badminton-putra';
UPDATE competitions SET id = 'badminton-womens-single', name = 'Badminton Women''s Single' WHERE id = 'badminton-putri';
UPDATE competitions SET id = 'badminton-mixed-double', name = 'Badminton Mixed Double' WHERE id = 'badminton-mixed';

-- Verify the changes
SELECT id, name, type FROM competitions ORDER BY type, name;
SELECT competition_id, COUNT(*) as match_count FROM matches GROUP BY competition_id ORDER BY competition_id;
SELECT competition_id, COUNT(*) as standing_count FROM faculty_standings GROUP BY competition_id ORDER BY competition_id;

