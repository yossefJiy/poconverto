-- ============================================
-- PHASE 1: Add FK Constraints with CASCADE
-- ============================================

-- Drop existing constraints if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Core tables
  ALTER TABLE IF EXISTS integrations DROP CONSTRAINT IF EXISTS fk_integrations_client;
  ALTER TABLE IF EXISTS campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_client;
  ALTER TABLE IF EXISTS tasks DROP CONSTRAINT IF EXISTS fk_tasks_client;
  ALTER TABLE IF EXISTS analytics_snapshots DROP CONSTRAINT IF EXISTS fk_analytics_snapshots_client;
  ALTER TABLE IF EXISTS ai_agents DROP CONSTRAINT IF EXISTS fk_ai_agents_client;
  ALTER TABLE IF EXISTS ai_agent_actions DROP CONSTRAINT IF EXISTS fk_ai_agent_actions_client;
  ALTER TABLE IF EXISTS ai_agent_permissions DROP CONSTRAINT IF EXISTS fk_ai_agent_permissions_client;
  ALTER TABLE IF EXISTS agent_memory DROP CONSTRAINT IF EXISTS fk_agent_memory_client;
  ALTER TABLE IF EXISTS ai_capability_usage DROP CONSTRAINT IF EXISTS fk_ai_capability_usage_client;
  ALTER TABLE IF EXISTS ai_module_settings DROP CONSTRAINT IF EXISTS fk_ai_module_settings_client;
  ALTER TABLE IF EXISTS ai_query_history DROP CONSTRAINT IF EXISTS fk_ai_query_history_client;
  ALTER TABLE IF EXISTS ai_team_permissions DROP CONSTRAINT IF EXISTS fk_ai_team_permissions_client;
  ALTER TABLE IF EXISTS ai_usage_alerts DROP CONSTRAINT IF EXISTS fk_ai_usage_alerts_client;
  ALTER TABLE IF EXISTS chat_conversations DROP CONSTRAINT IF EXISTS fk_chat_conversations_client;
  ALTER TABLE IF EXISTS client_agent_tokens DROP CONSTRAINT IF EXISTS fk_client_agent_tokens_client;
  ALTER TABLE IF EXISTS client_contacts DROP CONSTRAINT IF EXISTS fk_client_contacts_client;
  ALTER TABLE IF EXISTS client_credits DROP CONSTRAINT IF EXISTS fk_client_credits_client;
  ALTER TABLE IF EXISTS client_insights DROP CONSTRAINT IF EXISTS fk_client_insights_client;
  ALTER TABLE IF EXISTS client_performance_history DROP CONSTRAINT IF EXISTS fk_client_performance_history_client;
  ALTER TABLE IF EXISTS client_team DROP CONSTRAINT IF EXISTS fk_client_team_client;
  ALTER TABLE IF EXISTS client_users DROP CONSTRAINT IF EXISTS fk_client_users_client;
  ALTER TABLE IF EXISTS credit_alerts DROP CONSTRAINT IF EXISTS fk_credit_alerts_client;
  ALTER TABLE IF EXISTS credit_transactions DROP CONSTRAINT IF EXISTS fk_credit_transactions_client;
  ALTER TABLE IF EXISTS feature_requests DROP CONSTRAINT IF EXISTS fk_feature_requests_client;
  ALTER TABLE IF EXISTS marketing_data DROP CONSTRAINT IF EXISTS fk_marketing_data_client;
  ALTER TABLE IF EXISTS notification_history DROP CONSTRAINT IF EXISTS fk_notification_history_client;
  ALTER TABLE IF EXISTS sync_schedules DROP CONSTRAINT IF EXISTS fk_sync_schedules_client;
  ALTER TABLE IF EXISTS task_requests DROP CONSTRAINT IF EXISTS fk_task_requests_client;
  ALTER TABLE IF EXISTS task_shares DROP CONSTRAINT IF EXISTS fk_task_shares_client;
  ALTER TABLE IF EXISTS widget_configurations DROP CONSTRAINT IF EXISTS fk_widget_configurations_client;
END $$;

