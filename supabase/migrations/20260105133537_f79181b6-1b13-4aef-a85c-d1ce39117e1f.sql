-- =============================================
-- Phase 1: Core Infrastructure Tables (Skip task_requests - already exists)
-- =============================================

-- 1. Projects table (Client > Project > Task hierarchy)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  start_date DATE,
  target_date DATE,
  budget_hours NUMERIC(10,2),
  budget_credits NUMERIC(10,2),
  priority_category TEXT CHECK (priority_category IN ('revenue', 'growth', 'innovation', 'maintenance')),
  priority_override_percent INTEGER CHECK (priority_override_percent >= 0 AND priority_override_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 2. Add project_id and priority fields to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority_category TEXT CHECK (priority_category IN ('revenue', 'growth', 'innovation', 'maintenance')),
ADD COLUMN IF NOT EXISTS credit_weight NUMERIC(10,2) DEFAULT 1.0;

-- 3. Client user access levels
CREATE TABLE public.client_user_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view_only' CHECK (access_level IN ('view_only', 'request_tasks', 'full')),
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- 4. Add project_id to existing task_requests if missing
ALTER TABLE public.task_requests 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 5. Priority allocation settings (70/30 split)
CREATE TABLE public.priority_allocation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'client', 'project', 'user')),
  scope_id UUID,
  stability_percent INTEGER NOT NULL DEFAULT 70 CHECK (stability_percent >= 0 AND stability_percent <= 100),
  innovation_percent INTEGER NOT NULL DEFAULT 30 CHECK (innovation_percent >= 0 AND innovation_percent <= 100),
  period TEXT DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT percent_total CHECK (stability_percent + innovation_percent = 100)
);

-- 6. User impersonation log for audit
CREATE TABLE public.user_impersonation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  reason TEXT,
  actions_performed JSONB DEFAULT '[]'::jsonb
);

-- =============================================
-- Enable RLS on all new tables
-- =============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_impersonation_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Projects policies
CREATE POLICY "Users can view projects for their clients" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_users cu 
      WHERE cu.client_id = projects.client_id AND cu.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.team t 
      WHERE t.user_id = auth.uid() AND t.is_active = true
    )
  );

CREATE POLICY "Team members can manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team t 
      WHERE t.user_id = auth.uid() AND t.is_active = true
    )
  );

-- Client user access policies
CREATE POLICY "Team can manage client access" ON public.client_user_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team t 
      WHERE t.user_id = auth.uid() AND t.is_active = true
    )
  );

CREATE POLICY "Users can view their own access" ON public.client_user_access
  FOR SELECT USING (user_id = auth.uid());

-- Priority allocation policies
CREATE POLICY "Team can manage priority allocation" ON public.priority_allocation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team t 
      WHERE t.user_id = auth.uid() AND t.is_active = true
    )
  );

CREATE POLICY "Users can view priority settings" ON public.priority_allocation
  FOR SELECT USING (true);

-- Impersonation log policies (admin only)
CREATE POLICY "Only admins can view impersonation logs" ON public.user_impersonation_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin')
    )
  );

-- =============================================
-- Indexes for performance
-- =============================================

CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_priority_category ON public.tasks(priority_category);
CREATE INDEX idx_client_user_access_user ON public.client_user_access(user_id);
CREATE INDEX idx_task_requests_project ON public.task_requests(project_id);
CREATE INDEX idx_priority_allocation_scope ON public.priority_allocation(scope_type, scope_id);
CREATE INDEX idx_impersonation_admin ON public.user_impersonation_log(admin_user_id);

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_user_access_updated_at
  BEFORE UPDATE ON public.client_user_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priority_allocation_updated_at
  BEFORE UPDATE ON public.priority_allocation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Insert default global priority allocation (70/30)
-- =============================================

INSERT INTO public.priority_allocation (scope_type, stability_percent, innovation_percent, period)
VALUES ('global', 70, 30, 'monthly');

-- =============================================
-- Ensure JIY master account exists
-- =============================================

INSERT INTO public.clients (name, description, is_master_account, is_active)
VALUES ('JIY Digital Agency', 'Internal agency tasks and projects', true, true)
ON CONFLICT DO NOTHING;