-- Create encryption key secret for integration credentials
-- We'll use a symmetric key stored as a secret in the secrets manager

-- Create function to encrypt credentials using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_integration_credentials(credentials JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  encryption_key TEXT;
  credentials_text TEXT;
  encrypted_data BYTEA;
BEGIN
  -- Get the encryption key from environment or use a derived key
  -- In production, this should be set via Supabase secrets
  encryption_key := current_setting('app.encryption_key', true);
  
  -- If no key is set, use a fallback derived key (should be replaced in production)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- Use a hash of the database name as fallback (not ideal but better than plaintext)
    encryption_key := encode(digest(current_database() || 'integration_salt_v1', 'sha256'), 'hex');
  END IF;
  
  -- Convert credentials to text
  credentials_text := credentials::TEXT;
  
  -- Encrypt using pgcrypto with AES-256
  encrypted_data := pgp_sym_encrypt(
    credentials_text,
    encryption_key,
    'cipher-algo=aes256, compress-algo=1'
  );
  
  -- Return as base64
  RETURN encode(encrypted_data, 'base64');
END;
$$;

-- Create function to decrypt credentials
CREATE OR REPLACE FUNCTION public.decrypt_integration_credentials(encrypted_data TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  encryption_key TEXT;
  decrypted_text TEXT;
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Get the encryption key
  encryption_key := current_setting('app.encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := encode(digest(current_database() || 'integration_salt_v1', 'sha256'), 'hex');
  END IF;
  
  -- Decrypt
  BEGIN
    decrypted_text := pgp_sym_decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
  END;
  
  -- Convert back to JSONB
  RETURN decrypted_text::JSONB;
END;
$$;

-- Add encrypted_credentials column to integrations table if not exists
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS encrypted_credentials TEXT;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_integration_credentials(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_integration_credentials(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_integration_credentials(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_integration_credentials(TEXT) TO service_role;

-- Create a view that masks sensitive credentials in settings
CREATE OR REPLACE VIEW public.integrations_secure AS
SELECT 
  id,
  client_id,
  platform,
  external_account_id,
  is_connected,
  last_sync_at,
  created_at,
  updated_at,
  -- Mask sensitive fields in settings, keep only non-sensitive metadata
  jsonb_build_object(
    'connected_at', settings->>'connected_at',
    'last_sync_data', settings->'last_sync_data',
    'features', settings->'connection_data'->'features'
  ) as settings_masked,
  CASE WHEN encrypted_credentials IS NOT NULL THEN true ELSE false END as has_encrypted_credentials
FROM public.integrations;

-- Grant access to the secure view
GRANT SELECT ON public.integrations_secure TO authenticated;