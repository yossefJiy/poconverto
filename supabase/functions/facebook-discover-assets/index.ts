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
    followers_count: number;
    profile_picture_url: string;
  };
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
    fields: 'id,name,category,fan_count,picture{url},instagram_business_account{id,username,followers_count,profile_picture_url}',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      log.error('Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    log.info('Authenticated user:', auth.user.id);

    const body: DiscoverRequest = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access Token נדרש' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all assets in parallel
    const [userInfo, adAccounts, pages] = await Promise.all([
      fetchUserInfo(accessToken),
      fetchAdAccounts(accessToken),
      fetchPages(accessToken),
    ]);

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
        username: page.instagram_business_account!.username,
        followers_count: page.instagram_business_account!.followers_count,
        profile_picture_url: page.instagram_business_account!.profile_picture_url,
        connected_page_id: page.id,
        connected_page_name: page.name,
      }));

    // Process pages
    const processedPages = pages.map(page => ({
      id: page.id,
      name: page.name,
      category: page.category,
      fan_count: page.fan_count,
      picture_url: page.picture?.data?.url,
      has_instagram: !!page.instagram_business_account,
    }));

    const response = {
      user: userInfo,
      adAccounts: processedAdAccounts,
      pages: processedPages,
      instagramAccounts,
      summary: {
        totalAdAccounts: processedAdAccounts.length,
        activeAdAccounts: processedAdAccounts.filter(a => a.account_status === 1).length,
        totalPages: processedPages.length,
        totalInstagramAccounts: instagramAccounts.length,
      },
    };

    log.info(`Discovered: ${processedAdAccounts.length} ad accounts, ${processedPages.length} pages, ${instagramAccounts.length} Instagram accounts`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error discovering assets:', error);
    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
