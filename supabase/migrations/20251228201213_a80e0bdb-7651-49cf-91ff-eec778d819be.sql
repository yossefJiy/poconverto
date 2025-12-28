-- Create table for authorized emails with their roles
CREATE TABLE public.authorized_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'client',
  name text,
  phone text,
  is_active boolean DEFAULT true,
  invited_at timestamp with time zone,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view authorized emails
CREATE POLICY "Admins can view authorized emails" 
ON public.authorized_emails 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage authorized emails
CREATE POLICY "Admins can manage authorized emails" 
ON public.authorized_emails 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_authorized_emails_updated_at
BEFORE UPDATE ON public.authorized_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the authorized emails
INSERT INTO public.authorized_emails (email, role, name) VALUES
('yossef@jiy.co.il', 'admin', 'יוסף'),
('office@jiy.co.il', 'manager', 'משרד JIY'),
('tdcollection1@gmail.com', 'client', 'TD Collection');

-- Update handle_new_user function to check authorized emails and assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  auth_record RECORD;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  -- Check if email is authorized
  SELECT * INTO auth_record FROM public.authorized_emails 
  WHERE email = new.email AND is_active = true;
  
  IF FOUND THEN
    -- Assign the role from authorized_emails
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, auth_record.role);
    
    -- Update last login
    UPDATE public.authorized_emails 
    SET last_login_at = now() 
    WHERE email = new.email;
  ELSE
    -- Not authorized - assign demo role (limited access)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'demo');
  END IF;
  
  RETURN new;
END;
$$;