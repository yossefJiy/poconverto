import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { healthCheckResponse, checkEnvVars, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS, REQUIRED_ENV_VARS } from "../_shared/constants.ts";

const log = createLogger('Google Analytics');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate JWT token from service account credentials
async function generateAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token valid for 1 hour

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp
  };

  // Base64URL encode
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    console.error("Token exchange failed:", tokenData);
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// Helper function to make GA4 API request
async function runGAReport(
  accessToken: string, 
  propertyId: string, 
  startDate: string, 
  endDate: string,
  metrics: Array<{ name: string }>,
  dimensions: Array<{ name: string }>,
  orderBys?: any[]
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics,
        dimensions,
        orderBys: orderBys || [{ dimension: { dimensionName: dimensions[0].name }, desc: false }],
        limit: 100
      })
    }
  );
  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Clone request to read body for health check
    const body = await req.json();
    const { propertyId, startDate, endDate, reportType, action } = body;
    
    // Health check endpoint - no auth required
    if (action === 'health') {
      const envCheck = checkEnvVars(REQUIRED_ENV_VARS.GOOGLE_ANALYTICS);
      return healthCheckResponse('google-analytics', SERVICE_VERSIONS.GOOGLE_ANALYTICS, [envCheck]);
    }
    
    // Validate user authentication for all other actions
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[Google Analytics] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    console.log('[Google Analytics] Authenticated user:', auth.user.id);
    
    // Get service account from secrets
    let serviceAccountJson = Deno.env.get('GOOGLE_ANALYTICS_READER');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_ANALYTICS_READER is not configured');
    }

    console.log("Raw secret length:", serviceAccountJson.length);
    console.log("First 100 chars:", serviceAccountJson.substring(0, 100));
    
    let serviceAccount;
    try {
      // First try parsing as-is
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error("Initial JSON parse error:", parseError);
      
      try {
        // Try fixing common escape issues
        let fixedJson = serviceAccountJson
          .replace(/\\\\n/g, '\\n')
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n');
        
        serviceAccount = JSON.parse(fixedJson);
      } catch (secondError) {
        console.error("Second parse attempt failed:", secondError);
        
        try {
          const cleanJson = serviceAccountJson.trim().replace(/^\uFEFF/, '');
          serviceAccount = JSON.parse(cleanJson);
        } catch (thirdError) {
          console.error("All parse attempts failed");
          throw new Error(`Failed to parse service account JSON: ${thirdError}`);
        }
      }
    }
    console.log("Service account email:", serviceAccount.client_email);
    
    // Generate access token
    const accessToken = await generateAccessToken(serviceAccount);
    console.log("Access token generated successfully");

    // Use provided property ID or default
    const gaPropertyId = propertyId || "455899497";
    
    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const requestStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const requestEndDate = endDate || today.toISOString().split('T')[0];

    // Fetch multiple reports in parallel
    console.log("Fetching GA data for report type:", reportType || "all");

    // 1. Daily metrics report
    const dailyMetricsPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "conversions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" }
      ],
      [{ name: "date" }]
    );

    // 2. Traffic sources report
    const trafficSourcesPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [{ name: "sessions" }, { name: "activeUsers" }],
      [{ name: "sessionDefaultChannelGroup" }],
      [{ metric: { metricName: "sessions" }, desc: true }]
    );

    // 3. Top pages report
    const topPagesPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [{ name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "bounceRate" }],
      [{ name: "pagePath" }],
      [{ metric: { metricName: "screenPageViews" }, desc: true }]
    );

    // 4. Device breakdown
    const devicesPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [{ name: "sessions" }, { name: "activeUsers" }],
      [{ name: "deviceCategory" }],
      [{ metric: { metricName: "sessions" }, desc: true }]
    );

    // 5. Country breakdown
    const countriesPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [{ name: "sessions" }, { name: "activeUsers" }],
      [{ name: "country" }],
      [{ metric: { metricName: "sessions" }, desc: true }]
    );

    // 6. E-commerce events (add_to_cart, begin_checkout, purchase)
    const ecommercePromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [
        { name: "eventCount" },
        { name: "eventValue" },
        { name: "sessions" }
      ],
      [{ name: "eventName" }],
      [{ metric: { metricName: "eventCount" }, desc: true }]
    );

    // 7. E-commerce conversion funnel (sessions with specific events)
    const ecommerceFunnelPromise = runGAReport(
      accessToken,
      gaPropertyId,
      requestStartDate,
      requestEndDate,
      [
        { name: "sessions" },
        { name: "addToCarts" },
        { name: "checkouts" },
        { name: "ecommercePurchases" },
        { name: "purchaseRevenue" },
        { name: "transactions" }
      ],
      [{ name: "date" }]
    );

    // Wait for all reports
    const [dailyMetrics, trafficSources, topPages, devices, countries, ecommerce, ecommerceFunnel] = await Promise.all([
      dailyMetricsPromise,
      trafficSourcesPromise,
      topPagesPromise,
      devicesPromise,
      countriesPromise,
      ecommercePromise,
      ecommerceFunnelPromise
    ]);

    // Check for errors in any report
    for (const [name, data] of Object.entries({ dailyMetrics, trafficSources, topPages, devices, countries, ecommerce, ecommerceFunnel })) {
      if ((data as any).error) {
        console.error(`${name} error:`, (data as any).error);
      }
    }

    // Parse ecommerce events
    const ecommerceEvents: Record<string, { count: number; value: number }> = {};
    if (ecommerce.rows) {
      for (const row of ecommerce.rows) {
        const eventName = row.dimensionValues?.[0]?.value || '';
        const count = parseInt(row.metricValues?.[0]?.value || '0');
        const value = parseFloat(row.metricValues?.[1]?.value || '0');
        ecommerceEvents[eventName] = { count, value };
      }
    }

    // Parse ecommerce funnel totals
    let ecommerceTotals = {
      addToCarts: 0,
      checkouts: 0,
      purchases: 0,
      purchaseRevenue: 0,
      transactions: 0,
      sessions: 0
    };
    
    if (ecommerceFunnel.rows) {
      for (const row of ecommerceFunnel.rows) {
        ecommerceTotals.sessions += parseInt(row.metricValues?.[0]?.value || '0');
        ecommerceTotals.addToCarts += parseInt(row.metricValues?.[1]?.value || '0');
        ecommerceTotals.checkouts += parseInt(row.metricValues?.[2]?.value || '0');
        ecommerceTotals.purchases += parseInt(row.metricValues?.[3]?.value || '0');
        ecommerceTotals.purchaseRevenue += parseFloat(row.metricValues?.[4]?.value || '0');
        ecommerceTotals.transactions += parseInt(row.metricValues?.[5]?.value || '0');
      }
    }

    // Calculate conversion rates
    const conversionRates = {
      addToCartRate: ecommerceTotals.sessions > 0 
        ? ((ecommerceTotals.addToCarts / ecommerceTotals.sessions) * 100).toFixed(2) 
        : '0.00',
      checkoutRate: ecommerceTotals.addToCarts > 0 
        ? ((ecommerceTotals.checkouts / ecommerceTotals.addToCarts) * 100).toFixed(2) 
        : '0.00',
      purchaseRate: ecommerceTotals.checkouts > 0 
        ? ((ecommerceTotals.purchases / ecommerceTotals.checkouts) * 100).toFixed(2) 
        : '0.00',
      overallConversionRate: ecommerceTotals.sessions > 0 
        ? ((ecommerceTotals.purchases / ecommerceTotals.sessions) * 100).toFixed(2) 
        : '0.00'
    };

    console.log('[GA] Ecommerce totals:', ecommerceTotals);
    console.log('[GA] Conversion rates:', conversionRates);

    const response = {
      dailyMetrics,
      trafficSources,
      topPages,
      devices,
      countries,
      ecommerce: {
        events: ecommerceEvents,
        totals: ecommerceTotals,
        conversionRates,
        rawData: ecommerce,
        funnelData: ecommerceFunnel
      }
    };

    console.log("GA data fetched successfully:", {
      dailyRows: dailyMetrics.rows?.length || 0,
      trafficRows: trafficSources.rows?.length || 0,
      topPagesRows: topPages.rows?.length || 0,
      devicesRows: devices.rows?.length || 0,
      countriesRows: countries.rows?.length || 0,
      ecommerceEvents: Object.keys(ecommerceEvents).length,
      ecommerceTotals
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
