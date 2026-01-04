-- Create client_templates table for industry-based templates
CREATE TABLE public.client_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  modules_enabled JSONB NOT NULL DEFAULT '{}',
  default_settings JSONB DEFAULT '{}',
  integrations_suggested TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "client_templates_select" ON client_templates 
  FOR SELECT TO authenticated USING (true);

-- Only admins can manage templates
CREATE POLICY "client_templates_admin_all" ON client_templates 
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'))
  WITH CHECK (public.has_role_level(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_client_templates_updated_at
  BEFORE UPDATE ON client_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO client_templates (name, industry, description, icon, modules_enabled, default_settings, integrations_suggested, sort_order) VALUES
(
  'E-Commerce Business',
  'e-commerce',
  'Perfect for online stores with Shopify, WooCommerce, or similar platforms',
  'ShoppingCart',
  '{"dashboard": true, "analytics": true, "ecommerce": true, "campaigns": true, "tasks": true, "reports": true, "ai_agents": true}',
  '{"focus": "sales", "primary_metrics": ["revenue", "orders", "conversion_rate"]}',
  ARRAY['shopify', 'woocommerce', 'facebook_ads', 'google_ads'],
  1
),
(
  'B2B Services',
  'b2b',
  'Ideal for B2B companies focused on lead generation and client management',
  'Building2',
  '{"dashboard": true, "analytics": true, "campaigns": true, "tasks": true, "reports": true, "team": true, "credits": true}',
  '{"focus": "leads", "primary_metrics": ["leads", "cost_per_lead", "roas"]}',
  ARRAY['google_ads', 'google_analytics', 'facebook_ads'],
  2
),
(
  'Professional Services',
  'services',
  'Great for agencies, consultants, and service providers',
  'Briefcase',
  '{"dashboard": true, "tasks": true, "reports": true, "team": true, "credits": true, "ai_agents": true}',
  '{"focus": "projects", "primary_metrics": ["tasks_completed", "hours_tracked", "client_satisfaction"]}',
  ARRAY['google_analytics'],
  3
),
(
  'SaaS / Tech Startup',
  'saas',
  'Built for software companies tracking user acquisition and retention',
  'Rocket',
  '{"dashboard": true, "analytics": true, "campaigns": true, "tasks": true, "reports": true, "ai_agents": true}',
  '{"focus": "growth", "primary_metrics": ["mrr", "churn", "cac", "ltv"]}',
  ARRAY['google_analytics', 'google_ads', 'facebook_ads'],
  4
),
(
  'Local Business',
  'local',
  'Perfect for restaurants, retail stores, and local service providers',
  'MapPin',
  '{"dashboard": true, "campaigns": true, "tasks": true, "reports": true}',
  '{"focus": "local", "primary_metrics": ["foot_traffic", "calls", "reviews"]}',
  ARRAY['google_ads', 'facebook_ads'],
  5
),
(
  'Custom Setup',
  'custom',
  'Start from scratch and configure everything manually',
  'Settings',
  '{"dashboard": true, "tasks": true}',
  '{}',
  ARRAY[]::text[],
  99
);