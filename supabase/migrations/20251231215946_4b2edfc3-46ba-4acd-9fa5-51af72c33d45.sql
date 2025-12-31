-- Create client_contacts table for managing client contacts
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  receive_task_updates BOOLEAN DEFAULT true,
  has_portal_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can manage client contacts"
ON public.client_contacts
FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Users can view contacts for assigned clients"
ON public.client_contacts
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- Create trigger for updated_at
CREATE TRIGGER update_client_contacts_updated_at
BEFORE UPDATE ON public.client_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_client_contacts_client_id ON public.client_contacts(client_id);

-- Update JIY as master account
UPDATE public.clients SET is_master_account = true WHERE name ILIKE '%jiy%' OR name ILIKE '%ג׳יי%';