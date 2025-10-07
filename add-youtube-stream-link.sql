-- Add YouTube stream link column to matches table
-- This script adds a new column to store YouTube live stream links for matches

ALTER TABLE matches 
ADD COLUMN youtube_stream_link TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN matches.youtube_stream_link IS 'YouTube live stream URL for the match';

-- Optional: Add a check constraint to ensure the URL is valid (basic validation)
-- ALTER TABLE matches 
-- ADD CONSTRAINT youtube_stream_link_check 
-- CHECK (youtube_stream_link IS NULL OR youtube_stream_link ~ '^https?://(www\.)?(youtube\.com|youtu\.be)/');

-- Update existing matches to have NULL youtube_stream_link (optional)
-- UPDATE matches SET youtube_stream_link = NULL WHERE youtube_stream_link IS NULL;
