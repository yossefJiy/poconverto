import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  authenticated: boolean;
  user: any | null;
  error?: string;
}

/**
 * Validates JWT token from Authorization header and returns user info
 * @param req The incoming request
 * @returns AuthResult with user info or error
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authenticated: false,
        user: null,
        error: "Missing or invalid Authorization header",
      };
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return {
        authenticated: false,
        user: null,
        error: "Missing JWT token",
      };
    }

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const supabaseAnonKey = (
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      ""
    ).trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Auth] Missing backend env vars: SUPABASE_URL / SUPABASE_ANON_KEY");
      return {
        authenticated: false,
        user: null,
        error: "Server authentication is not configured",
      };
    }

    // Create Supabase client (server-side) and validate the JWT explicitly.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // IMPORTANT: Pass the token explicitly to avoid relying on persisted session state.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("[Auth] Token validation failed:", error?.message);
      return {
        authenticated: false,
        user: null,
        error: error?.message || "Invalid token",
      };
    }

    console.log("[Auth] User authenticated:", user.id);

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    console.error("[Auth] Unexpected error:", error);
    return {
      authenticated: false,
      user: null,
      error: "Authentication failed",
    };
  }
}

/**
 * Creates an unauthorized response with CORS headers
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
