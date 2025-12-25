import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, startDate, endDate, metrics, dimensions } = await req.json();
    
    // Get service account from secrets
    const serviceAccountJson = Deno.env.get('GOOGLE_ANALYTICS_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_ANALYTICS_SERVICE_ACCOUNT is not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
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

    // Default metrics and dimensions
    const requestMetrics = metrics || [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "conversions" },
      { name: "bounceRate" }
    ];

    const requestDimensions = dimensions || [
      { name: "date" }
    ];

    // Make request to GA4 Data API
    const gaResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${gaPropertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: requestStartDate,
              endDate: requestEndDate
            }
          ],
          metrics: requestMetrics,
          dimensions: requestDimensions,
          orderBys: [
            {
              dimension: {
                dimensionName: "date"
              },
              desc: false
            }
          ]
        })
      }
    );

    const gaData = await gaResponse.json();
    
    if (gaData.error) {
      console.error("GA API error:", gaData.error);
      throw new Error(`Google Analytics API error: ${gaData.error.message}`);
    }

    console.log("GA data fetched successfully, rows:", gaData.rows?.length || 0);

    return new Response(JSON.stringify(gaData), {
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
