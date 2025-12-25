
-- Create role enum with all permission levels
CREATE TYPE public.app_role AS ENUM (
  'admin',           -- אדמין - גישה מלאה לכל המערכת
  'manager',         -- מנהל - גישה לכל הלקוחות והצוותים
  'department_head', -- ראש מחלקה - גישה למחלקה שלו ולקוחות המחלקה
  'team_lead',       -- ראש צוות - גישה לצוות שלו ולקוחות הצוות
  'team_member',     -- איש צוות במחלקה - גישה ללקוחות שהוקצו לו
  'client',          -- לקוח - גישה לנתונים שלו בלבד
  'demo'             -- גישת דמו - צפייה בלבד בנתוני דמו
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create client_users table for team-based access
CREATE TABLE public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

-- Enable RLS on client_users
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  -- Default role is team_member
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'team_member');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has role at or above a certain level (FIXED with ANY)
CREATE OR REPLACE FUNCTION public.has_role_level(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(
        CASE 
          WHEN _min_role = 'demo' THEN ARRAY['admin', 'manager', 'department_head', 'team_lead', 'team_member', 'client', 'demo']::app_role[]
          WHEN _min_role = 'client' THEN ARRAY['admin', 'manager', 'department_head', 'team_lead', 'team_member', 'client']::app_role[]
          WHEN _min_role = 'team_member' THEN ARRAY['admin', 'manager', 'department_head', 'team_lead', 'team_member']::app_role[]
          WHEN _min_role = 'team_lead' THEN ARRAY['admin', 'manager', 'department_head', 'team_lead']::app_role[]
          WHEN _min_role = 'department_head' THEN ARRAY['admin', 'manager', 'department_head']::app_role[]
          WHEN _min_role = 'manager' THEN ARRAY['admin', 'manager']::app_role[]
          WHEN _min_role = 'admin' THEN ARRAY['admin']::app_role[]
        END
      )
  )
$$;

-- Function to check if user has access to a specific client
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins and managers have access to all clients
    public.has_role(_user_id, 'admin') OR
    public.has_role(_user_id, 'manager') OR
    -- Others need explicit assignment
    EXISTS (
      SELECT 1
      FROM public.client_users
      WHERE user_id = _user_id
        AND client_id = _client_id
    )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'department_head' THEN 3
      WHEN 'team_lead' THEN 4
      WHEN 'team_member' THEN 5
      WHEN 'client' THEN 6
      WHEN 'demo' THEN 7
    END
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins and managers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role_level(auth.uid(), 'manager'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for client_users
CREATE POLICY "Users can view their own client assignments"
ON public.client_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers and above can view all client assignments"
ON public.client_users FOR SELECT
TO authenticated
USING (public.has_role_level(auth.uid(), 'manager'));

CREATE POLICY "Managers and above can manage client assignments"
ON public.client_users FOR ALL
TO authenticated
USING (public.has_role_level(auth.uid(), 'manager'));

-- CLIENTS table - Drop old policies and create new ones
DROP POLICY IF EXISTS "Allow public read access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public delete access to clients" ON public.clients;

CREATE POLICY "Users can view assigned clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), id));

CREATE POLICY "Team members and above can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Team members and above can update assigned clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.has_client_access(auth.uid(), id) AND public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Managers and above can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.has_role_level(auth.uid(), 'manager'));

-- CAMPAIGNS table
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public insert access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public update access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public delete access to campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns for assigned clients"
ON public.campaigns FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can create campaigns for assigned clients"
ON public.campaigns FOR INSERT
TO authenticated
WITH CHECK (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Team members can update campaigns for assigned clients"
ON public.campaigns FOR UPDATE
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Team leads and above can delete campaigns"
ON public.campaigns FOR DELETE
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_lead'));

-- INTEGRATIONS table (sensitive - tokens!)
DROP POLICY IF EXISTS "Allow public read access to integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow public insert access to integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow public update access to integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow public delete access to integrations" ON public.integrations;

CREATE POLICY "Team leads and above can view integrations for assigned clients"
ON public.integrations FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_lead'));

CREATE POLICY "Managers and above can manage integrations"
ON public.integrations FOR ALL
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'manager'));

-- TASKS table
DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access to tasks" ON public.tasks;

CREATE POLICY "Users can view tasks for assigned clients"
ON public.tasks FOR SELECT
TO authenticated
USING (client_id IS NULL OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Team members can update tasks for assigned clients"
ON public.tasks FOR UPDATE
TO authenticated
USING (client_id IS NULL OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team leads and above can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (public.has_role_level(auth.uid(), 'team_lead'));

-- BRAND_MESSAGES table
DROP POLICY IF EXISTS "Allow public read access to brand_messages" ON public.brand_messages;
DROP POLICY IF EXISTS "Allow public insert access to brand_messages" ON public.brand_messages;
DROP POLICY IF EXISTS "Allow public update access to brand_messages" ON public.brand_messages;

CREATE POLICY "Users can view brand messages for assigned clients"
ON public.brand_messages FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can create brand messages"
ON public.brand_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));

CREATE POLICY "Team members can update brand messages"
ON public.brand_messages FOR UPDATE
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));

-- COMPETITORS table
DROP POLICY IF EXISTS "Allow public read access to competitors" ON public.competitors;
DROP POLICY IF EXISTS "Allow public insert access to competitors" ON public.competitors;
DROP POLICY IF EXISTS "Allow public update access to competitors" ON public.competitors;

CREATE POLICY "Users can view competitors for assigned clients"
ON public.competitors FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage competitors"
ON public.competitors FOR ALL
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));

-- GOALS table
DROP POLICY IF EXISTS "Allow public read access to goals" ON public.goals;
DROP POLICY IF EXISTS "Allow public insert access to goals" ON public.goals;
DROP POLICY IF EXISTS "Allow public update access to goals" ON public.goals;

CREATE POLICY "Users can view goals for assigned clients"
ON public.goals FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team leads and above can manage goals"
ON public.goals FOR ALL
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_lead'));

-- PERSONAS table
DROP POLICY IF EXISTS "Allow public read access to personas" ON public.personas;
DROP POLICY IF EXISTS "Allow public insert access to personas" ON public.personas;
DROP POLICY IF EXISTS "Allow public update access to personas" ON public.personas;

CREATE POLICY "Users can view personas for assigned clients"
ON public.personas FOR SELECT
TO authenticated
USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage personas"
ON public.personas FOR ALL
TO authenticated
USING (public.has_client_access(auth.uid(), client_id) AND public.has_role_level(auth.uid(), 'team_member'));
