-- Add sample players for testing basketball stats
-- Using the actual faculty IDs from your database

-- School of Computer Science (SoCS) Players
INSERT INTO players (name, student_id, faculty_id, position, jersey_number) VALUES
  ('John Doe', '2201234567', '550e8400-e29b-41d4-a716-446655440001', 'Point Guard', 23),
  ('Michael Chen', '2201234568', '550e8400-e29b-41d4-a716-446655440001', 'Shooting Guard', 10),
  ('David Kim', '2201234569', '550e8400-e29b-41d4-a716-446655440001', 'Small Forward', 7),
  ('James Wilson', '2201234570', '550e8400-e29b-41d4-a716-446655440001', 'Power Forward', 15),
  ('Robert Brown', '2201234571', '550e8400-e29b-41d4-a716-446655440001', 'Center', 32);

-- School of Design (SoD) Players
INSERT INTO players (name, student_id, faculty_id, position, jersey_number) VALUES
  ('Sarah Johnson', '2201234572', '550e8400-e29b-41d4-a716-446655440002', 'Point Guard', 5),
  ('Emily Davis', '2201234573', '550e8400-e29b-41d4-a716-446655440002', 'Shooting Guard', 12),
  ('Jessica Miller', '2201234574', '550e8400-e29b-41d4-a716-446655440002', 'Small Forward', 8),
  ('Amanda Garcia', '2201234575', '550e8400-e29b-41d4-a716-446655440002', 'Power Forward', 20),
  ('Lisa Martinez', '2201234576', '550e8400-e29b-41d4-a716-446655440002', 'Center', 25);

-- BINUS Business School (BBS) Players
INSERT INTO players (name, student_id, faculty_id, position, jersey_number) VALUES
  ('William Anderson', '2201234577', '550e8400-e29b-41d4-a716-446655440003', 'Point Guard', 3),
  ('Thomas Taylor', '2201234578', '550e8400-e29b-41d4-a716-446655440003', 'Shooting Guard', 11),
  ('Christopher Lee', '2201234579', '550e8400-e29b-41d4-a716-446655440003', 'Small Forward', 14),
  ('Daniel White', '2201234580', '550e8400-e29b-41d4-a716-446655440003', 'Power Forward', 21),
  ('Matthew Harris', '2201234581', '550e8400-e29b-41d4-a716-446655440003', 'Center', 33);

-- Faculty of Digital Communication and Hotel & Tourism (FDCHT) Players
INSERT INTO players (name, student_id, faculty_id, position, jersey_number) VALUES
  ('Andrew Thompson', '2201234582', '550e8400-e29b-41d4-a716-446655440004', 'Point Guard', 4),
  ('Ryan Clark', '2201234583', '550e8400-e29b-41d4-a716-446655440004', 'Shooting Guard', 13),
  ('Kevin Rodriguez', '2201234584', '550e8400-e29b-41d4-a716-446655440004', 'Small Forward', 9),
  ('Brandon Lewis', '2201234585', '550e8400-e29b-41d4-a716-446655440004', 'Power Forward', 22),
  ('Justin Walker', '2201234586', '550e8400-e29b-41d4-a716-446655440004', 'Center', 30);

-- Verify players were added
SELECT 
  p.name,
  p.jersey_number,
  p.position,
  f.name as faculty
FROM players p
JOIN faculties f ON p.faculty_id = f.id
ORDER BY f.name, p.jersey_number;

-- Count players per faculty
SELECT 
  f.name as faculty,
  COUNT(p.id) as player_count
FROM faculties f
LEFT JOIN players p ON f.id = p.faculty_id
GROUP BY f.id, f.name
ORDER BY f.name;

