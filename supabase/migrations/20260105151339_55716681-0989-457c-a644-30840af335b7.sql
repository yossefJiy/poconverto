-- Create credit_formulas table for calculating credits from time
CREATE TABLE public.credit_formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_credits INTEGER NOT NULL DEFAULT 10,
  time_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  complexity_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_limits table for per-client limits
CREATE TABLE public.client_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  monthly_hours_limit NUMERIC(10,2),
  monthly_credits_limit INTEGER,
  limit_type TEXT NOT NULL DEFAULT 'fixed' CHECK (limit_type IN ('fixed', 'percentage')),
  percentage_base NUMERIC(10,2),
  overage_rate NUMERIC(10,2) DEFAULT 1.5,
  alert_at_percentage INTEGER DEFAULT 80,
  block_at_limit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.credit_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_formulas (admin only for write, all authenticated can read)
CREATE POLICY "Admins can manage credit formulas" 
ON public.credit_formulas 
FOR ALL 
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view credit formulas" 
ON public.credit_formulas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS policies for client_limits
CREATE POLICY "Admins can manage client limits" 
ON public.client_limits 
FOR ALL 
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their client limits" 
ON public.client_limits 
FOR SELECT 
USING (public.has_client_access(auth.uid(), client_id));

-- Add triggers for updated_at
CREATE TRIGGER update_credit_formulas_updated_at
BEFORE UPDATE ON public.credit_formulas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_limits_updated_at
BEFORE UPDATE ON public.client_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default formula
INSERT INTO public.credit_formulas (name, description, base_credits, time_multiplier, complexity_multiplier, is_default)
VALUES 
  ('סטנדרטי', 'נוסחת קרדיטים בסיסית - 10 קרדיטים לשעה', 10, 1.0, 1.0, true),
  ('מורכב', 'עבודה מורכבת - 15 קרדיטים לשעה', 15, 1.0, 1.5, false),
  ('דחוף', 'עבודה דחופה - 20 קרדיטים לשעה', 20, 1.5, 1.0, false);