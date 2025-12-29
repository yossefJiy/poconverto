import { supabase } from "@/integrations/supabase/client";

/**
 * Check if an error is related to authentication/session issues
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Common auth error patterns
  const authErrorPatterns = [
    'Auth session missing',
    'Session not found',
    'session_not_found',
    'Token validation failed',
    'JWT expired',
    'invalid_token',
    'refresh_token_not_found',
    'Invalid Refresh Token',
    'not authenticated',
    'unauthorized',
  ];
  
  const lowerMessage = errorMessage.toLowerCase();
  
  // Check for 401/403 status codes in error
  if (lowerMessage.includes('401') || lowerMessage.includes('403')) {
    return true;
  }
  
  // Check for auth error patterns
  return authErrorPatterns.some(pattern => 
    lowerMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Result of invokeWithReauth - either success or needs reauth
 */
export type InvokeResult<T> = 
  | { success: true; data: T }
  | { success: false; needsReauth: true; error: Error }
  | { success: false; needsReauth: false; error: Error };

/**
 * Invoke a Supabase function with automatic session refresh on auth errors
 * Returns a result object indicating success or the need for re-authentication
 */
export async function invokeWithReauth<T>(
  functionName: string,
  body?: Record<string, any>
): Promise<InvokeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    if (error) {
      // Check if it's an auth error
      if (isAuthError(error)) {
        // Try to refresh the session once
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError) {
          // Retry the request after successful refresh
          const { data: retryData, error: retryError } = await supabase.functions.invoke(functionName, { body });
          
          if (retryError) {
            if (isAuthError(retryError)) {
              // Still failing after refresh - need to re-authenticate
              await cleanupSession();
              return { success: false, needsReauth: true, error: new Error('Session expired - please sign in again') };
            }
            return { success: false, needsReauth: false, error: retryError };
          }
          
          return { success: true, data: retryData as T };
        } else {
          // Refresh failed - clean up and require re-auth
          await cleanupSession();
          return { success: false, needsReauth: true, error: new Error('Session expired - please sign in again') };
        }
      }
      
      // Not an auth error
      return { success: false, needsReauth: false, error };
    }
    
    // Check if the response itself contains an error
    if (data?.error) {
      const dataError = new Error(data.error);
      if (isAuthError(dataError)) {
        // Try refresh
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError) {
          const { data: retryData, error: retryError } = await supabase.functions.invoke(functionName, { body });
          
          if (retryError || retryData?.error) {
            await cleanupSession();
            return { success: false, needsReauth: true, error: new Error('Session expired - please sign in again') };
          }
          
          return { success: true, data: retryData as T };
        } else {
          await cleanupSession();
          return { success: false, needsReauth: true, error: new Error('Session expired - please sign in again') };
        }
      }
      
      return { success: false, needsReauth: false, error: dataError };
    }
    
    return { success: true, data: data as T };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    if (isAuthError(error)) {
      await cleanupSession();
      return { success: false, needsReauth: true, error: new Error('Session expired - please sign in again') };
    }
    
    return { success: false, needsReauth: false, error };
  }
}

/**
 * Clean up a potentially invalid session
 */
async function cleanupSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Fallback: clear localStorage directly
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    if (projectId) {
      try {
        localStorage.removeItem(`sb-${projectId}-auth-token`);
        localStorage.removeItem(`sb-${projectId}-auth-token-code-verifier`);
      } catch {
        // Ignore localStorage errors
      }
    }
  }
}

/**
 * Validate the current session against the server
 * Returns true if session is valid, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Verify session is actually valid on the server
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Session is invalid - clean it up
      await cleanupSession();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