-- Add FK constraints with CASCADE
ALTER TABLE integrations ADD CONSTRAINT fk_integrations_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE analytics_snapshots ADD CONSTRAINT fk_analytics_snapshots_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_agents ADD CONSTRAINT fk_ai_agents_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_agent_actions ADD CONSTRAINT fk_ai_agent_actions_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_agent_permissions ADD CONSTRAINT fk_ai_agent_permissions_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE agent_memory ADD CONSTRAINT fk_agent_memory_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_capability_usage ADD CONSTRAINT fk_ai_capability_usage_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_module_settings ADD CONSTRAINT fk_ai_module_settings_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_query_history ADD CONSTRAINT fk_ai_query_history_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_team_permissions ADD CONSTRAINT fk_ai_team_permissions_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE ai_usage_alerts ADD CONSTRAINT fk_ai_usage_alerts_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE chat_conversations ADD CONSTRAINT fk_chat_conversations_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_agent_tokens ADD CONSTRAINT fk_client_agent_tokens_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_contacts ADD CONSTRAINT fk_client_contacts_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_credits ADD CONSTRAINT fk_client_credits_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_insights ADD CONSTRAINT fk_client_insights_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_performance_history ADD CONSTRAINT fk_client_performance_history_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_team ADD CONSTRAINT fk_client_team_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_users ADD CONSTRAINT fk_client_users_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE credit_alerts ADD CONSTRAINT fk_credit_alerts_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE credit_transactions ADD CONSTRAINT fk_credit_transactions_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE feature_requests ADD CONSTRAINT fk_feature_requests_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE marketing_data ADD CONSTRAINT fk_marketing_data_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE notification_history ADD CONSTRAINT fk_notification_history_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE sync_schedules ADD CONSTRAINT fk_sync_schedules_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE task_requests ADD CONSTRAINT fk_task_requests_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE task_shares ADD CONSTRAINT fk_task_shares_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE widget_configurations ADD CONSTRAINT fk_widget_configurations_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ============================================
-- PHASE 2: Soft Delete for Clients
-- ============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing clients to be active
UPDATE clients SET is_active = true WHERE is_active IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- PHASE 3: Create Default Triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.create_client_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default sync schedule
  INSERT INTO sync_schedules (client_id, frequency, is_active)
  VALUES (NEW.id, 'daily', true)
  ON CONFLICT DO NOTHING;
  
  -- Create client credits with 0 balance
  INSERT INTO client_credits (client_id, total_credits, used_credits)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_client_created_defaults ON clients;
CREATE TRIGGER on_client_created_defaults
  AFTER INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION create_client_defaults();

-- ============================================
-- PHASE 4: Fix Critical RLS Policies (qual:true)
-- ============================================

-- Fix ai_agents policies
DROP POLICY IF EXISTS "Users can delete ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can insert ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can update ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can view ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "ai_agents_select" ON ai_agents;
DROP POLICY IF EXISTS "ai_agents_insert" ON ai_agents;
DROP POLICY IF EXISTS "ai_agents_update" ON ai_agents;
DROP POLICY IF EXISTS "ai_agents_delete" ON ai_agents;

CREATE POLICY "ai_agents_select" ON ai_agents 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "ai_agents_insert" ON ai_agents 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "ai_agents_update" ON ai_agents 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "ai_agents_delete" ON ai_agents 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Fix ai_agent_actions policies
DROP POLICY IF EXISTS "Users can delete ai_agent_actions" ON ai_agent_actions;
DROP POLICY IF EXISTS "Users can insert ai_agent_actions" ON ai_agent_actions;
DROP POLICY IF EXISTS "Users can update ai_agent_actions" ON ai_agent_actions;
DROP POLICY IF EXISTS "Users can view ai_agent_actions" ON ai_agent_actions;
DROP POLICY IF EXISTS "ai_agent_actions_select" ON ai_agent_actions;
DROP POLICY IF EXISTS "ai_agent_actions_insert" ON ai_agent_actions;
DROP POLICY IF EXISTS "ai_agent_actions_update" ON ai_agent_actions;
DROP POLICY IF EXISTS "ai_agent_actions_delete" ON ai_agent_actions;

CREATE POLICY "ai_agent_actions_select" ON ai_agent_actions 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "ai_agent_actions_insert" ON ai_agent_actions 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "ai_agent_actions_update" ON ai_agent_actions 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "ai_agent_actions_delete" ON ai_agent_actions 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- ============================================
-- PHASE 5: Update Clients RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view assigned clients" ON clients;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

CREATE POLICY "clients_select" ON clients 
  FOR SELECT TO authenticated
  USING (
    (is_active = true OR is_active IS NULL) AND 
    (has_client_access(auth.uid(), id) OR has_role_level(auth.uid(), 'admin'))
  );

CREATE POLICY "clients_insert" ON clients 
  FOR INSERT TO authenticated
  WITH CHECK (has_role_level(auth.uid(), 'employee'));

CREATE POLICY "clients_update" ON clients 
  FOR UPDATE TO authenticated
  USING (
    (has_client_access(auth.uid(), id) OR has_role_level(auth.uid(), 'admin')) AND 
    has_role_level(auth.uid(), 'employee')
  );

CREATE POLICY "clients_delete" ON clients 
  FOR DELETE TO authenticated
  USING (has_role_level(auth.uid(), 'admin'));

-- ============================================
-- PHASE 6: Standardize RLS for other tables
-- ============================================

-- Integrations
DROP POLICY IF EXISTS "Users can view assigned integrations" ON integrations;
DROP POLICY IF EXISTS "Users can manage integrations" ON integrations;
DROP POLICY IF EXISTS "integrations_select" ON integrations;
DROP POLICY IF EXISTS "integrations_insert" ON integrations;
DROP POLICY IF EXISTS "integrations_update" ON integrations;
DROP POLICY IF EXISTS "integrations_delete" ON integrations;

