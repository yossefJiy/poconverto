-- Expand leads table with more fields
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.ai_agents(id),
ADD COLUMN IF NOT EXISTS assigned_user_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_value NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create lead_conversations table for multi-channel messaging
CREATE TABLE public.lead_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'messenger', 'instagram', 'sms', 'email', 'phone', 'website')),
  external_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_messages table
CREATE TABLE public.lead_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.lead_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('lead', 'user', 'agent', 'system')),
  sender_id TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'file', 'location')),
  media_url TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_activities table for tracking all lead interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'contacted', 'email_sent', 'email_opened', 'call', 'meeting', 'note', 'stage_changed', 'assigned', 'scored', 'won', 'lost')),
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_conversations
CREATE POLICY "Users can view lead conversations they have access to"
ON public.lead_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (l.client_id IS NULL OR public.has_client_access(auth.uid(), l.client_id))
  )
);

CREATE POLICY "Users can manage lead conversations they have access to"
ON public.lead_conversations FOR ALL
USING (public.has_role_level(auth.uid(), 'employee'::app_role));

-- RLS policies for lead_messages
CREATE POLICY "Users can view messages in accessible conversations"
ON public.lead_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lead_conversations lc
    JOIN public.leads l ON l.id = lc.lead_id
    WHERE lc.id = conversation_id
    AND (l.client_id IS NULL OR public.has_client_access(auth.uid(), l.client_id))
  )
);

CREATE POLICY "Users can manage messages"
ON public.lead_messages FOR ALL
USING (public.has_role_level(auth.uid(), 'employee'::app_role));

-- RLS policies for lead_activities
CREATE POLICY "Users can view lead activities they have access to"
ON public.lead_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (l.client_id IS NULL OR public.has_client_access(auth.uid(), l.client_id))
  )
);

CREATE POLICY "Users can create lead activities"
ON public.lead_activities FOR INSERT
WITH CHECK (public.has_role_level(auth.uid(), 'employee'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_lead_conversations_updated_at
BEFORE UPDATE ON public.lead_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_lead_conversations_lead_id ON public.lead_conversations(lead_id);
CREATE INDEX idx_lead_messages_conversation_id ON public.lead_messages(conversation_id);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_leads_pipeline_stage ON public.leads(pipeline_stage);
CREATE INDEX idx_leads_assigned_user ON public.leads(assigned_user_id);
CREATE INDEX idx_leads_client_id ON public.leads(client_id);