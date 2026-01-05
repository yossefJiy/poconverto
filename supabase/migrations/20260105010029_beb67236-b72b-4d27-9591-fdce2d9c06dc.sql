-- Phase 3: Social Media Management Tables

-- Social Accounts - Connected social media accounts
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  account_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, platform, account_id)
);

-- Social Posts - Scheduled and published posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  hashtags TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  error_message TEXT,
  engagement JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "reach": 0}',
  external_post_id TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Calendar - Planning calendar entries
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  date DATE NOT NULL,
  time TIME,
  platforms TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('idea', 'planned', 'in_progress', 'ready', 'published')),
  color TEXT DEFAULT '#3B82F6',
  post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  assigned_to UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Templates - Reusable post templates
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  platforms TEXT[] DEFAULT '{}',
  variables JSONB DEFAULT '[]',
  media_urls JSONB DEFAULT '[]',
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hashtag Groups - Saved hashtag collections
CREATE TABLE IF NOT EXISTS public.hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can view social accounts for accessible clients"
  ON public.social_accounts FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Managers can manage social accounts"
  ON public.social_accounts FOR ALL
  USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

-- RLS Policies for social_posts
CREATE POLICY "Users can view posts for accessible clients"
  ON public.social_posts FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Employees can create posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (public.has_role_level(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees can update their posts"
  ON public.social_posts FOR UPDATE
  USING (
    public.has_role_level(auth.uid(), 'team_manager'::app_role) OR
    created_by = auth.uid()
  );

CREATE POLICY "Managers can delete posts"
  ON public.social_posts FOR DELETE
  USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

-- RLS Policies for content_calendar
CREATE POLICY "Users can view calendar for accessible clients"
  ON public.content_calendar FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Employees can manage calendar entries"
  ON public.content_calendar FOR ALL
  USING (public.has_role_level(auth.uid(), 'employee'::app_role));

-- RLS Policies for content_templates
CREATE POLICY "Users can view templates"
  ON public.content_templates FOR SELECT
  USING (
    is_global = true OR
    client_id IS NULL OR
    public.has_client_access(auth.uid(), client_id)
  );

CREATE POLICY "Managers can manage templates"
  ON public.content_templates FOR ALL
  USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

-- RLS Policies for hashtag_groups
CREATE POLICY "Users can view hashtag groups"
  ON public.hashtag_groups FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Employees can manage hashtag groups"
  ON public.hashtag_groups FOR ALL
  USING (public.has_role_level(auth.uid(), 'employee'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hashtag_groups_updated_at
  BEFORE UPDATE ON public.hashtag_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default global templates
INSERT INTO public.content_templates (name, description, content, category, platforms, is_global, variables) VALUES
('הודעת מבצע', 'תבנית להודעות מבצע ומכירות', '🔥 מבצע מיוחד! 🔥

{product_name} במחיר מדהים של {price} בלבד!

⏰ המבצע מסתיים ב-{end_date}
🛒 לרכישה: {link}

#מבצע #הנחה #קניות', 'promotion', ARRAY['facebook', 'instagram'], true, '[{"name": "product_name", "label": "שם המוצר"}, {"name": "price", "label": "מחיר"}, {"name": "end_date", "label": "תאריך סיום"}, {"name": "link", "label": "קישור"}]'),

('טיפ מקצועי', 'תבנית לשיתוף טיפים וידע', '💡 טיפ היום:

{tip_title}

{tip_content}

💬 שתפו אותנו - מה הטיפ הכי טוב שקיבלתם?

#טיפים #ידע #למידה', 'educational', ARRAY['facebook', 'instagram', 'linkedin'], true, '[{"name": "tip_title", "label": "כותרת הטיפ"}, {"name": "tip_content", "label": "תוכן הטיפ"}]'),

('הכרזה', 'תבנית להכרזות והודעות חשובות', '📢 הודעה חשובה!

{announcement}

למידע נוסף: {link}

#חדשות #עדכון', 'announcement', ARRAY['facebook', 'instagram', 'linkedin', 'twitter'], true, '[{"name": "announcement", "label": "תוכן ההכרזה"}, {"name": "link", "label": "קישור"}]')
ON CONFLICT DO NOTHING;