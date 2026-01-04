
-- Create capabilities categories enum
CREATE TYPE ai_capability_category AS ENUM (
  'system',        -- פעולות מערכת
  'integrations',  -- אינטגרציות חיצוניות
  'content',       -- יצירת תוכן AI
  'analytics',     -- ניתוח ודיווח
  'tasks',         -- ניהול משימות
  'campaigns',     -- ניהול קמפיינים
  'ecommerce'      -- פעולות אי-קומרס
);

-- Table for all available AI capabilities/functions
CREATE TABLE public.ai_capability_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category ai_capability_category NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_dangerous BOOLEAN DEFAULT false, -- דורש אישור מיוחד
  requires_confirmation BOOLEAN DEFAULT false, -- דורש אישור לפני ביצוע
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for agent permissions per context (agent + client + domain)
CREATE TABLE public.ai_agent_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE NOT NULL,
  capability_id UUID REFERENCES public.ai_capability_definitions(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, -- NULL = global permission
  domain TEXT, -- תחום ספציפי (marketing, sales, support, etc.)
  is_allowed BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false, -- פעולה דורשת אישור מראש
  max_daily_uses INTEGER, -- הגבלת שימוש יומי
  current_daily_uses INTEGER DEFAULT 0,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- הרשאה זמנית
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, capability_id, client_id, domain)
);

