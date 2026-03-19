
-- Create saved_keywords table
CREATE TABLE public.saved_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category_type text NOT NULL DEFAULT 'custom',
  category_value text,
  tags jsonb DEFAULT '[]'::jsonb,
  avg_monthly_searches integer DEFAULT 0,
  competition text,
  competition_index integer DEFAULT 0,
  low_bid numeric DEFAULT 0,
  high_bid numeric DEFAULT 0,
  notes text,
  source_query text,
  language_id text DEFAULT '1027',
  location_id text DEFAULT '2376',
  last_refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(client_id, keyword, category_type, category_value)
);

-- Enable RLS
ALTER TABLE public.saved_keywords ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view saved keywords for their clients"
  ON public.saved_keywords FOR SELECT
  TO authenticated
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Employees can insert saved keywords"
  ON public.saved_keywords FOR INSERT
  TO authenticated
  WITH CHECK (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees can update saved keywords"
  ON public.saved_keywords FOR UPDATE
  TO authenticated
  USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees can delete saved keywords"
  ON public.saved_keywords FOR DELETE
  TO authenticated
  USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'employee'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_saved_keywords_updated_at
  BEFORE UPDATE ON public.saved_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
