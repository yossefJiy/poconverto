import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface RouteConfig {
  path: string;
  function: string;
  methods: string[];
  requireAuth: boolean;
  rateLimit?: number; // requests per minute
  description: string;
}

// API Gateway Route Configuration
const routes: RouteConfig[] = [
  // Analytics & Reporting
  { path: "/analytics", function: "analytics-api", methods: ["GET", "POST"], requireAuth: true, rateLimit: 100, description: "Analytics data API" },
  { path: "/reports/generate", function: "generate-report", methods: ["POST"], requireAuth: true, rateLimit: 10, description: "Generate reports" },
  
  // Platform Integrations
  { path: "/integrations/google-ads", function: "google-ads", methods: ["GET", "POST"], requireAuth: true, rateLimit: 50, description: "Google Ads API" },
  { path: "/integrations/google-analytics", function: "google-analytics", methods: ["GET", "POST"], requireAuth: true, rateLimit: 50, description: "Google Analytics API" },
  { path: "/integrations/facebook-ads", function: "facebook-ads", methods: ["GET", "POST"], requireAuth: true, rateLimit: 50, description: "Facebook Ads API" },
  { path: "/integrations/facebook-discover", function: "facebook-discover-assets", methods: ["GET", "POST"], requireAuth: true, rateLimit: 30, description: "Facebook asset discovery" },
  { path: "/integrations/shopify", function: "shopify-api", methods: ["GET", "POST"], requireAuth: true, rateLimit: 60, description: "Shopify API" },
  { path: "/integrations/woocommerce", function: "woocommerce-api", methods: ["GET", "POST"], requireAuth: true, rateLimit: 60, description: "WooCommerce API" },
  { path: "/integrations/connect", function: "connect-integration", methods: ["POST"], requireAuth: true, rateLimit: 20, description: "Connect new integration" },
  { path: "/integrations/sync", function: "sync-integrations", methods: ["POST"], requireAuth: true, rateLimit: 10, description: "Sync all integrations" },
  
  // AI Services
  { path: "/ai/marketing", function: "ai-marketing", methods: ["POST"], requireAuth: true, rateLimit: 30, description: "AI marketing insights" },
  { path: "/ai/task-analyzer", function: "ai-task-analyzer", methods: ["POST"], requireAuth: true, rateLimit: 20, description: "AI task analysis" },
  { path: "/ai/insights-chat", function: "insights-chat", methods: ["POST"], requireAuth: true, rateLimit: 50, description: "AI insights chat" },
  { path: "/ai/campaign-analyzer", function: "daily-campaign-analyzer", methods: ["POST"], requireAuth: true, rateLimit: 10, description: "Campaign analysis" },
  
  // Data API
  { path: "/data", function: "data-api", methods: ["GET", "POST", "PUT", "DELETE"], requireAuth: true, rateLimit: 200, description: "Data CRUD API" },
  
  // Notifications
  { path: "/notifications/email", function: "send-task-email", methods: ["POST"], requireAuth: true, rateLimit: 30, description: "Send task emails" },
  { path: "/notifications/sms", function: "send-sms", methods: ["POST"], requireAuth: true, rateLimit: 20, description: "Send SMS" },
  { path: "/notifications/admin-alert", function: "send-admin-alert", methods: ["POST"], requireAuth: true, rateLimit: 10, description: "Admin alerts" },
  { path: "/notifications/invitation", function: "send-client-invitation", methods: ["POST"], requireAuth: true, rateLimit: 10, description: "Client invitations" },
  { path: "/notifications/lead", function: "send-lead-notification", methods: ["POST"], requireAuth: false, rateLimit: 20, description: "Lead notifications" },
  
  // Authentication
  { path: "/auth/2fa", function: "send-2fa-code", methods: ["POST"], requireAuth: false, rateLimit: 5, description: "Two-factor authentication" },
  { path: "/auth/trusted-device", function: "trusted-device", methods: ["POST"], requireAuth: false, rateLimit: 20, description: "Trusted device management" },
  
  // System Health
  { path: "/health", function: "health-check", methods: ["GET"], requireAuth: false, rateLimit: 60, description: "System health check" },
  { path: "/health/monitor", function: "health-monitor", methods: ["GET", "POST"], requireAuth: true, rateLimit: 30, description: "Health monitoring" },
  { path: "/health/code-audit", function: "code-health-audit", methods: ["POST"], requireAuth: true, rateLimit: 5, description: "Code health audit" },
  
  // Tasks & Reminders
  { path: "/tasks/reminder", function: "task-reminder", methods: ["POST"], requireAuth: true, rateLimit: 30, description: "Task reminders" },
  
  // Webhooks
  { path: "/webhooks", function: "webhook-receiver", methods: ["POST"], requireAuth: false, rateLimit: 100, description: "Webhook receiver" },
  
  // OAuth
  { path: "/oauth/google-ads", function: "google-ads-oauth", methods: ["GET", "POST"], requireAuth: false, rateLimit: 20, description: "Google Ads OAuth" },
  
  // MCP Server
  { path: "/mcp", function: "mcp-server", methods: ["GET", "POST"], requireAuth: true, rateLimit: 50, description: "MCP Server" },
];

