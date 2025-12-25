-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  platform TEXT NOT NULL,
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  department TEXT,
  assignee TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integrations table for storing connection settings
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  external_account_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- Create personas table for marketing layer
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age_range TEXT,
  occupation TEXT,
  interests TEXT[],
  pain_points TEXT[],
  goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_messages table
CREATE TABLE public.brand_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competitors table
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  unit TEXT,
  period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for now, we'll add auth later)
CREATE POLICY "Allow public read access to clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to clients" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Allow public read access to campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to campaigns" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to campaigns" ON public.campaigns FOR DELETE USING (true);

CREATE POLICY "Allow public read access to tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read access to integrations" ON public.integrations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to integrations" ON public.integrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to integrations" ON public.integrations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to integrations" ON public.integrations FOR DELETE USING (true);

CREATE POLICY "Allow public read access to personas" ON public.personas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to personas" ON public.personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to personas" ON public.personas FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to brand_messages" ON public.brand_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to brand_messages" ON public.brand_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to brand_messages" ON public.brand_messages FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to competitors" ON public.competitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to competitors" ON public.competitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to competitors" ON public.competitors FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to goals" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to goals" ON public.goals FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert TD TAMAR DRORY as initial client
INSERT INTO public.clients (id, name, industry, website, description)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'TD TAMAR DRORY',
  'אופנה',
  'https://tamardrory.com',
  'מותג אופנה ישראלי יוקרתי'
);

-- Insert integrations for TD TAMAR DRORY
INSERT INTO public.integrations (client_id, platform, is_connected)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'meta', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'google', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'shopify', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'analytics', false);

-- Insert Sale of the Year campaign
INSERT INTO public.campaigns (client_id, name, description, status, platform, budget)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sale of the Year', 'קמפיין המכירות השנתי הגדול', 'active', 'meta', 50000),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sale of the Year - Google', 'קמפיין מכירות בגוגל', 'active', 'google', 30000);

-- Insert sample tasks
INSERT INTO public.tasks (client_id, title, description, status, priority, department, assignee, due_date)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'עדכון באנרים לסייל', 'יצירת באנרים חדשים לקמפיין Sale of the Year', 'pending', 'high', 'עיצוב', 'מיכל', CURRENT_DATE + INTERVAL '3 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'כתיבת תוכן לפוסטים', 'הכנת 10 פוסטים לאינסטגרם', 'in_progress', 'medium', 'תוכן', 'דנה', CURRENT_DATE + INTERVAL '5 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'אופטימיזציה לקמפיין מטא', 'בדיקה ושיפור ביצועי הקמפיין', 'pending', 'high', 'מדיה', 'יוסי', CURRENT_DATE + INTERVAL '2 days');