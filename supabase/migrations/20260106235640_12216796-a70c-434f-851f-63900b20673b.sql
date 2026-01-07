-- ============================================
-- DYNAMIC MODULES SYSTEM - FULL MIGRATION
-- ============================================

-- 1. dynamic_modules - הגדרות מודולים
CREATE TABLE public.dynamic_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Bot',
  color TEXT DEFAULT '#3B82F6',
  category TEXT NOT NULL CHECK (category IN ('content', 'code', 'analysis', 'planning')),
  ai_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  ai_provider TEXT NOT NULL DEFAULT 'lovable' CHECK (ai_provider IN ('lovable', 'openrouter')),
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  allowed_roles TEXT[] DEFAULT ARRAY['admin', 'manager'],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. dynamic_module_templates - תבניות למודולים
CREATE TABLE public.dynamic_module_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.dynamic_modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'general',
  parts JSONB NOT NULL DEFAULT '[]',
  system_prompt TEXT,
  background_context TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. dynamic_module_sessions - שיחות
CREATE TABLE public.dynamic_module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.dynamic_modules(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.dynamic_module_templates(id),
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  contact_id UUID,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  metadata JSONB DEFAULT '{}',
  total_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. dynamic_module_messages - הודעות עם סיווג משימות
CREATE TABLE public.dynamic_module_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.dynamic_module_sessions(id) ON DELETE CASCADE,
  part_number INTEGER DEFAULT 0,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  key_points TEXT[],
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10,6) DEFAULT 0,
  task_category TEXT,
  task_type TEXT,
  ai_classified_type TEXT,
  user_corrected_type TEXT,
  task_complexity TEXT CHECK (task_complexity IN ('simple', 'medium', 'complex')),
  response_time_ms INTEGER,
  was_successful BOOLEAN DEFAULT true,
  error_message TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  rating_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. sidebar_dynamic_items - פריטי סיידבר דינמיים
CREATE TABLE public.sidebar_dynamic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.dynamic_modules(id) ON DELETE CASCADE,
  parent_category TEXT NOT NULL,
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. module_usage_analytics - אנליטיקס מפורט
CREATE TABLE public.module_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.dynamic_modules(id),
  session_id UUID REFERENCES public.dynamic_module_sessions(id),
  message_id UUID REFERENCES public.dynamic_module_messages(id),
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  contact_id UUID,
  ai_model TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10,6) DEFAULT 0,
  task_category TEXT,
  task_type TEXT,
  final_task_type TEXT,
  task_complexity TEXT,
  action_type TEXT DEFAULT 'dialogue',
  response_time_ms INTEGER,
  was_successful BOOLEAN DEFAULT true,
  error_message TEXT,
  user_rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. module_usage_limits - מגבלות שימוש
CREATE TABLE public.module_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT NOT NULL CHECK (limit_type IN ('global', 'module', 'client', 'user', 'contact')),
  target_id UUID,
  module_id UUID REFERENCES public.dynamic_modules(id),
  daily_requests_limit INTEGER,
  daily_tokens_limit INTEGER,
  daily_cost_limit NUMERIC(10,2),
  monthly_requests_limit INTEGER,
  monthly_tokens_limit INTEGER,
  monthly_cost_limit NUMERIC(10,2),
  allowed_models TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. task_type_definitions - הגדרות סוגי משימות
CREATE TABLE public.task_type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  type_key TEXT NOT NULL UNIQUE,
  type_label_he TEXT NOT NULL,
  type_label_en TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default task types
