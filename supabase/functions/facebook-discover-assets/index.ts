import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { createLogger } from "../_shared/utils.ts";

const log = createLogger('Facebook Discover Assets');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACEBOOK_API_VERSION = 'v18.0';

interface DiscoverRequest {
  accessToken: string;
}

interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  amount_spent: string;
  business_name?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  fan_count: number;
  picture?: { data?: { url?: string } };
  instagram_business_account?: {
    id: string;
    username: string;
    name?: string;
    followers_count: number;
    profile_picture_url: string;
  };
}

interface Pixel {
  id: string;
  name: string;
  last_fired_time?: string;
  is_created_by_business?: boolean;
  ad_account_id?: string;
}

interface ProductCatalog {
  id: string;
  name: string;
  product_count?: number;
  ad_account_id?: string;
}

// Get account status label in Hebrew
function getAccountStatusLabel(status: number): { label: string; color: string } {
  const statuses: Record<number, { label: string; color: string }> = {
    1: { label: 'פעיל', color: 'green' },
    2: { label: 'מושבת', color: 'red' },
    3: { label: 'לא מאושר', color: 'orange' },
    7: { label: 'ממתין לסקירה', color: 'yellow' },
    9: { label: 'בסקירה', color: 'yellow' },
    100: { label: 'סגור', color: 'red' },
    101: { label: 'מוגבל', color: 'orange' },
  };
  return statuses[status] || { label: 'לא ידוע', color: 'gray' };
}

// Fetch all ad accounts accessible with this token
async function fetchAdAccounts(accessToken: string): Promise<AdAccount[]> {
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/adaccounts`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,account_id,name,account_status,currency,timezone_name,amount_spent,business{name}',
    limit: '100',
  });

  log.info('Fetching ad accounts...');
  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error fetching ad accounts:', data.error);
    throw new Error(data.error.message || 'שגיאה בשליפת חשבונות מודעות');
  }

  return (data.data || []).map((account: any) => ({
    id: account.id,
    account_id: account.account_id,
    name: account.name,
    account_status: account.account_status,
    currency: account.currency,
    timezone_name: account.timezone_name,
    amount_spent: account.amount_spent,
    business_name: account.business?.name,
  }));
}

// Fetch all pages accessible with this token
async function fetchPages(accessToken: string): Promise<FacebookPage[]> {
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/accounts`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name,category,fan_count,picture{url},instagram_business_account{id,username,name,followers_count,profile_picture_url}',
    limit: '100',
  });

  log.info('Fetching pages...');
  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error fetching pages:', data.error);
    throw new Error(data.error.message || 'שגיאה בשליפת עמודים');
  }

  return data.data || [];
}

// Fetch user info
async function fetchUserInfo(accessToken: string): Promise<{ id: string; name: string }> {
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name',
  });

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error fetching user info:', data.error);
    throw new Error(data.error.message || 'שגיאה בשליפת פרטי משתמש');
  }

  return { id: data.id, name: data.name };
}

// Fetch pixels for an ad account
async function fetchPixels(accessToken: string, adAccountId: string): Promise<Pixel[]> {
  try {
    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${adAccountId}/adspixels`;
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,last_fired_time,is_created_by_business',
      limit: '100',
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      log.info(`No pixels access for ${adAccountId}: ${data.error.message}`);
      return [];
    }

    return (data.data || []).map((pixel: any) => ({
      ...pixel,
      ad_account_id: adAccountId,
    }));
  } catch (error) {
    log.info(`Failed to fetch pixels for ${adAccountId}:`, error);
    return [];
  }
}

// Fetch product catalogs for an ad account
async function fetchProductCatalogs(accessToken: string, adAccountId: string): Promise<ProductCatalog[]> {
  try {
    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${adAccountId}/product_catalogs`;
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,product_count',
      limit: '100',
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      log.info(`No catalogs access for ${adAccountId}: ${data.error.message}`);
      return [];
    }

    return (data.data || []).map((catalog: any) => ({
      ...catalog,
      ad_account_id: adAccountId,
    }));
  } catch (error) {
    log.info(`Failed to fetch catalogs for ${adAccountId}:`, error);
    return [];
  }
}

