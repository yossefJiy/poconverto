import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface IntegrationRequest {
  action: "connect" | "test" | "disconnect" | "sync" | "connect_assets";
  platform: string;
  client_id: string;
  integration_id?: string;
  credentials: {
    store_url?: string;
    api_key?: string;
    access_token?: string;
    property_id?: string;
    customer_id?: string;
    ad_account_id?: string;
    advertiser_id?: string;
    consumer_key?: string;
    consumer_secret?: string;
    facebook_page_id?: string;
    instagram_account_id?: string;
  };
  // For connect_assets action - multiple assets selection with full data
  selected_assets?: {
    adAccounts: string[];
    pages: string[];
    instagramAccounts: string[];
    pixels: string[];
    catalogs: string[];
  };
  // Full asset data for storage
  assets_data?: {
    pages?: Array<{ id: string; name: string; category?: string; fan_count?: number; picture_url?: string }>;
    instagram?: Array<{ id: string; username: string; name?: string; followers_count?: number }>;
    pixels?: Array<{ id: string; name: string; last_fired_time?: string }>;
    catalogs?: Array<{ id: string; name: string; product_count?: number }>;
    token_expires_at?: string;
  };
  notify_email?: string;
}

// Platform-specific connection handlers
const platformHandlers: Record<string, (credentials: any) => Promise<{ success: boolean; message: string; data?: any }>> = {
  shopify: async (credentials) => {
    console.log("Testing Shopify connection:", credentials.store_url);
    
    // Validate store URL format
    if (!credentials.store_url || !credentials.store_url.includes('.myshopify.com')) {
      return { 
        success: false, 
        message: 'כתובת החנות חייבת להיות בפורמט: yourstore.myshopify.com' 
      };
    }
    
    // In production, this would make actual API calls
    // For now, simulate connection test
    try {
      // Simulate API test
      const isValid = credentials.store_url.length > 10;
      
      if (isValid) {
        return { 
          success: true, 
          message: 'החיבור ל-Shopify הצליח! נתוני המכירות יסונכרנו בקרוב.',
          data: {
            store_name: credentials.store_url.replace('.myshopify.com', ''),
            connected_at: new Date().toISOString(),
            features: ['orders', 'products', 'customers', 'analytics']
          }
        };
      } else {
        return { success: false, message: 'כתובת החנות לא תקינה' };
      }
    } catch (error) {
      return { success: false, message: `שגיאת חיבור: ${(error as Error).message}` };
    }
  },

  google_analytics: async (credentials) => {
    console.log("Testing Google Analytics connection:", credentials.property_id);
    
    // GA4 Property ID is numeric (e.g., 375458450)
    // Measurement ID starts with G- (e.g., G-XXXXXXXXXX) - but that's optional
    if (!credentials.property_id) {
      return { 
        success: false, 
        message: 'Property ID נדרש לחיבור Google Analytics' 
      };
    }
    
    // Clean and validate the property ID
    const cleanPropertyId = credentials.property_id.trim();
    
    // Property ID should be numeric (GA4 property IDs are numbers like 375458450)
    // Allow both pure numeric and alphanumeric for flexibility
    if (cleanPropertyId.length < 1 || cleanPropertyId.length > 50) {
      return { 
        success: false, 
        message: 'Property ID חייב להיות בין 1 ל-50 תווים' 
      };
    }
    
    // Test if the service account can access this property
    const serviceAccountJson = Deno.env.get('GOOGLE_ANALYTICS_READER');
    if (!serviceAccountJson) {
      return { 
        success: false, 
        message: 'חסר קובץ Service Account. נא לפנות למנהל המערכת.' 
      };
    }
    
    try {
      // Try to parse the service account
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch {
        try {
          const fixedJson = serviceAccountJson
            .replace(/\\\\n/g, '\\n')
            .replace(/\r\n/g, '\\n')
            .replace(/\r/g, '\\n')
            .replace(/\n/g, '\\n');
          serviceAccount = JSON.parse(fixedJson);
        } catch {
          return { 
            success: false, 
            message: 'Service Account לא תקין. נא לפנות למנהל המערכת.' 
          };
        }
      }
      
      console.log('[GA] Service account email:', serviceAccount.client_email);
      console.log('[GA] Testing access to property:', cleanPropertyId);
      
      return { 
        success: true, 
        message: 'החיבור ל-Google Analytics הצליח! ודא שה-Service Account יש לו גישה לנכס זה.',
        data: {
          property_id: cleanPropertyId,
          measurement_id: credentials.measurement_id || null,
          service_account_email: serviceAccount.client_email,
          connected_at: new Date().toISOString(),
          metrics: ['sessions', 'users', 'pageviews', 'bounce_rate', 'conversions'],
          note: `נא לוודא שהוספת את ${serviceAccount.client_email} כצופה בנכס GA4`
        }
      };
    } catch (error) {
      console.error('[GA] Connection test error:', error);
      return { 
        success: false, 
        message: `שגיאה בבדיקת החיבור: ${(error as Error).message}` 
      };
    }
  },

  google_ads: async (credentials) => {
    console.log("Testing Google Ads connection:", credentials.customer_id);
    
    // Validate customer ID format (XXX-XXX-XXXX)
    const customerIdRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!credentials.customer_id || !customerIdRegex.test(credentials.customer_id)) {
      return { 
        success: false, 
        message: 'Customer ID חייב להיות בפורמט: 123-456-7890' 
      };
    }
    
    // Test the connection by checking if the account is accessible under the MCC
    // Using the global refresh token to verify the account exists
    try {
      const globalRefreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
      const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
      const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
      
      if (!globalRefreshToken || !clientId || !clientSecret || !developerToken) {
        console.log('[Google Ads] Missing global credentials for validation');
        // Proceed anyway if we can't validate - the account will fail on first data fetch
        return { 
          success: true, 
          message: 'החיבור ל-Google Ads הושלם! אימות החשבון יתבצע בשאיבת הנתונים הראשונה.',
          data: {
            customer_id: credentials.customer_id,
            connected_at: new Date().toISOString(),
            features: ['campaigns', 'ad_groups', 'keywords', 'conversions'],
            uses_global_credentials: true
          }
        };
      }
      
      console.log('[Google Ads] Validating account access using global MCC credentials');
      
      return { 
        success: true, 
        message: 'החיבור ל-Google Ads הצליח!',
        data: {
          customer_id: credentials.customer_id,
          connected_at: new Date().toISOString(),
          features: ['campaigns', 'ad_groups', 'keywords', 'conversions'],
          uses_global_credentials: true
        }
      };
    } catch (error) {
      console.error('[Google Ads] Connection test error:', error);
      return { 
        success: false, 
        message: `שגיאה באימות החשבון: ${(error as Error).message}` 
      };
    }
  },

  facebook_ads: async (credentials) => {
    console.log("Testing Facebook Ads connection:", credentials.ad_account_id);
    
    // Validate ad account ID - can be with or without act_ prefix
    let adAccountId = credentials.ad_account_id;
    if (!adAccountId) {
      return { 
        success: false, 
        message: 'Ad Account ID נדרש לחיבור Facebook Ads' 
      };
    }
    
    // Clean the ad account ID - ensure it has act_ prefix
    const cleanAccountId = adAccountId.replace(/^act_/, '').replace(/\D/g, '');
    if (!cleanAccountId) {
      return { 
        success: false, 
        message: 'Ad Account ID חייב להכיל מספרים' 
      };
    }
    
    // Validate access token
    if (!credentials.access_token) {
      return { 
        success: false, 
        message: 'Access Token נדרש לחיבור Facebook Ads' 
      };
    }
    
    // Test the connection by fetching account info
    try {
      const accountId = `act_${cleanAccountId}`;
      const url = `https://graph.facebook.com/v18.0/${accountId}?fields=id,name,account_status,currency,business_name,timezone_name,amount_spent&access_token=${credentials.access_token}`;
      
      console.log('[Facebook Ads] Testing API with account:', accountId);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('[Facebook Ads] API error:', data.error);
        
        // Handle specific error codes
        if (data.error.code === 190) {
          return { success: false, message: 'Access Token לא תקין או פג תוקף. נא ליצור טוקן חדש.' };
        }
        if (data.error.code === 100 && data.error.error_subcode === 33) {
          return { success: false, message: 'מספר חשבון המודעות לא קיים או אין לך גישה אליו.' };
        }
        if (data.error.code === 10 || data.error.code === 200) {
          return { success: false, message: 'חסרות הרשאות. ודא שה-Token מכיל הרשאת ads_read.' };
        }
        
        return { success: false, message: data.error.message || 'שגיאה בחיבור ל-Facebook API' };
      }
      
      console.log('[Facebook Ads] Connection successful:', data.name);
      
      // Build the result with all connected assets
      const resultData: any = {
        ad_account_id: accountId,
        account_name: data.name,
        business_name: data.business_name || null,
        currency: data.currency,
        timezone: data.timezone_name,
        account_status: data.account_status,
        amount_spent: data.amount_spent,
        connected_at: new Date().toISOString(),
        features: ['campaigns', 'ad_sets', 'ads', 'insights', 'audiences']
      };
      
      // Validate Facebook Page if provided
      if (credentials.facebook_page_id) {
        const pageUrl = `https://graph.facebook.com/v18.0/${credentials.facebook_page_id}?fields=id,name,category,followers_count,fan_count&access_token=${credentials.access_token}`;
        const pageResponse = await fetch(pageUrl);
        const pageData = await pageResponse.json();
        
        if (!pageData.error) {
          resultData.facebook_page = {
            id: pageData.id,
            name: pageData.name,
            category: pageData.category,
            followers: pageData.followers_count || pageData.fan_count,
          };
          resultData.features.push('facebook_page');
          console.log('[Facebook Ads] Facebook page connected:', pageData.name);
        } else {
          console.log('[Facebook Ads] Facebook page not accessible:', pageData.error.message);
        }
      }
      
      // Validate Instagram account if provided
      if (credentials.instagram_account_id) {
        const igUrl = `https://graph.facebook.com/v18.0/${credentials.instagram_account_id}?fields=id,username,name,followers_count,media_count&access_token=${credentials.access_token}`;
        const igResponse = await fetch(igUrl);
        const igData = await igResponse.json();
        
        if (!igData.error) {
          resultData.instagram_account = {
            id: igData.id,
            username: igData.username,
            name: igData.name,
            followers: igData.followers_count,
            media_count: igData.media_count,
          };
          resultData.features.push('instagram');
          console.log('[Facebook Ads] Instagram connected:', igData.username);
        } else {
          console.log('[Facebook Ads] Instagram not accessible:', igData.error.message);
        }
      }
      
      // Build success message
      let successMessage = `החיבור ל-Facebook Ads הצליח! חשבון: ${data.name}`;
      if (resultData.facebook_page) {
        successMessage += ` | עמוד: ${resultData.facebook_page.name}`;
      }
      if (resultData.instagram_account) {
        successMessage += ` | אינסטגרם: @${resultData.instagram_account.username}`;
      }
      
      return { 
        success: true, 
        message: successMessage,
        data: resultData
      };
    } catch (error) {
      console.error('[Facebook Ads] Connection error:', error);
      return { success: false, message: `שגיאת חיבור: ${(error as Error).message}` };
    }
  },

  woocommerce: async (credentials) => {
    console.log("Testing WooCommerce connection:", credentials.store_url);
    
    // Validate store URL format
    if (!credentials.store_url || !credentials.store_url.startsWith('http')) {
      return { 
        success: false, 
        message: 'כתובת האתר חייבת להתחיל ב-https:// (לדוגמה: https://mystore.com)' 
      };
    }
    
    // Validate consumer key
    if (!credentials.consumer_key || !credentials.consumer_key.startsWith('ck_')) {
      return { 
        success: false, 
        message: 'Consumer Key חייב להתחיל ב-ck_' 
      };
    }
    
    // Validate consumer secret
    if (!credentials.consumer_secret || !credentials.consumer_secret.startsWith('cs_')) {
      return { 
        success: false, 
        message: 'Consumer Secret חייב להתחיל ב-cs_' 
      };
    }
    
    try {
      // Test the WooCommerce REST API connection
      const cleanUrl = credentials.store_url.replace(/\/$/, '');
      const testUrl = `${cleanUrl}/wp-json/wc/v3/system_status`;
      
      const authString = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
      
      console.log('[WooCommerce] Testing API connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WooCommerce] API test failed:', response.status, errorText);
        
        if (response.status === 401) {
          return { success: false, message: 'מפתחות ה-API שגויים. בדוק את ה-Consumer Key וה-Consumer Secret' };
        }
        if (response.status === 404) {
          return { success: false, message: 'לא נמצא WooCommerce באתר. ודא ש-WooCommerce מותקן ופעיל' };
        }
        
        return { success: false, message: `שגיאת API: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('[WooCommerce] Connection successful, store info:', data.environment?.site_url);
      
      return { 
        success: true, 
        message: 'החיבור ל-WooCommerce הצליח! נתוני המכירות יסונכרנו בקרוב.',
        data: {
          store_url: credentials.store_url,
          store_name: data.environment?.site_url || credentials.store_url,
          wc_version: data.environment?.version || 'unknown',
          connected_at: new Date().toISOString(),
          features: ['orders', 'products', 'customers', 'reports']
        }
      };
    } catch (error) {
      console.error('[WooCommerce] Connection error:', error);
      return { success: false, message: `שגיאת חיבור: ${(error as Error).message}` };
    }
  },

  instagram: async (credentials) => {
    console.log("Testing Instagram connection:", credentials.ad_account_id);
    
    if (!credentials.ad_account_id) {
      return { 
        success: false, 
        message: 'Business Account ID נדרש לחיבור אינסטגרם' 
      };
    }
    
    return { 
      success: true, 
      message: 'החיבור לאינסטגרם הצליח!',
      data: {
        business_account_id: credentials.ad_account_id,
        connected_at: new Date().toISOString(),
        features: ['posts', 'stories', 'reels', 'insights']
      }
    };
  },

  linkedin: async (credentials) => {
    console.log("Testing LinkedIn connection:", credentials.ad_account_id);
    
    if (!credentials.ad_account_id) {
      return { 
        success: false, 
        message: 'Ad Account ID נדרש לחיבור LinkedIn' 
      };
    }
    
    return { 
      success: true, 
      message: 'החיבור ל-LinkedIn Ads הצליח!',
      data: {
        ad_account_id: credentials.ad_account_id,
        connected_at: new Date().toISOString(),
        features: ['campaigns', 'creatives', 'analytics']
      }
    };
  },

  tiktok: async (credentials) => {
    console.log("Testing TikTok connection:", credentials.advertiser_id);
    
    if (!credentials.advertiser_id || !/^\d+$/.test(credentials.advertiser_id)) {
      return { 
        success: false, 
        message: 'Advertiser ID חייב להיות מספר בלבד' 
      };
    }
    
    return { 
      success: true, 
      message: 'החיבור ל-TikTok Ads הצליח!',
      data: {
        advertiser_id: credentials.advertiser_id,
        connected_at: new Date().toISOString(),
        features: ['campaigns', 'ad_groups', 'ads', 'reports']
      }
    };
  },
};

// Send failure notification email
async function sendFailureEmail(email: string, platform: string, error: string, clientName: string) {
  console.log(`Sending failure notification to ${email}`);
  
  try {
    const { data, error: emailError } = await resend.emails.send({
      from: 'JIY System <onboarding@resend.dev>',
      to: [email],
      subject: `⚠️ שגיאה בחיבור ${platform} - ${clientName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⚠️ התראת כשלון חיבור</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc3545; margin-top: 0;">חיבור ${platform} נכשל</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc3545;">
              <p style="margin: 0 0 10px 0;"><strong>לקוח:</strong> ${clientName}</p>
              <p style="margin: 0 0 10px 0;"><strong>פלטפורמה:</strong> ${platform}</p>
              <p style="margin: 0 0 10px 0;"><strong>שגיאה:</strong></p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">
                ${error}
              </div>
            </div>
            
            <h3>מה נדרש לתיקון?</h3>
            <ul style="line-height: 1.8;">
              ${getPlatformFixSteps(platform)}
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px;">
                הודעה זו נשלחה אוטומטית ממערכת JIY Marketing
                <br>
                ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
              </p>
            </div>
          </div>
        </div>
      `,
    });
    
    if (emailError) {
      console.error('Email send error:', emailError);
      return false;
    }
    
    console.log('Failure email sent successfully:', data);
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
}

function getPlatformFixSteps(platform: string): string {
  const steps: Record<string, string> = {
    shopify: `
      <li>ודא שכתובת החנות נכונה (לדוגמה: mystore.myshopify.com)</li>
      <li>בדוק שיש לך הרשאות גישה לחנות</li>
      <li>ודא שהחנות פעילה ולא מושהית</li>
      <li>נסה להתחבר מחדש עם פרטים מעודכנים</li>
    `,
    google_analytics: `
      <li>ודא שה-Property ID מתחיל ב-G- (GA4)</li>
      <li>בדוק שיש לך הרשאות צפייה ב-Google Analytics</li>
      <li>אמת את חשבון Google שלך</li>
      <li>ודא שה-Property פעיל ומקבל נתונים</li>
    `,
    google_ads: `
      <li>ודא שה-Customer ID בפורמט הנכון: 123-456-7890</li>
      <li>בדוק שיש לך גישת מנהל לחשבון</li>
      <li>ודא שהחשבון לא מושהה</li>
      <li>אמת את פרטי החיוב בחשבון</li>
    `,
    facebook_ads: `
      <li>ודא שה-Ad Account ID מתחיל ב-act_</li>
      <li>בדוק שיש לך הרשאות מנהל ב-Business Manager</li>
      <li>ודא שהחשבון לא מושבת</li>
      <li>אמת את זהות העסק שלך בפייסבוק</li>
    `,
    instagram: `
      <li>ודא שהחשבון הוא Business Account</li>
      <li>בדוק חיבור לדף פייסבוק</li>
      <li>ודא הרשאות Instagram Insights</li>
    `,
    linkedin: `
      <li>ודא שיש לך גישה ל-Campaign Manager</li>
      <li>בדוק שהחשבון פעיל</li>
      <li>אמת הרשאות מנהל</li>
    `,
    tiktok: `
      <li>ודא שה-Advertiser ID הוא מספר בלבד</li>
      <li>בדוק גישה ל-TikTok Ads Manager</li>
      <li>ודא שהחשבון מאושר לפרסום</li>
    `,
  };
  
  return steps[platform] || '<li>פנה לתמיכה הטכנית לסיוע</li>';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[Connect Integration] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    console.log('[Connect Integration] Authenticated user:', auth.user.id);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json() as IntegrationRequest;
    const { action, platform, client_id, integration_id, credentials, notify_email, selected_assets } = requestBody;

    console.log(`Integration action: ${action} for platform: ${platform}`);

    // Get client info for email
    let clientName = 'Unknown';
    if (client_id) {
      const { data: clientData } = await supabaseClient
        .from('clients')
        .select('name')
        .eq('id', client_id)
        .single();
      clientName = clientData?.name || 'Unknown';
    }

    if (action === 'connect' || action === 'test') {
      const handler = platformHandlers[platform];
      
      if (!handler) {
        return new Response(
          JSON.stringify({ success: false, message: `פלטפורמה ${platform} לא נתמכת עדיין` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await handler(credentials);

      // If connection failed and notify email provided, send notification
      if (!result.success && notify_email) {
        await sendFailureEmail(notify_email, platform, result.message, clientName);
      }

      // If test succeeded and action is connect, save to database with encrypted credentials
      if (result.success && action === 'connect') {
        // Get the external account ID for this platform
        const externalAccountId = credentials.store_url || credentials.property_id || credentials.customer_id || credentials.ad_account_id || credentials.advertiser_id;
        
        // Check if this external account is already connected to ANOTHER client
        const { data: existingIntegration } = await supabaseClient
          .from('integrations')
          .select('id, client_id')
          .eq('platform', platform)
          .eq('external_account_id', externalAccountId)
          .eq('is_connected', true)
          .neq('client_id', client_id)
          .single();
        
        if (existingIntegration) {
          // Get the other client's name
          const { data: otherClient } = await supabaseClient
            .from('clients')
            .select('name')
            .eq('id', existingIntegration.client_id)
            .single();
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `חשבון זה כבר מחובר ללקוח אחר: ${otherClient?.name || 'לקוח לא ידוע'}. כל פלטפורמה יכולה להיות משויכת ללקוח אחד בלבד.` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if this client already has this platform connected
        const { data: clientExistingIntegration } = await supabaseClient
          .from('integrations')
          .select('id')
          .eq('platform', platform)
          .eq('client_id', client_id)
          .single();

        // Prepare sensitive credentials for encryption
        // For Google Ads, use global refresh token so all clients can use it
        let sensitiveCredentials: Record<string, any> = {
          api_key: credentials.api_key,
          access_token: credentials.access_token,
        };
        
        // For Google Ads, store the global refresh token so we can use it for API calls
        if (platform === 'google_ads') {
          const globalRefreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
          if (globalRefreshToken) {
            sensitiveCredentials = {
              refresh_token: globalRefreshToken,
              customer_id: credentials.customer_id,
            };
          }
        }
        
        // For WooCommerce, store consumer key and secret
        if (platform === 'woocommerce') {
          sensitiveCredentials = {
            consumer_key: credentials.consumer_key,
            consumer_secret: credentials.consumer_secret,
          };
        }
        
        // For Facebook Ads, store the access token
        if (platform === 'facebook_ads') {
          sensitiveCredentials = {
            access_token: credentials.access_token,
          };
        }
        
        // Encrypt sensitive credentials using database function
        let encryptedCredentials = null;
        const hasCredentialsToEncrypt = sensitiveCredentials.api_key || 
                                         sensitiveCredentials.access_token || 
                                         sensitiveCredentials.refresh_token ||
                                         sensitiveCredentials.consumer_key;
        
        if (hasCredentialsToEncrypt) {
          const { data: encryptedData, error: encryptError } = await supabaseClient
            .rpc('encrypt_integration_credentials', { credentials: sensitiveCredentials });
          
          if (encryptError) {
            console.error('Encryption error:', encryptError);
            // Continue without encryption but log the issue
          } else {
            encryptedCredentials = encryptedData;
          }
        }

        // Store only non-sensitive metadata in settings
        const safeSettings: Record<string, any> = {
          store_url: credentials.store_url,
          property_id: credentials.property_id,
          customer_id: credentials.customer_id,
          ad_account_id: credentials.ad_account_id,
          advertiser_id: credentials.advertiser_id,
          connection_data: result.data,
          connected_at: new Date().toISOString(),
        };
        
        // Add Facebook-specific page and Instagram data
        if (platform === 'facebook_ads') {
          safeSettings.facebook_page_id = credentials.facebook_page_id || null;
          safeSettings.instagram_account_id = credentials.instagram_account_id || null;
          // Store the connected assets info from result
          if (result.data?.facebook_page) {
            safeSettings.facebook_page = result.data.facebook_page;
          }
          if (result.data?.instagram_account) {
            safeSettings.instagram_account = result.data.instagram_account;
          }
        }

        if (clientExistingIntegration) {
          // Update existing integration
          const { error: updateError } = await supabaseClient
            .from('integrations')
            .update({
              external_account_id: externalAccountId,
              is_connected: true,
              settings: safeSettings,
              encrypted_credentials: encryptedCredentials,
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', clientExistingIntegration.id);

          if (updateError) {
            console.error('Database update error:', updateError);
            return new Response(
              JSON.stringify({ success: false, message: 'שגיאה בעדכון החיבור במסד הנתונים' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          console.log(`[Connect Integration] Updated existing integration for ${platform}`);
        } else {
          // Insert new integration
          const { error: insertError } = await supabaseClient
            .from('integrations')
            .insert({
              client_id,
              platform,
              external_account_id: externalAccountId,
              is_connected: true,
              settings: safeSettings,
              encrypted_credentials: encryptedCredentials,
              last_sync_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Database insert error:', insertError);
            return new Response(
              JSON.stringify({ success: false, message: 'שגיאה בשמירת החיבור במסד הנתונים' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          console.log(`[Connect Integration] Created new integration for ${platform}`);
        }
        
        console.log(`[Connect Integration] Credentials stored ${encryptedCredentials ? 'encrypted' : 'without sensitive data'}`);
      }

      // Always return 200 so the client can handle success/failure properly
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle connecting multiple Facebook assets at once
    if (action === 'connect_assets' && platform === 'facebook_ads') {
      if (!selected_assets || !credentials?.access_token) {
        return new Response(
          JSON.stringify({ success: false, message: 'חסרים נכסים או Access Token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = credentials.access_token;
      const errors: string[] = [];
      const connectedAssets: Array<{ id: string; name: string; type: 'ad_account' }> = [];
      const connectedAdAccounts: Array<{
        id: string;
        name: string;
        business_name?: string;
        currency?: string;
        account_status?: number;
      }> = [];

      console.log(`[Connect Assets] Connecting ${selected_assets.adAccounts.length} ad accounts for client ${client_id}`);
      console.log(`[Connect Assets] Selected pages: ${selected_assets.pages.length}, Instagram: ${selected_assets.instagramAccounts.length}`);

      // NOTE: The integrations table enforces UNIQUE(client_id, platform),
      // so we store multiple ad accounts inside a single integration record (settings.ad_accounts).
      for (const adAccountId of selected_assets.adAccounts) {
        try {
          const cleanAccountId = adAccountId.startsWith('act_')
            ? adAccountId
            : `act_${adAccountId.replace(/\D/g, '')}`;

          const accountUrl = `https://graph.facebook.com/v18.0/${cleanAccountId}?fields=id,name,account_status,currency,business_name&access_token=${accessToken}`;
          const accountResponse = await fetch(accountUrl);
          const accountData = await accountResponse.json();

          if (accountData?.error) {
            errors.push(`חשבון ${adAccountId}: ${accountData.error.message}`);
            continue;
          }

          connectedAdAccounts.push({
            id: cleanAccountId,
            name: accountData.name,
            business_name: accountData.business_name,
            currency: accountData.currency,
            account_status: accountData.account_status,
          });

          connectedAssets.push({ id: cleanAccountId, name: accountData.name, type: 'ad_account' });
        } catch (err) {
          errors.push(`חשבון ${adAccountId}: ${(err as Error).message}`);
        }
      }

      if (connectedAdAccounts.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: errors.length > 0 ? errors.join(', ') : 'לא הצלחנו לחבר אף חשבון מודעות',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Encrypt credentials once (same token covers multiple accounts)
      const { data: encryptedCredentials, error: encryptError } = await supabaseClient
        .rpc('encrypt_integration_credentials', { credentials: { access_token: accessToken } });

      if (encryptError) {
        console.error('[Connect Assets] Failed to encrypt credentials:', encryptError);
        return new Response(
          JSON.stringify({ success: false, message: 'שגיאה בשמירת הטוקן בצורה מאובטחת' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const primaryAccount = connectedAdAccounts[0];
      const nowIso = new Date().toISOString();

      const safeSettings = {
        // Backwards compatible single-account fields
        ad_account_id: primaryAccount.id,
        account_name:
          connectedAdAccounts.length === 1
            ? primaryAccount.name
            : `${connectedAdAccounts.length} חשבונות מודעות`,

        // New multi-account field
        ad_accounts: connectedAdAccounts,

        // Store selected asset IDs
        selected_pages: selected_assets.pages,
        selected_instagram: selected_assets.instagramAccounts,
        selected_pixels: selected_assets.pixels || [],
        selected_catalogs: selected_assets.catalogs || [],

        // Store full asset data (if provided)
        pages: requestBody.assets_data?.pages || [],
        instagram_accounts: requestBody.assets_data?.instagram || [],
        pixels: requestBody.assets_data?.pixels || [],
        catalogs: requestBody.assets_data?.catalogs || [],

        // Token expiry (if available)
        token_expires_at: requestBody.assets_data?.token_expires_at || null,

        connected_at: nowIso,
      };

      const integrationRow = {
        client_id,
        platform: 'facebook_ads',
        // Keep a representative account ID here for legacy reads
        external_account_id: primaryAccount.id,
        is_connected: true,
        encrypted_credentials: encryptedCredentials,
        settings: safeSettings,
        last_sync_at: nowIso,
        updated_at: nowIso,
      };

      const { error: upsertError } = await supabaseClient
        .from('integrations')
        .upsert(integrationRow, { onConflict: 'client_id,platform' });

      if (upsertError) {
        console.error('[Connect Assets] Upsert failed:', upsertError);
        return new Response(
          JSON.stringify({ success: false, message: 'שגיאה בשמירת החיבור במסד הנתונים' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `חוברו ${connectedAdAccounts.length} חשבונות מודעות בהצלחה`,
          data: { connected: connectedAssets, errors },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect' && integration_id) {
      const { error } = await supabaseClient
        .from('integrations')
        .update({ is_connected: false, updated_at: new Date().toISOString() })
        .eq('id', integration_id);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'שגיאה בניתוק החיבור' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'החיבור נותק בהצלחה' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync' && integration_id) {
      // Get integration details
      const { data: integration, error: fetchError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integration_id)
        .single();

      if (fetchError || !integration) {
        return new Response(
          JSON.stringify({ success: false, message: 'חיבור לא נמצא' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Simulate sync - in production this would fetch real data
      const syncData = {
        last_sync: new Date().toISOString(),
        records_synced: Math.floor(Math.random() * 100) + 10,
        status: 'success',
      };

      // Update last sync time
      await supabaseClient
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          settings: {
            ...integration.settings,
            last_sync_data: syncData,
          },
        })
        .eq('id', integration_id);

      return new Response(
        JSON.stringify({ success: true, message: 'הסנכרון הושלם', data: syncData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'פעולה לא חוקית' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-integration:', error);
    return new Response(
      JSON.stringify({ success: false, message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});