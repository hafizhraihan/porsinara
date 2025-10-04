-- Check current competition formats
-- Run this SQL in your Supabase SQL editor

SELECT id, name, type, format FROM competitions 
WHERE id IN ('band', 'dance')
ORDER BY id;
