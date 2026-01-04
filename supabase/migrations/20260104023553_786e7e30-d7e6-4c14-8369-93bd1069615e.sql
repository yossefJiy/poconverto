-- Fix has_role function to also check authorized_emails with proper search_path
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
  OR EXISTS (
    SELECT 1
    FROM public.authorized_emails ae
    JOIN auth.users au ON au.email = ae.email
    WHERE au.id = _user_id
      AND ae.role = _role
  )
$$;

-- Fix has_role_level to support both old and new role names with proper search_path
CREATE OR REPLACE FUNCTION public.has_role_level(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM (
      -- Get role from user_roles
      SELECT role FROM public.user_roles WHERE user_id = _user_id
      UNION
      -- Also check authorized_emails
      SELECT ae.role 
      FROM public.authorized_emails ae
      JOIN auth.users au ON au.email = ae.email
      WHERE au.id = _user_id
    ) roles
    WHERE roles.role = ANY(
      CASE 
        -- New role hierarchy (8 roles)
        WHEN _min_role = 'demo' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client', 'basic_client', 'demo']::app_role[]
        WHEN _min_role = 'basic_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client', 'basic_client']::app_role[]
        WHEN _min_role = 'premium_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client']::app_role[]
        WHEN _min_role = 'employee' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee']::app_role[]
        WHEN _min_role = 'team_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager']::app_role[]
        WHEN _min_role = 'agency_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager']::app_role[]
        WHEN _min_role = 'admin' THEN ARRAY['super_admin', 'admin']::app_role[]
        WHEN _min_role = 'super_admin' THEN ARRAY['super_admin']::app_role[]
        -- Legacy role names mapping (for existing RLS policies)
        WHEN _min_role = 'client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client', 'basic_client', 'client']::app_role[]
        WHEN _min_role = 'team_member' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'team_member']::app_role[]
        WHEN _min_role = 'team_lead' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'team_lead']::app_role[]
        WHEN _min_role = 'manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'manager']::app_role[]
        ELSE ARRAY[]::app_role[]
      END
    )
  )
$$;

-- Update has_client_access to use has_role_level for better hierarchy support with proper search_path
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins and admins have access to all clients
    public.has_role_level(_user_id, 'admin'::app_role) OR
    public.has_role(_user_id, 'admin'::app_role) OR
    public.has_role(_user_id, 'manager'::app_role) OR
    public.has_role(_user_id, 'agency_manager'::app_role) OR
    -- Others need explicit assignment
    EXISTS (
      SELECT 1
      FROM public.client_users
      WHERE user_id = _user_id
        AND client_id = _client_id
    )
$$;

-- Also fix get_user_role to check both tables
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM (
    SELECT role FROM public.user_roles WHERE user_id = _user_id
    UNION
    SELECT ae.role FROM public.authorized_emails ae
    JOIN auth.users au ON au.email = ae.email
    WHERE au.id = _user_id
  ) combined_roles
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'agency_manager' THEN 2
      WHEN 'manager' THEN 2
      WHEN 'team_manager' THEN 3
      WHEN 'department_head' THEN 3
      WHEN 'team_lead' THEN 4
      WHEN 'employee' THEN 5
      WHEN 'team_member' THEN 5
      WHEN 'premium_client' THEN 6
      WHEN 'basic_client' THEN 7
      WHEN 'client' THEN 7
      WHEN 'demo' THEN 8
    END
  LIMIT 1
$$;