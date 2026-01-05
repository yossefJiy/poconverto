-- Create approval_workflows table
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('content', 'campaign', 'budget', 'task', 'invoice', 'quote', 'general')),
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  auto_approve_threshold NUMERIC(12,2),
  require_all_approvers BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_items table
CREATE TABLE public.approval_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('content', 'campaign', 'budget', 'task', 'invoice', 'quote', 'ai_action', 'general')),
  item_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'cancelled', 'expired')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_decisions table
CREATE TABLE public.approval_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_item_id UUID NOT NULL REFERENCES public.approval_items(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'request_changes')),
  comments TEXT,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_comments table for discussion
CREATE TABLE public.approval_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_item_id UUID NOT NULL REFERENCES public.approval_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view workflows for their clients"
ON public.approval_workflows FOR SELECT
USING (client_id IS NULL OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Admins can manage workflows"
ON public.approval_workflows FOR ALL
USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

CREATE POLICY "Users can view approval items for their clients"
ON public.approval_items FOR SELECT
USING (client_id IS NULL OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Authenticated users can create approval items"
ON public.approval_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own approval items"
ON public.approval_items FOR UPDATE
USING (submitted_by = auth.uid() OR public.has_role_level(auth.uid(), 'employee'::app_role));

CREATE POLICY "Users can view decisions for accessible items"
ON public.approval_decisions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.approval_items ai
    WHERE ai.id = approval_item_id
    AND (ai.client_id IS NULL OR public.has_client_access(auth.uid(), ai.client_id))
  )
);

CREATE POLICY "Approvers can create decisions"
ON public.approval_decisions FOR INSERT
WITH CHECK (public.has_role_level(auth.uid(), 'employee'::app_role));

CREATE POLICY "Users can view comments for accessible items"
ON public.approval_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.approval_items ai
    WHERE ai.id = approval_item_id
    AND (ai.client_id IS NULL OR public.has_client_access(auth.uid(), ai.client_id))
  )
  AND (NOT is_internal OR public.has_role_level(auth.uid(), 'employee'::app_role))
);

CREATE POLICY "Authenticated users can add comments"
ON public.approval_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_approval_workflows_updated_at
BEFORE UPDATE ON public.approval_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_items_updated_at
BEFORE UPDATE ON public.approval_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_approval_items_client_id ON public.approval_items(client_id);
CREATE INDEX idx_approval_items_status ON public.approval_items(status);
CREATE INDEX idx_approval_items_item_type ON public.approval_items(item_type);
CREATE INDEX idx_approval_decisions_item_id ON public.approval_decisions(approval_item_id);