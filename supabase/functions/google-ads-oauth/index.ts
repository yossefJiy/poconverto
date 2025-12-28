import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') || '';
const GOOGLE_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '';
const MCC_CUSTOMER_ID = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID') || '';

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token' | 'list_mcc_accounts';
  client_id?: string;
  code?: string;
  redirect_uri?: string;
  integration_id?: string;
}

// Generate Google OAuth URL for user consent
function getAuthUrl(redirectUri: string, state: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/adwords',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Get access token using global refresh token (for MCC account listing)
async function getAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

// List all client accounts under the MCC
async function listMccAccounts(accessToken: string): Promise<Array<{ id: string; name: string; currency: string }>> {
  const cleanMccId = MCC_CUSTOMER_ID.replace(/-/g, '');
  
  console.log('[Google Ads OAuth] Listing accounts under MCC:', cleanMccId);
  
  // Query to get all accessible customer accounts
  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.manager,
      customer_client.status
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'
      AND customer_client.manager = false
  `;
  
  const url = `https://googleads.googleapis.com/v22/customers/${cleanMccId}/googleAds:searchStream`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': GOOGLE_DEVELOPER_TOKEN,
      'Content-Type': 'application/json',
      'login-customer-id': cleanMccId,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Google Ads OAuth] MCC listing error:', response.status, errorText);
    throw new Error(`Failed to list MCC accounts: ${response.status}`);
  }

  const data = await response.json();
  const accounts: Array<{ id: string; name: string; currency: string }> = [];

  if (Array.isArray(data)) {
    for (const chunk of data) {
      if (chunk.results) {
        for (const result of chunk.results) {
          const customerId = result.customerClient?.id;
          const name = result.customerClient?.descriptiveName || `Account ${customerId}`;
          const currency = result.customerClient?.currencyCode || 'ILS';
          
          if (customerId) {
            // Format customer ID with dashes
            const formattedId = customerId.toString().replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            accounts.push({
              id: formattedId,
              name,
              currency,
            });
          }
        }
      }
    }
  }

  console.log('[Google Ads OAuth] Found', accounts.length, 'accounts under MCC');
  return accounts;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  console.log('[Google Ads OAuth] Exchanging authorization code for tokens...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('[Google Ads OAuth] Token exchange error:', data);
    throw new Error(data.error_description || data.error);
  }

  if (!data.refresh_token) {
    console.warn('[Google Ads OAuth] No refresh token received - user may have already authorized');
  }

  console.log('[Google Ads OAuth] Tokens received successfully');
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// Refresh access token using refresh token
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  console.log('[Google Ads OAuth] Refreshing access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('[Google Ads OAuth] Token refresh error:', data);
    throw new Error(data.error_description || data.error);
  }

  console.log('[Google Ads OAuth] Access token refreshed successfully');
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, client_id, code, redirect_uri, integration_id } = await req.json() as OAuthRequest;

    console.log(`[Google Ads OAuth] Action: ${action}`);

    if (action === 'list_mcc_accounts') {
      // List all accounts under the MCC using global refresh token
      const globalRefreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
      
      if (!globalRefreshToken) {
        throw new Error('MCC refresh token not configured');
      }
      
      if (!MCC_CUSTOMER_ID) {
        throw new Error('MCC Customer ID not configured');
      }
      
      const accessToken = await getAccessTokenFromRefreshToken(globalRefreshToken);
      const accounts = await listMccAccounts(accessToken);
      
      return new Response(
        JSON.stringify({ success: true, accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_auth_url') {
      // Generate OAuth URL with state containing client_id
      if (!client_id || !redirect_uri) {
        throw new Error('client_id and redirect_uri are required');
      }

      const state = btoa(JSON.stringify({ client_id }));
      const authUrl = getAuthUrl(redirect_uri, state);

      console.log('[Google Ads OAuth] Generated auth URL for client:', client_id);

      return new Response(
        JSON.stringify({ success: true, auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for tokens
      if (!code || !redirect_uri || !client_id) {
        throw new Error('code, redirect_uri, and client_id are required');
      }

      const tokens = await exchangeCodeForTokens(code, redirect_uri);

      // Encrypt and store the refresh token in the integrations table
      const credentialsToEncrypt = {
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      };

      // Encrypt credentials
      const { data: encryptedData, error: encryptError } = await supabaseClient
        .rpc('encrypt_integration_credentials', { credentials: credentialsToEncrypt });

      if (encryptError) {
        console.error('[Google Ads OAuth] Encryption error:', encryptError);
        throw new Error('Failed to encrypt credentials');
      }

      // Check if integration already exists
      const { data: existingIntegration } = await supabaseClient
        .from('integrations')
        .select('id')
        .eq('client_id', client_id)
        .eq('platform', 'google_ads')
        .single();

      if (existingIntegration) {
        // Update existing integration
        const { error: updateError } = await supabaseClient
          .from('integrations')
          .update({
            encrypted_credentials: encryptedData,
            is_connected: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingIntegration.id);

        if (updateError) {
          console.error('[Google Ads OAuth] Update error:', updateError);
          throw new Error('Failed to update integration');
        }

        console.log('[Google Ads OAuth] Updated existing integration:', existingIntegration.id);
      } else {
        // Create new integration
        const { error: insertError } = await supabaseClient
          .from('integrations')
          .insert({
            client_id,
            platform: 'google_ads',
            encrypted_credentials: encryptedData,
            is_connected: true,
            settings: {
              connected_via: 'oauth',
              connected_at: new Date().toISOString(),
            },
          });

        if (insertError) {
          console.error('[Google Ads OAuth] Insert error:', insertError);
          throw new Error('Failed to create integration');
        }

        console.log('[Google Ads OAuth] Created new integration for client:', client_id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'החיבור ל-Google Ads הושלם בהצלחה!',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh_token') {
      // Refresh access token for an integration
      if (!integration_id) {
        throw new Error('integration_id is required');
      }

      // Get the integration
      const { data: integration, error: fetchError } = await supabaseClient
        .from('integrations')
        .select('encrypted_credentials')
        .eq('id', integration_id)
        .single();

      if (fetchError || !integration) {
        throw new Error('Integration not found');
      }

      // Decrypt credentials
      const { data: decryptedData, error: decryptError } = await supabaseClient
        .rpc('decrypt_integration_credentials', { encrypted_data: integration.encrypted_credentials });

      if (decryptError || !decryptedData) {
        throw new Error('Failed to decrypt credentials');
      }

      const credentials = decryptedData as { refresh_token: string };
      
      if (!credentials.refresh_token) {
        throw new Error('No refresh token found');
      }

      // Refresh the access token
      const newTokens = await refreshAccessToken(credentials.refresh_token);

      // Update stored credentials
      const updatedCredentials = {
        ...credentials,
        access_token: newTokens.access_token,
        token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      };

      const { data: newEncryptedData, error: reEncryptError } = await supabaseClient
        .rpc('encrypt_integration_credentials', { credentials: updatedCredentials });

      if (reEncryptError) {
        throw new Error('Failed to re-encrypt credentials');
      }

      await supabaseClient
        .from('integrations')
        .update({
          encrypted_credentials: newEncryptedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Google Ads OAuth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
