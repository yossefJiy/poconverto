-- Content Studio Tables

-- Media Library for storing uploaded assets
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content drafts for work-in-progress content
CREATE TABLE public.content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'post',
  status TEXT NOT NULL DEFAULT 'draft',
  platforms TEXT[] DEFAULT '{}',
  media_ids UUID[] DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI generated content history
CREATE TABLE public.ai_content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  model_used TEXT,
  rating INTEGER,
  used_in_draft_id UUID REFERENCES public.content_drafts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brand assets (logos, fonts, colors)
CREATE TABLE public.brand_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_library
CREATE POLICY "Users can view media for their clients" ON public.media_library
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can insert media for their clients" ON public.media_library
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can update media for their clients" ON public.media_library
  FOR UPDATE USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete media for their clients" ON public.media_library
  FOR DELETE USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

-- RLS Policies for content_drafts
CREATE POLICY "Users can view drafts for their clients" ON public.content_drafts
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can insert drafts for their clients" ON public.content_drafts
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can update drafts for their clients" ON public.content_drafts
  FOR UPDATE USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete drafts for their clients" ON public.content_drafts
  FOR DELETE USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

-- RLS Policies for ai_content_history
CREATE POLICY "Users can view AI history for their clients" ON public.ai_content_history
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can insert AI history for their clients" ON public.ai_content_history
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

-- RLS Policies for brand_assets
CREATE POLICY "Users can view brand assets for their clients" ON public.brand_assets
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can manage brand assets for their clients" ON public.brand_assets
  FOR ALL USING (
    client_id IN (SELECT client_id FROM public.client_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = auth.jwt()->>'email')
  );

-- Indexes
CREATE INDEX idx_media_library_client ON public.media_library(client_id);
CREATE INDEX idx_media_library_folder ON public.media_library(client_id, folder);
CREATE INDEX idx_content_drafts_client ON public.content_drafts(client_id);
CREATE INDEX idx_content_drafts_status ON public.content_drafts(client_id, status);
CREATE INDEX idx_ai_content_history_client ON public.ai_content_history(client_id);
CREATE INDEX idx_brand_assets_client ON public.brand_assets(client_id, asset_type);