-- Table for tracking capability usage
CREATE TABLE public.ai_capability_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  capability_id UUID REFERENCES public.ai_capability_definitions(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  permission_id UUID REFERENCES public.ai_agent_permissions(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT now(),
  was_allowed BOOLEAN NOT NULL,
  was_approved BOOLEAN,
  approved_by UUID,
  execution_result JSONB,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.ai_capability_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_capability_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for capability definitions
CREATE POLICY "Anyone can view active capabilities"
  ON public.ai_capability_definitions FOR SELECT
  USING (is_active = true OR has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage capabilities"
  ON public.ai_capability_definitions FOR ALL
  USING (has_role_level(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role_level(auth.uid(), 'admin'::app_role));

-- RLS Policies for agent permissions
CREATE POLICY "Admins can manage all permissions"
  ON public.ai_agent_permissions FOR ALL
  USING (has_role_level(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team leads can manage permissions for assigned clients"
  ON public.ai_agent_permissions FOR ALL
  USING (
    has_role_level(auth.uid(), 'team_lead'::app_role) AND 
    (client_id IS NULL OR has_client_access(auth.uid(), client_id))
  )
  WITH CHECK (
    has_role_level(auth.uid(), 'team_lead'::app_role) AND 
    (client_id IS NULL OR has_client_access(auth.uid(), client_id))
  );

CREATE POLICY "Users can view permissions for assigned clients"
  ON public.ai_agent_permissions FOR SELECT
  USING (
    client_id IS NULL OR has_client_access(auth.uid(), client_id)
  );

-- RLS Policies for usage tracking
CREATE POLICY "System can insert usage"
  ON public.ai_capability_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all usage"
  ON public.ai_capability_usage FOR SELECT
  USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view usage for assigned clients"
  ON public.ai_capability_usage FOR SELECT
  USING (client_id IS NULL OR has_client_access(auth.uid(), client_id));

-- Trigger for updated_at
CREATE TRIGGER update_ai_capability_definitions_updated_at
  BEFORE UPDATE ON public.ai_capability_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_permissions_updated_at
  BEFORE UPDATE ON public.ai_agent_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default capabilities
INSERT INTO public.ai_capability_definitions (name, display_name, description, category, is_dangerous, requires_confirmation) VALUES
-- System capabilities
('create_task', 'יצירת משימה', 'יצירת משימות חדשות במערכת', 'tasks', false, false),
('update_task', 'עדכון משימה', 'עדכון משימות קיימות', 'tasks', false, false),
('delete_task', 'מחיקת משימה', 'מחיקת משימות מהמערכת', 'tasks', true, true),
('send_notification', 'שליחת התראה', 'שליחת התראות למשתמשים', 'system', false, false),
('send_email', 'שליחת אימייל', 'שליחת אימיילים ללקוחות/צוות', 'system', false, true),
('send_sms', 'שליחת SMS', 'שליחת הודעות SMS', 'system', true, true),

-- Analytics capabilities
('read_analytics', 'קריאת אנליטיקס', 'גישה לנתוני אנליטיקס', 'analytics', false, false),
('generate_report', 'יצירת דוח', 'יצירת דוחות אוטומטיים', 'analytics', false, false),
('analyze_performance', 'ניתוח ביצועים', 'ניתוח ביצועי קמפיינים ולקוחות', 'analytics', false, false),

-- Campaign capabilities
('create_campaign', 'יצירת קמפיין', 'יצירת קמפיינים חדשים', 'campaigns', false, true),
('update_campaign', 'עדכון קמפיין', 'עדכון קמפיינים קיימים', 'campaigns', false, false),
('pause_campaign', 'השהיית קמפיין', 'השהיית קמפיין פעיל', 'campaigns', true, true),
('delete_campaign', 'מחיקת קמפיין', 'מחיקת קמפיין מהמערכת', 'campaigns', true, true),

-- Integration capabilities
('sync_google_ads', 'סנכרון Google Ads', 'סנכרון נתונים מ-Google Ads', 'integrations', false, false),
('sync_facebook_ads', 'סנכרון Facebook Ads', 'סנכרון נתונים מ-Facebook Ads', 'integrations', false, false),
('sync_shopify', 'סנכרון Shopify', 'סנכרון נתונים מ-Shopify', 'integrations', false, false),
('sync_woocommerce', 'סנכרון WooCommerce', 'סנכרון נתונים מ-WooCommerce', 'integrations', false, false),
('sync_google_analytics', 'סנכרון Google Analytics', 'סנכרון נתונים מ-Google Analytics', 'integrations', false, false),

-- Content/AI capabilities
('generate_content', 'יצירת תוכן', 'יצירת תוכן שיווקי באמצעות AI', 'content', false, false),
('generate_recommendations', 'יצירת המלצות', 'יצירת המלצות אוטומטיות', 'content', false, false),
('analyze_content', 'ניתוח תוכן', 'ניתוח תוכן קיים ומתן משוב', 'content', false, false),

-- Ecommerce capabilities
('read_products', 'קריאת מוצרים', 'גישה לנתוני מוצרים', 'ecommerce', false, false),
('update_product', 'עדכון מוצר', 'עדכון פרטי מוצר', 'ecommerce', false, true),
('read_orders', 'קריאת הזמנות', 'גישה לנתוני הזמנות', 'ecommerce', false, false),
('manage_inventory', 'ניהול מלאי', 'עדכון מלאי מוצרים', 'ecommerce', true, true);

-- Function to check if agent has permission for capability
CREATE OR REPLACE FUNCTION public.agent_has_capability(
  _agent_id UUID,
  _capability_name TEXT,
  _client_id UUID DEFAULT NULL,
  _domain TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_permission BOOLEAN := false;
  permission_record RECORD;
BEGIN
  -- Check for specific permission (most specific first)
  SELECT INTO permission_record
    p.is_allowed,
    p.requires_approval,
    p.max_daily_uses,
    p.current_daily_uses,
    p.expires_at
  FROM public.ai_agent_permissions p
  JOIN public.ai_capability_definitions c ON c.id = p.capability_id
  WHERE p.agent_id = _agent_id
    AND c.name = _capability_name
    AND c.is_active = true
    AND (
      -- Exact match
      (p.client_id = _client_id AND p.domain = _domain)
      OR
      -- Client match, any domain
      (p.client_id = _client_id AND p.domain IS NULL)
      OR
      -- Domain match, any client
      (p.client_id IS NULL AND p.domain = _domain)
      OR
      -- Global permission
      (p.client_id IS NULL AND p.domain IS NULL)
    )
    AND (p.expires_at IS NULL OR p.expires_at > now())
  ORDER BY 
    CASE WHEN p.client_id IS NOT NULL AND p.domain IS NOT NULL THEN 1
         WHEN p.client_id IS NOT NULL THEN 2
         WHEN p.domain IS NOT NULL THEN 3
         ELSE 4
    END
  LIMIT 1;
  
  IF FOUND THEN
    -- Check daily usage limit
    IF permission_record.max_daily_uses IS NOT NULL AND 
       permission_record.current_daily_uses >= permission_record.max_daily_uses THEN
      RETURN false;
    END IF;
    
    RETURN permission_record.is_allowed;
  END IF;
  
  RETURN false;
END;
$$;
