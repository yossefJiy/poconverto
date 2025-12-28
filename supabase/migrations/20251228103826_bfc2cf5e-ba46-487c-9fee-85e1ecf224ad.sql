-- Add social media fields to clients table
ALTER TABLE public.clients 
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text,
ADD COLUMN tiktok_url text,
ADD COLUMN linkedin_url text,
ADD COLUMN twitter_url text;