CREATE POLICY "integrations_select" ON integrations 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "integrations_insert" ON integrations 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "integrations_update" ON integrations 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "integrations_delete" ON integrations 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Analytics Snapshots
DROP POLICY IF EXISTS "Users can view analytics" ON analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_select" ON analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_insert" ON analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_update" ON analytics_snapshots;
DROP POLICY IF EXISTS "analytics_snapshots_delete" ON analytics_snapshots;

CREATE POLICY "analytics_snapshots_select" ON analytics_snapshots 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "analytics_snapshots_insert" ON analytics_snapshots 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "analytics_snapshots_update" ON analytics_snapshots 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "analytics_snapshots_delete" ON analytics_snapshots 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Sync Schedules
DROP POLICY IF EXISTS "sync_schedules_select" ON sync_schedules;
DROP POLICY IF EXISTS "sync_schedules_insert" ON sync_schedules;
DROP POLICY IF EXISTS "sync_schedules_update" ON sync_schedules;
DROP POLICY IF EXISTS "sync_schedules_delete" ON sync_schedules;

CREATE POLICY "sync_schedules_select" ON sync_schedules 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "sync_schedules_insert" ON sync_schedules 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "sync_schedules_update" ON sync_schedules 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "sync_schedules_delete" ON sync_schedules 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Chat Conversations
DROP POLICY IF EXISTS "chat_conversations_select" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_delete" ON chat_conversations;

CREATE POLICY "chat_conversations_select" ON chat_conversations 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "chat_conversations_insert" ON chat_conversations 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "chat_conversations_update" ON chat_conversations 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "chat_conversations_delete" ON chat_conversations 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Client Credits
DROP POLICY IF EXISTS "client_credits_select" ON client_credits;
DROP POLICY IF EXISTS "client_credits_insert" ON client_credits;
DROP POLICY IF EXISTS "client_credits_update" ON client_credits;
DROP POLICY IF EXISTS "client_credits_delete" ON client_credits;

CREATE POLICY "client_credits_select" ON client_credits 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "client_credits_insert" ON client_credits 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "client_credits_update" ON client_credits 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "client_credits_delete" ON client_credits 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'admin'));

-- Credit Transactions
DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_update" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_delete" ON credit_transactions;

CREATE POLICY "credit_transactions_select" ON credit_transactions 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "credit_transactions_insert" ON credit_transactions 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "credit_transactions_update" ON credit_transactions 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'admin'));

CREATE POLICY "credit_transactions_delete" ON credit_transactions 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'admin'));

-- Marketing Data
DROP POLICY IF EXISTS "marketing_data_select" ON marketing_data;
DROP POLICY IF EXISTS "marketing_data_insert" ON marketing_data;
DROP POLICY IF EXISTS "marketing_data_update" ON marketing_data;
DROP POLICY IF EXISTS "marketing_data_delete" ON marketing_data;

CREATE POLICY "marketing_data_select" ON marketing_data 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "marketing_data_insert" ON marketing_data 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "marketing_data_update" ON marketing_data 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "marketing_data_delete" ON marketing_data 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Notification History
DROP POLICY IF EXISTS "notification_history_select" ON notification_history;
DROP POLICY IF EXISTS "notification_history_insert" ON notification_history;
DROP POLICY IF EXISTS "notification_history_update" ON notification_history;
DROP POLICY IF EXISTS "notification_history_delete" ON notification_history;

CREATE POLICY "notification_history_select" ON notification_history 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "notification_history_insert" ON notification_history 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "notification_history_update" ON notification_history 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "notification_history_delete" ON notification_history 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Feature Requests
DROP POLICY IF EXISTS "feature_requests_select" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_insert" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_update" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_delete" ON feature_requests;

CREATE POLICY "feature_requests_select" ON feature_requests 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "feature_requests_insert" ON feature_requests 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "feature_requests_update" ON feature_requests 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "feature_requests_delete" ON feature_requests 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));

-- Widget Configurations
DROP POLICY IF EXISTS "widget_configurations_select" ON widget_configurations;
DROP POLICY IF EXISTS "widget_configurations_insert" ON widget_configurations;
DROP POLICY IF EXISTS "widget_configurations_update" ON widget_configurations;
DROP POLICY IF EXISTS "widget_configurations_delete" ON widget_configurations;

CREATE POLICY "widget_configurations_select" ON widget_configurations 
  FOR SELECT TO authenticated
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "widget_configurations_insert" ON widget_configurations 
  FOR INSERT TO authenticated
  WITH CHECK (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "widget_configurations_update" ON widget_configurations 
  FOR UPDATE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'employee'));

CREATE POLICY "widget_configurations_delete" ON widget_configurations 
  FOR DELETE TO authenticated
  USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_manager'));