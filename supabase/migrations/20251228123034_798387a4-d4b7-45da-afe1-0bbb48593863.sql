-- Migrate existing plaintext credentials to encrypted storage
-- This will encrypt any api_key or access_token stored in the settings JSONB

DO $$
DECLARE
  rec RECORD;
  sensitive_creds JSONB;
  encrypted_data TEXT;
BEGIN
  FOR rec IN 
    SELECT id, settings 
    FROM public.integrations 
    WHERE encrypted_credentials IS NULL 
      AND settings IS NOT NULL
      AND (settings->>'api_key' IS NOT NULL OR settings->>'access_token' IS NOT NULL)
  LOOP
    -- Build the sensitive credentials object
    sensitive_creds := jsonb_build_object(
      'api_key', rec.settings->>'api_key',
      'access_token', rec.settings->>'access_token'
    );
    
    -- Encrypt the sensitive credentials
    encrypted_data := public.encrypt_integration_credentials(sensitive_creds);
    
    -- Update the record: store encrypted credentials and remove sensitive data from settings
    UPDATE public.integrations 
    SET 
      encrypted_credentials = encrypted_data,
      settings = rec.settings - 'api_key' - 'access_token' - 'refresh_token'
    WHERE id = rec.id;
    
    RAISE NOTICE 'Migrated credentials for integration %', rec.id;
  END LOOP;
END $$;

-- Log how many records were migrated
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM public.integrations 
  WHERE encrypted_credentials IS NOT NULL;
  
  RAISE NOTICE 'Total integrations with encrypted credentials: %', migrated_count;
END $$;