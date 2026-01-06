-- Add account_type to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'basic_client';

-- Add check constraint for account_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_account_type_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_account_type_check 
      CHECK (account_type IN ('basic_client', 'premium_client'));
  END IF;
END $$;

-- Create global module settings table
CREATE TABLE IF NOT EXISTS public.global_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_globally_enabled BOOLEAN DEFAULT true,
  default_for_basic BOOLEAN DEFAULT false,
  default_for_premium BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_module_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can manage
CREATE POLICY "Admins can view global module settings"
  ON public.global_module_settings
  FOR SELECT
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage global module settings"
  ON public.global_module_settings
  FOR ALL
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- Insert default module settings
INSERT INTO public.global_module_settings (module_name, display_name, is_globally_enabled, default_for_basic, default_for_premium, sort_order)
VALUES 
  ('dashboard', 'דשבורד', true, true, true, 1),
  ('analytics', 'אנליטיקס', true, true, true, 2),
  ('ecommerce', 'אי-קומרס', true, false, true, 3),
  ('marketing', 'מרקטינג', true, true, true, 4),
  ('campaigns', 'קמפיינים', true, true, true, 5),
  ('tasks', 'משימות', true, true, true, 6),
  ('team', 'צוות', true, false, true, 7),
  ('features', 'תכונות', true, true, true, 8),
  ('insights', 'תובנות', true, false, true, 9),
  ('ai_agent', 'סוכן AI', true, false, true, 10),
  ('reports', 'דוחות', true, true, true, 11),
  ('leads', 'לידים', true, false, true, 12),
  ('billing', 'חיוב', true, false, true, 13),
  ('approvals', 'אישורים', true, false, true, 14),
  ('agency', 'סוכנות', true, false, false, 15)
ON CONFLICT (module_name) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_global_module_settings_updated_at
  BEFORE UPDATE ON public.global_module_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();