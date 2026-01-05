// Feature Flags System
// Allows enabling/disabling features per client

import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  // Phase 2: Marketing & KPI
  kpiGoals: boolean;
  competitorTracking: boolean;
  brandHealthScore: boolean;
  
  // Phase 3: Social Media
  socialMediaManager: boolean;
  autoPosting: boolean;
  contentCalendar: boolean;
  
  // Phase 4: Content Studio
  contentStudio: boolean;
  aiContentGeneration: boolean;
  contentApprovalFlow: boolean;
  
  // Phase 5: Campaigns & Programmatic
  programmaticCampaigns: boolean;
  campaignAssets: boolean;
  abTesting: boolean;
  
  // Phase 6: E-commerce
  googleShopping: boolean;
  multiStoreDashboard: boolean;
  
  // Phase 7: Approval System
  humanApprovalPoints: boolean;
  visualApproval: boolean;
  
  // Phase 8: AI Enhancement
  aiOptimization: boolean;
  aiInsights: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  kpiGoals: false,
  competitorTracking: false,
  brandHealthScore: false,
  socialMediaManager: false,
  autoPosting: false,
  contentCalendar: false,
  contentStudio: false,
  aiContentGeneration: true, // Already exists
  contentApprovalFlow: false,
  programmaticCampaigns: false,
  campaignAssets: false,
  abTesting: false,
  googleShopping: false,
  multiStoreDashboard: false,
  humanApprovalPoints: false,
  visualApproval: false,
  aiOptimization: true, // Already exists
  aiInsights: true, // Already exists
};

class FeatureFlagService {
  private cache: Map<string, FeatureFlags> = new Map();
  private globalFlags: FeatureFlags = DEFAULT_FLAGS;

  async getFlags(clientId?: string): Promise<FeatureFlags> {
    // Return cached if available
    const cacheKey = clientId || 'global';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // For now, return default flags
    // In future, fetch from feature_flags table
    const flags = { ...this.globalFlags };
    this.cache.set(cacheKey, flags);
    return flags;
  }

  async isEnabled(flag: keyof FeatureFlags, clientId?: string): Promise<boolean> {
    const flags = await this.getFlags(clientId);
    return flags[flag] ?? false;
  }

  // Synchronous version for components that can't use async
  isEnabledSync(flag: keyof FeatureFlags, clientId?: string): boolean {
    const cacheKey = clientId || 'global';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached[flag] ?? false;
    }
    return this.globalFlags[flag] ?? false;
  }

  async setFlag(flag: keyof FeatureFlags, enabled: boolean, clientId?: string) {
    const cacheKey = clientId || 'global';
    const current = await this.getFlags(clientId);
    const updated = { ...current, [flag]: enabled };
    this.cache.set(cacheKey, updated);
    
    // In future: persist to database
    return updated;
  }

  clearCache(clientId?: string) {
    if (clientId) {
      this.cache.delete(clientId);
    } else {
      this.cache.clear();
    }
  }
}

export const featureFlags = new FeatureFlagService();

// React hook for feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(flag: keyof FeatureFlags, clientId?: string): boolean {
  const [enabled, setEnabled] = useState(featureFlags.isEnabledSync(flag, clientId));

  useEffect(() => {
    featureFlags.isEnabled(flag, clientId).then(setEnabled);
  }, [flag, clientId]);

  return enabled;
}

export function useFeatureFlags(clientId?: string): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    featureFlags.getFlags(clientId).then(setFlags);
  }, [clientId]);

  return flags;
}
