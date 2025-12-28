-- Create security audit logs table
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  user_id UUID,
  resource_type TEXT,
  resource_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.security_audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (via service role)
CREATE POLICY "Service role can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- No UPDATE or DELETE policies = no one can modify

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_category TEXT,
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type,
    event_category,
    user_id,
    resource_type,
    resource_id,
    action,
    details
  ) VALUES (
    p_event_type,
    p_event_category,
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_action,
    p_details
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create trigger to log integration access
CREATE OR REPLACE FUNCTION public.log_integration_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'integration_created',
      'integrations',
      auth.uid(),
      'integration',
      NEW.id,
      'create',
      jsonb_build_object('platform', NEW.platform, 'client_id', NEW.client_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log credential changes
    IF OLD.encrypted_credentials IS DISTINCT FROM NEW.encrypted_credentials THEN
      PERFORM public.log_security_event(
        'credentials_updated',
        'integrations',
        auth.uid(),
        'integration',
        NEW.id,
        'update_credentials',
        jsonb_build_object('platform', NEW.platform)
      );
    END IF;
    -- Log connection status changes
    IF OLD.is_connected IS DISTINCT FROM NEW.is_connected THEN
      PERFORM public.log_security_event(
        'connection_status_changed',
        'integrations',
        auth.uid(),
        'integration',
        NEW.id,
        CASE WHEN NEW.is_connected THEN 'connected' ELSE 'disconnected' END,
        jsonb_build_object('platform', NEW.platform)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'integration_deleted',
      'integrations',
      auth.uid(),
      'integration',
      OLD.id,
      'delete',
      jsonb_build_object('platform', OLD.platform, 'client_id', OLD.client_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to integrations table
CREATE TRIGGER audit_integration_changes
AFTER INSERT OR UPDATE OR DELETE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.log_integration_access();

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'role_assigned',
      'authorization',
      auth.uid(),
      'user_role',
      NEW.id,
      'assign',
      jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'role_changed',
      'authorization',
      auth.uid(),
      'user_role',
      NEW.id,
      'update',
      jsonb_build_object('target_user', NEW.user_id, 'old_role', OLD.role, 'new_role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'role_revoked',
      'authorization',
      auth.uid(),
      'user_role',
      OLD.id,
      'revoke',
      jsonb_build_object('target_user', OLD.user_id, 'role', OLD.role)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to user_roles table
CREATE TRIGGER audit_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_changes();