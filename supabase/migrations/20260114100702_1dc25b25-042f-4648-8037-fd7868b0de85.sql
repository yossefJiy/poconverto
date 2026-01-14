-- =====================
-- Fix client archive visibility + permissions (RLS)
-- =====================

-- Replace SELECT policy so managers can see archived clients too
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;

CREATE POLICY "clients_select_policy" ON public.clients
FOR SELECT TO authenticated
USING (
  -- Team managers and above can view all clients (including archived)
  public.has_role_level(auth.uid(), 'team_manager'::public.app_role)
  OR (
    -- Others can only view active clients they have access to
    ((is_active = true) OR (is_active IS NULL))
    AND public.has_client_access(auth.uid(), id)
  )
);

-- Allow team managers and above to update clients (needed for archive/restore)
DROP POLICY IF EXISTS "clients_archive_policy" ON public.clients;

CREATE POLICY "clients_archive_policy" ON public.clients
FOR UPDATE TO authenticated
USING (
  public.has_role_level(auth.uid(), 'team_manager'::public.app_role)
)
WITH CHECK (
  public.has_role_level(auth.uid(), 'team_manager'::public.app_role)
);

-- =====================
-- Client media storage (logos, etc.)
-- =====================

-- Create (or ensure) a public bucket for client media
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-media', 'client-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- RLS policies for storage.objects in this bucket
DROP POLICY IF EXISTS "client_media_read" ON storage.objects;
DROP POLICY IF EXISTS "client_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_media_update" ON storage.objects;
DROP POLICY IF EXISTS "client_media_delete" ON storage.objects;

CREATE POLICY "client_media_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'client-media');

CREATE POLICY "client_media_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'client-media'
  AND public.has_role_level(auth.uid(), 'employee'::public.app_role)
);

CREATE POLICY "client_media_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'client-media'
  AND public.has_role_level(auth.uid(), 'employee'::public.app_role)
)
WITH CHECK (
  bucket_id = 'client-media'
  AND public.has_role_level(auth.uid(), 'employee'::public.app_role)
);

CREATE POLICY "client_media_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'client-media'
  AND public.has_role_level(auth.uid(), 'employee'::public.app_role)
);