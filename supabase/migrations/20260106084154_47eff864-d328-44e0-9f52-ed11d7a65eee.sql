-- שלב 1: תיקון המשתמש הקיים (אליאור נעים)
INSERT INTO public.authorized_emails (email, name, role, is_active, phone)
VALUES ('eliornaim99@gmail.com', 'אליאור נעים', 'basic_client', true, '0502111884')
ON CONFLICT (email) DO UPDATE SET 
  role = 'basic_client',
  is_active = true,
  name = 'אליאור נעים';

-- עדכן את התפקיד שלו
UPDATE public.user_roles 
SET role = 'basic_client' 
WHERE user_id = '059545d7-880b-4858-b103-4636c5974abe';

-- קשר אותו ללקוח
INSERT INTO public.client_users (user_id, client_id)
VALUES ('059545d7-880b-4858-b103-4636c5974abe', '53a6a060-2e94-4b66-9e31-56d216a5c89b')
ON CONFLICT (user_id, client_id) DO NOTHING;

-- שלב 2: יצירת פונקציה לסנכרון גישה לפורטל
CREATE OR REPLACE FUNCTION public.sync_contact_portal_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- כאשר has_portal_access משתנה ל-true ויש אימייל
  IF NEW.has_portal_access = true AND NEW.email IS NOT NULL THEN
    -- הוסף ל-authorized_emails אם לא קיים
    INSERT INTO public.authorized_emails (email, name, role, is_active, phone)
    VALUES (NEW.email, NEW.name, 'basic_client', true, NEW.phone)
    ON CONFLICT (email) DO UPDATE SET 
      is_active = true,
      name = COALESCE(EXCLUDED.name, public.authorized_emails.name);
  END IF;
  
  -- כאשר has_portal_access משתנה ל-false
  IF NEW.has_portal_access = false AND OLD.has_portal_access = true AND NEW.email IS NOT NULL THEN
    -- בדוק אם האימייל קיים כאיש קשר עם גישה בלקוחות אחרים
    IF NOT EXISTS (
      SELECT 1 FROM public.client_contacts 
      WHERE email = NEW.email 
        AND has_portal_access = true 
        AND id != NEW.id
    ) THEN
      -- אם לא - בטל את הגישה
      UPDATE public.authorized_emails 
      SET is_active = false 
      WHERE email = NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- יצירת הטריגר
DROP TRIGGER IF EXISTS trigger_sync_contact_portal_access ON public.client_contacts;
CREATE TRIGGER trigger_sync_contact_portal_access
  AFTER INSERT OR UPDATE OF has_portal_access ON public.client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_contact_portal_access();

-- שלב 3: עדכון handle_new_user לקשר משתמשים חדשים ללקוחות
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  auth_record RECORD;
  contact_record RECORD;
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
    
    -- Check if this email exists as a contact with portal access
    -- and link to the client(s)
    FOR contact_record IN 
      SELECT client_id FROM public.client_contacts 
      WHERE email = new.email AND has_portal_access = true
    LOOP
      INSERT INTO public.client_users (user_id, client_id)
      VALUES (new.id, contact_record.client_id)
      ON CONFLICT (user_id, client_id) DO NOTHING;
    END LOOP;
  ELSE
    -- Not authorized - assign demo role (limited access)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'demo');
  END IF;
  
  RETURN new;
END;
$$;