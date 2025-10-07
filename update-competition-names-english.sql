-- Update competition names to English
-- Changes "Putra" to "Men's" and "Putri" to "Women's"

UPDATE competitions SET name = 'Futsal' WHERE id = 'futsal';
UPDATE competitions SET name = 'Basketball Men''s' WHERE id = 'basketball-putra';
UPDATE competitions SET name = 'Basketball Women''s' WHERE id = 'basketball-putri';
UPDATE competitions SET name = 'Volleyball' WHERE id = 'volleyball';
UPDATE competitions SET name = 'Badminton Men''s Single' WHERE id = 'badminton-putra';
UPDATE competitions SET name = 'Badminton Women''s Single' WHERE id = 'badminton-putri';
UPDATE competitions SET name = 'Badminton Mixed Double' WHERE id = 'badminton-mixed';
UPDATE competitions SET name = 'Esports (Mobile Legends)' WHERE id = 'esports';
UPDATE competitions SET name = 'Band' WHERE id = 'band';
UPDATE competitions SET name = 'Dance' WHERE id = 'dance';

-- Verify the changes
SELECT id, name, type FROM competitions ORDER BY type, name;