INSERT INTO public.task_type_definitions (category, type_key, type_label_he, type_label_en, keywords) VALUES
('content', 'copywriting', 'קופירייטינג', 'Copywriting', ARRAY['כותרת', 'טקסט', 'תוכן', 'headline', 'copy']),
('content', 'social_post', 'פוסט סושיאל', 'Social Post', ARRAY['פוסט', 'פייסבוק', 'אינסטגרם', 'לינקדאין', 'social']),
('content', 'email_campaign', 'קמפיין מייל', 'Email Campaign', ARRAY['מייל', 'ניוזלטר', 'email', 'newsletter']),
('content', 'blog_article', 'מאמר בלוג', 'Blog Article', ARRAY['מאמר', 'בלוג', 'כתבה', 'article', 'blog']),
('code', 'code_review', 'בדיקת קוד', 'Code Review', ARRAY['review', 'בדיקה', 'קוד', 'code']),
('code', 'debugging', 'דיבאגינג', 'Debugging', ARRAY['באג', 'שגיאה', 'bug', 'error', 'fix']),
('code', 'feature_implementation', 'פיתוח פיצר', 'Feature Implementation', ARRAY['פיצר', 'feature', 'implement', 'build']),
('code', 'refactoring', 'ריפקטורינג', 'Refactoring', ARRAY['refactor', 'שיפור', 'optimize', 'clean']),
('analysis', 'data_analysis', 'ניתוח נתונים', 'Data Analysis', ARRAY['נתונים', 'data', 'analytics', 'מספרים', 'דוח']),
('analysis', 'competitor_analysis', 'ניתוח מתחרים', 'Competitor Analysis', ARRAY['מתחרים', 'competitor', 'שוק', 'market']),
('analysis', 'user_research', 'מחקר משתמשים', 'User Research', ARRAY['משתמשים', 'users', 'UX', 'research']),
('planning', 'system_architecture', 'ארכיטקטורת מערכת', 'System Architecture', ARRAY['ארכיטקטורה', 'מבנה', 'architecture', 'system']),
('planning', 'product_strategy', 'אסטרטגיית מוצר', 'Product Strategy', ARRAY['אסטרטגיה', 'strategy', 'תכנון', 'roadmap']),
('planning', 'project_planning', 'תכנון פרויקט', 'Project Planning', ARRAY['פרויקט', 'project', 'timeline', 'plan']);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger function for new module
CREATE OR REPLACE FUNCTION public.handle_new_module()
RETURNS TRIGGER AS $$
BEGIN
  -- Create sidebar item
  INSERT INTO public.sidebar_dynamic_items (module_id, parent_category, path, label, icon, sort_order)
  VALUES (NEW.id, NEW.category, '/modules/' || NEW.slug, NEW.name, NEW.icon, NEW.sort_order);
  
  -- Create default template
  INSERT INTO public.dynamic_module_templates (module_id, name, description, template_type, is_default, parts)
  VALUES (
    NEW.id, 
    'תבנית ברירת מחדל', 
    'תבנית בסיסית למודול ' || NEW.name,
    'general',
    true,
    '[{"title": "שאלה ראשונה", "prompt": "תאר את הצורך שלך"}]'::jsonb
  );
  
  -- Create default limits
  INSERT INTO public.module_usage_limits (limit_type, module_id, daily_requests_limit, monthly_tokens_limit)
  VALUES ('module', NEW.id, 100, 1000000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_module_insert
AFTER INSERT ON public.dynamic_modules
FOR EACH ROW EXECUTE FUNCTION public.handle_new_module();

-- Trigger function for module update
CREATE OR REPLACE FUNCTION public.handle_module_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sidebar_dynamic_items
  SET 
    label = NEW.name,
    icon = NEW.icon,
    path = '/modules/' || NEW.slug,
    parent_category = NEW.category
  WHERE module_id = NEW.id;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_module_update
BEFORE UPDATE ON public.dynamic_modules
FOR EACH ROW EXECUTE FUNCTION public.handle_module_update();

-- Trigger function for module delete (archive sessions)
CREATE OR REPLACE FUNCTION public.handle_module_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dynamic_module_sessions
  SET status = 'archived'
  WHERE module_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_module_delete
BEFORE DELETE ON public.dynamic_modules
FOR EACH ROW EXECUTE FUNCTION public.handle_module_delete();

-- Trigger function for message analytics
CREATE OR REPLACE FUNCTION public.handle_message_analytics()
RETURNS TRIGGER AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT s.*, m.category as module_category, m.ai_model, m.ai_provider
  INTO v_session
  FROM public.dynamic_module_sessions s
  JOIN public.dynamic_modules m ON s.module_id = m.id
  WHERE s.id = NEW.session_id;
  
  IF v_session IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Update session totals
  UPDATE public.dynamic_module_sessions
  SET 
    total_tokens = total_tokens + COALESCE(NEW.tokens_used, 0),
    total_cost = total_cost + COALESCE(NEW.estimated_cost, 0),
    updated_at = NOW()
  WHERE id = NEW.session_id;
  
  -- Insert analytics record
  INSERT INTO public.module_usage_analytics (
    module_id, session_id, message_id, user_id, client_id, contact_id,
    ai_model, ai_provider, input_tokens, output_tokens, total_tokens, estimated_cost,
    task_category, task_type, final_task_type, task_complexity,
    response_time_ms, was_successful, error_message, user_rating
  )
  VALUES (
    v_session.module_id, NEW.session_id, NEW.id, v_session.user_id, 
    v_session.client_id, v_session.contact_id,
    v_session.ai_model, v_session.ai_provider,
    COALESCE(NEW.input_tokens, 0), COALESCE(NEW.output_tokens, 0), 
    COALESCE(NEW.tokens_used, 0), COALESCE(NEW.estimated_cost, 0),
    NEW.task_category, NEW.task_type, 
    COALESCE(NEW.user_corrected_type, NEW.ai_classified_type, NEW.task_type),
    NEW.task_complexity,
    NEW.response_time_ms, COALESCE(NEW.was_successful, true), NEW.error_message, NEW.user_rating
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.dynamic_module_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_message_analytics();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_dynamic_modules_slug ON public.dynamic_modules(slug);
CREATE INDEX idx_dynamic_modules_category ON public.dynamic_modules(category);
CREATE INDEX idx_dynamic_module_sessions_module ON public.dynamic_module_sessions(module_id);
CREATE INDEX idx_dynamic_module_sessions_user ON public.dynamic_module_sessions(user_id);
CREATE INDEX idx_dynamic_module_sessions_client ON public.dynamic_module_sessions(client_id);
CREATE INDEX idx_dynamic_module_messages_session ON public.dynamic_module_messages(session_id);
CREATE INDEX idx_module_usage_analytics_module ON public.module_usage_analytics(module_id);
CREATE INDEX idx_module_usage_analytics_created ON public.module_usage_analytics(created_at);
CREATE INDEX idx_sidebar_dynamic_items_module ON public.sidebar_dynamic_items(module_id);
CREATE INDEX idx_task_type_definitions_category ON public.task_type_definitions(category);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.dynamic_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_module_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_dynamic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_type_definitions ENABLE ROW LEVEL SECURITY;

-- dynamic_modules policies
CREATE POLICY "Users can view active modules" ON public.dynamic_modules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create modules" ON public.dynamic_modules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Module creators can update their modules" ON public.dynamic_modules
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Module creators can delete their modules" ON public.dynamic_modules
  FOR DELETE USING (created_by = auth.uid());

-- dynamic_module_templates policies
CREATE POLICY "Users can view templates" ON public.dynamic_module_templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage templates" ON public.dynamic_module_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- dynamic_module_sessions policies
CREATE POLICY "Users can view their sessions" ON public.dynamic_module_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create sessions" ON public.dynamic_module_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their sessions" ON public.dynamic_module_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- dynamic_module_messages policies
CREATE POLICY "Users can view messages in their sessions" ON public.dynamic_module_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dynamic_module_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions" ON public.dynamic_module_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dynamic_module_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their sessions" ON public.dynamic_module_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.dynamic_module_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- sidebar_dynamic_items policies
CREATE POLICY "Everyone can view visible sidebar items" ON public.sidebar_dynamic_items
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Authenticated users can manage sidebar items" ON public.sidebar_dynamic_items
  FOR ALL USING (auth.uid() IS NOT NULL);

-- module_usage_analytics policies
CREATE POLICY "Users can view their analytics" ON public.module_usage_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON public.module_usage_analytics
  FOR INSERT WITH CHECK (true);

-- module_usage_limits policies
CREATE POLICY "Users can view limits" ON public.module_usage_limits
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage limits" ON public.module_usage_limits
  FOR ALL USING (auth.uid() IS NOT NULL);

-- task_type_definitions policies
CREATE POLICY "Everyone can view task types" ON public.task_type_definitions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage task types" ON public.task_type_definitions
  FOR ALL USING (auth.uid() IS NOT NULL);