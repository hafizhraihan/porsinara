-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('SUP', 'SPV', 'STF')),
  competition VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Super Users (SUP)
INSERT INTO admin_users (username, password, role, competition) VALUES
('sdc1', 'sdc567', 'SUP', NULL),
('sdc2', 'sdc678', 'SUP', NULL),
('sdc3', 'sdc789', 'SUP', NULL);

-- Insert Staff Users (STF)
INSERT INTO admin_users (username, password, role, competition) VALUES
-- Basketball Staff
('basket1', 'basket567', 'STF', 'basketball'),
('basket2', 'basket678', 'STF', 'basketball'),
('basket3', 'basket789', 'STF', 'basketball'),

-- Badminton Staff
('badmin1', 'badmin567', 'STF', 'badminton'),
('badmin2', 'badmin678', 'STF', 'badminton'),
('badmin3', 'badmin789', 'STF', 'badminton'),

-- Band Staff
('band1', 'band567', 'STF', 'band'),
('band2', 'band678', 'STF', 'band'),
('band3', 'band789', 'STF', 'band'),

-- Dance Staff
('dance1', 'dance567', 'STF', 'dance'),
('dance2', 'dance678', 'STF', 'dance'),
('dance3', 'dance789', 'STF', 'dance'),

-- Esports Staff
('esports1', 'esports567', 'STF', 'esports'),
('esports2', 'esports678', 'STF', 'esports'),
('esports3', 'esports789', 'STF', 'esports'),

-- Futsal Staff
('futsal1', 'futsal567', 'STF', 'futsal'),
('futsal2', 'futsal678', 'STF', 'futsal'),
('futsal3', 'futsal789', 'STF', 'futsal'),

-- Volleyball Staff
('volley1', 'volley567', 'STF', 'volleyball'),
('volley2', 'volley678', 'STF', 'volleyball'),
('volley3', 'volley789', 'STF', 'volleyball');

-- Insert Supervisor Users (SPV)
INSERT INTO admin_users (username, password, role, competition) VALUES
-- Basketball Supervisors
('basketspv1', 'basketspv567', 'SPV', 'basketball'),
('basketspv2', 'basketspv678', 'SPV', 'basketball'),
('basketspv3', 'basketspv789', 'SPV', 'basketball'),

-- Badminton Supervisors
('badminspv1', 'badminspv567', 'SPV', 'badminton'),
('badminspv2', 'badminspv678', 'SPV', 'badminton'),
('badminspv3', 'badminspv789', 'SPV', 'badminton'),

-- Band Supervisors
('bandspv1', 'bandspv567', 'SPV', 'band'),
('bandspv2', 'bandspv678', 'SPV', 'band'),
('bandspv3', 'bandspv789', 'SPV', 'band'),

-- Dance Supervisors
('dancespv1', 'dancespv567', 'SPV', 'dance'),
('dancespv2', 'dancespv678', 'SPV', 'dance'),
('dancespv3', 'dancespv789', 'SPV', 'dance'),

-- Esports Supervisors
('esportsspv1', 'esportsspv567', 'SPV', 'esports'),
('esportsspv2', 'esportsspv678', 'SPV', 'esports'),
('esportsspv3', 'esportsspv789', 'SPV', 'esports'),

-- Futsal Supervisors
('futsalspv1', 'futsalspv567', 'SPV', 'futsal'),
('futsalspv2', 'futsalspv678', 'SPV', 'futsal'),
('futsalspv3', 'futsalspv789', 'SPV', 'futsal'),

-- Volleyball Supervisors
('volleyspv1', 'volleyspv567', 'SPV', 'volleyball'),
('volleyspv2', 'volleyspv678', 'SPV', 'volleyball'),
('volleyspv3', 'volleyspv789', 'SPV', 'volleyball');

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read admin_users (for login)
CREATE POLICY "Allow authenticated read access" ON admin_users
  FOR SELECT TO authenticated
  USING (true);
