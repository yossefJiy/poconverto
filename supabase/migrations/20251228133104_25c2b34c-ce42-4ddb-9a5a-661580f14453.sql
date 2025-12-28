-- ============================================
-- MODULAR DATABASE STRUCTURE
-- ============================================

-- Drop old unused tables (keeping integrations data will be migrated)
DROP TABLE IF EXISTS brand_messages CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS project_improvements CASCADE;
DROP TABLE IF EXISTS security_audit_logs CASCADE;

-- ============================================
-- CORE MODULE: profiles (enhanced)
-- ============================================
-- Keep existing profiles table, just ensure it's clean

-- ============================================
-- CORE MODULE: clients (simplified)
-- ============================================
-- Keep existing clients table as is

-- ============================================
-- CAMPAIGNS MODULE: campaigns (keep as is)
-- ============================================
-- Keep existing campaigns table as is

-- ============================================
-- TASKS MODULE: tasks (simplified)
-- ============================================
-- Remove unused columns from tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_member_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_task_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_sent;
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS completion_notes;
ALTER TABLE tasks DROP COLUMN IF EXISTS completed_at;

-- ============================================
-- MARKETING MODULE: marketing_data (consolidated)
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('persona', 'competitor', 'goal', 'brand_message')),
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on marketing_data
ALTER TABLE marketing_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_data
CREATE POLICY "Users can view marketing data for assigned clients"
  ON marketing_data FOR SELECT
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage marketing data"
  ON marketing_data FOR ALL
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_member'::app_role));

-- Create index for marketing_data
CREATE INDEX idx_marketing_data_client_type ON marketing_data(client_id, type);

-- ============================================
-- TEAM MODULE: team (simplified from team_members)
-- ============================================
CREATE TABLE IF NOT EXISTS team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  departments TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on team
ALTER TABLE team ENABLE ROW LEVEL SECURITY;

-- RLS policies for team
CREATE POLICY "Team members can view all team"
  ON team FOR SELECT
  USING (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Managers can manage team"
  ON team FOR ALL
  USING (has_role_level(auth.uid(), 'manager'::app_role));

-- ============================================
-- INTEGRATIONS MODULE: keep existing but clean up
-- ============================================
-- Remove unused columns
ALTER TABLE integrations DROP COLUMN IF EXISTS access_token_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS refresh_token_encrypted;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE TRIGGER update_marketing_data_updated_at
  BEFORE UPDATE ON marketing_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_team_updated_at
  BEFORE UPDATE ON team
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Clean up: Remove client_users if not needed
-- ============================================
-- Keep client_users for now as it's used in has_client_access function