-- Allow client_id to be null in projects table (for agency internal projects)
ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;