// Rate limiting storage (in-memory for this instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientId: string, limit: number): boolean {
  const now = Date.now();
  const key = clientId;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function findRoute(path: string, method: string): RouteConfig | null {
  for (const route of routes) {
    if (path.startsWith(route.path) && route.methods.includes(method)) {
      return route;
    }
  }
  return null;
}

async function validateAuth(req: Request): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { valid: false, error: "Invalid token" };
  }

  return { valid: true, userId: user.id };
}

async function forwardRequest(
  targetFunction: string,
  req: Request,
  originalPath: string,
  route: RouteConfig
): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const targetUrl = `${supabaseUrl}/functions/v1/${targetFunction}`;
  
  // Clone and forward the request
  const headers = new Headers(req.headers);
  headers.set("X-Gateway-Route", route.path);
  headers.set("X-Original-Path", originalPath);
  
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  // Clone response with CORS headers
  const responseHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api-gateway", "");
  const method = req.method;

  console.log(`[API Gateway] ${method} ${path}`);

  // Health check for gateway itself
  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        routes: routes.map(r => ({
          path: r.path,
          methods: r.methods,
          description: r.description,
          requireAuth: r.requireAuth,
        })),
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // API documentation endpoint
  if (path === "/docs" || path === "/openapi") {
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: "JIY Marketing Platform API",
        version: "1.0.0",
        description: "Unified API Gateway for all marketing platform services",
      },
      servers: [
        { url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/api-gateway` },
      ],
      paths: routes.reduce((acc, route) => {
        acc[route.path] = route.methods.reduce((methodAcc, method) => {
          methodAcc[method.toLowerCase()] = {
            summary: route.description,
            security: route.requireAuth ? [{ bearerAuth: [] }] : [],
            responses: {
              200: { description: "Successful response" },
              401: { description: "Unauthorized" },
              429: { description: "Rate limit exceeded" },
            },
          };
          return methodAcc;
        }, {} as Record<string, unknown>);
        return acc;
      }, {} as Record<string, unknown>),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    };

    return new Response(JSON.stringify(openApiSpec, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Find matching route
  const route = findRoute(path, method);
  
  if (!route) {
    console.log(`[API Gateway] Route not found: ${method} ${path}`);
    return new Response(
      JSON.stringify({ 
        error: "Route not found",
        path,
        method,
        availableRoutes: routes.map(r => ({ path: r.path, methods: r.methods })),
      }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log(`[API Gateway] Matched route: ${route.path} -> ${route.function}`);

  // Check authentication if required
  let userId = "anonymous";
  if (route.requireAuth) {
    const authResult = await validateAuth(req);
    if (!authResult.valid) {
      console.log(`[API Gateway] Auth failed: ${authResult.error}`);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    userId = authResult.userId!;
  }

  // Check rate limit
  if (route.rateLimit) {
    const rateLimitKey = `${userId}:${route.path}`;
    if (!checkRateLimit(rateLimitKey, route.rateLimit)) {
      console.log(`[API Gateway] Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          retryAfter: 60,
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...corsHeaders,
          } 
        }
      );
    }
  }

  // Forward request to target function
  try {
    const response = await forwardRequest(route.function, req, path, route);
    console.log(`[API Gateway] Response: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[API Gateway] Error forwarding to ${route.function}:`, error);
    return new Response(
      JSON.stringify({ 
        error: "Gateway error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
