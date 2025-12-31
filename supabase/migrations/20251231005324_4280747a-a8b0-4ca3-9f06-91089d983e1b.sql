-- Create feature_requests table for managing feature ideas
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and managers can manage all features"
ON public.feature_requests
FOR ALL
USING (public.has_role_level(auth.uid(), 'manager'));

CREATE POLICY "Users can view features for their clients"
ON public.feature_requests
FOR SELECT
USING (
  public.has_role_level(auth.uid(), 'manager') OR
  public.has_client_access(auth.uid(), client_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_feature_requests_updated_at
BEFORE UPDATE ON public.feature_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();