// Fetch token debug info (includes expiry)
async function fetchTokenDebugInfo(accessToken: string): Promise<{ expires_at?: number; is_valid: boolean } | null> {
  try {
    const url = `https://graph.facebook.com/debug_token`;
    const params = new URLSearchParams({
      input_token: accessToken,
      access_token: accessToken,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error || !data.data) {
      log.info('Token debug not available (may require app token)');
      return null;
    }

    return {
      expires_at: data.data.expires_at,
      is_valid: data.data.is_valid,
    };
  } catch (error) {
    log.info('Token debug failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first - no auth required for this endpoint (verify_jwt = false)
    const body: DiscoverRequest = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access Token נדרש' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info('Starting Facebook asset discovery...');

    // Fetch all basic assets in parallel
    const [userInfo, adAccounts, pages, tokenDebug] = await Promise.all([
      fetchUserInfo(accessToken),
      fetchAdAccounts(accessToken),
      fetchPages(accessToken),
      fetchTokenDebugInfo(accessToken),
    ]);

    log.info(`Found ${adAccounts.length} ad accounts, ${pages.length} pages`);

    // Fetch pixels and catalogs for all ad accounts in parallel
    const allPixels: Pixel[] = [];
    const allCatalogs: ProductCatalog[] = [];

    if (adAccounts.length > 0) {
      // Fetch pixels and catalogs for each ad account (batched for performance)
      const pixelPromises = adAccounts.map(account => fetchPixels(accessToken, account.id));
      const catalogPromises = adAccounts.map(account => fetchProductCatalogs(accessToken, account.id));
      
      const [pixelResults, catalogResults] = await Promise.all([
        Promise.all(pixelPromises),
        Promise.all(catalogPromises),
      ]);

      pixelResults.forEach(pixels => allPixels.push(...pixels));
      catalogResults.forEach(catalogs => allCatalogs.push(...catalogs));
    }

    log.info(`Found ${allPixels.length} pixels, ${allCatalogs.length} catalogs`);

    // Process ad accounts with status labels
    const processedAdAccounts = adAccounts.map(account => ({
      ...account,
      statusInfo: getAccountStatusLabel(account.account_status),
      displayName: account.business_name 
        ? `${account.name} (${account.business_name})`
        : account.name,
    }));

    // Extract Instagram accounts from pages
    const instagramAccounts = pages
      .filter(page => page.instagram_business_account)
      .map(page => ({
        id: page.instagram_business_account!.id,
        username: page.instagram_business_account!.username || '',
        name: page.instagram_business_account!.name || page.name,
        followers_count: page.instagram_business_account!.followers_count || 0,
        profile_picture_url: page.instagram_business_account!.profile_picture_url || '',
        connected_page_id: page.id,
        connected_page_name: page.name,
      }));

    // Process pages with full data
    const processedPages = pages.map(page => ({
      id: page.id,
      name: page.name,
      category: page.category || 'לא מוגדר',
      fan_count: page.fan_count || 0,
      picture_url: page.picture?.data?.url || '',
      has_instagram: !!page.instagram_business_account,
      instagram_id: page.instagram_business_account?.id,
    }));

    // Calculate token expiry date
    let tokenExpiresAt: string | null = null;
    if (tokenDebug?.expires_at && tokenDebug.expires_at > 0) {
      tokenExpiresAt = new Date(tokenDebug.expires_at * 1000).toISOString();
    }

    const response = {
      success: true,
      user: userInfo,
      adAccounts: processedAdAccounts,
      pages: processedPages,
      instagramAccounts,
      pixels: allPixels,
      catalogs: allCatalogs,
      tokenInfo: {
        expires_at: tokenExpiresAt,
        is_valid: tokenDebug?.is_valid ?? true,
      },
      summary: {
        totalAdAccounts: processedAdAccounts.length,
        activeAdAccounts: processedAdAccounts.filter(a => a.account_status === 1).length,
        totalPages: processedPages.length,
        totalInstagramAccounts: instagramAccounts.length,
        totalPixels: allPixels.length,
        totalCatalogs: allCatalogs.length,
      },
    };

    log.info(`Discovery complete: ${processedAdAccounts.length} accounts, ${processedPages.length} pages, ${instagramAccounts.length} IG, ${allPixels.length} pixels, ${allCatalogs.length} catalogs`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error discovering assets:', error);
    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
