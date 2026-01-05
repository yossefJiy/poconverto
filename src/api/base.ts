// Base API class for all domain APIs

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { logger } from '@/lib/logger';

export abstract class BaseAPI {
  protected async request<T>(
    operation: () => Promise<{ data: unknown; error: unknown }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'Unknown error';
        logger.error(new Error(errorMessage), { api: this.constructor.name });
        return { data: null, error: errorMessage, success: false };
      }
      
      return { data: data as T, error: null, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(err instanceof Error ? err : new Error(message), { 
        api: this.constructor.name 
      });
      return { data: null, error: message, success: false };
    }
  }

  protected get client() {
    return supabase;
  }
}
