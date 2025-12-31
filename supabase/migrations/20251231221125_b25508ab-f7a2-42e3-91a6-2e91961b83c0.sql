-- Create client_team junction table for assigning team members to clients
CREATE TABLE public.client_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team(id) ON DELETE CASCADE,
  role TEXT, -- e.g., "מנהל לקוח", "מעצב", "קופירייטר"
  is_lead BOOLEAN DEFAULT false, -- Main contact for this client
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, team_member_id)
);

-- Enable RLS
ALTER TABLE public.client_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can manage client team assignments"
ON public.client_team
FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Users can view team assignments for assigned clients"
ON public.client_team
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- Create indexes
CREATE INDEX idx_client_team_client_id ON public.client_team(client_id);
CREATE INDEX idx_client_team_team_member_id ON public.client_team(team_member_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_team_updated_at
BEFORE UPDATE ON public.client_team
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();