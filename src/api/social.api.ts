// Social Media API

import { BaseAPI } from './base';

export interface SocialAccount {
  id: string;
  client_id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  account_id: string;
  account_name: string | null;
  account_url: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  client_id: string;
  account_id: string | null;
  content: string;
  media_urls: string[];
  hashtags: string[];
  platforms: string[];
  scheduled_for: string | null;
  published_at: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  error_message: string | null;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  external_post_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEntry {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  content: string | null;
  date: string;
  time: string | null;
  platforms: string[];
  status: 'idea' | 'planned' | 'in_progress' | 'ready' | 'published';
  color: string;
  post_id: string | null;
  assigned_to: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ContentTemplate {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  content: string;
  category: string;
  platforms: string[];
  variables: Array<{ name: string; label: string }>;
  media_urls: string[];
  is_global: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface HashtagGroup {
  id: string;
  client_id: string;
  name: string;
  hashtags: string[];
  category: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  client_id: string;
  content: string;
  platforms: string[];
  media_urls?: string[];
  hashtags?: string[];
  scheduled_for?: string;
}

export interface CreateCalendarInput {
  client_id: string;
  title: string;
  date: string;
  description?: string;
  content?: string;
  time?: string;
  platforms?: string[];
  color?: string;
  tags?: string[];
}

export class SocialAPI extends BaseAPI {
  // Accounts
  async listAccounts(clientId: string) {
    return this.request<SocialAccount[]>(async () => {
      return this.client
        .from('social_accounts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('platform');
    });
  }

  async connectAccount(clientId: string, platform: string, accountData: Partial<SocialAccount>) {
    return this.request<SocialAccount>(async () => {
      return this.client
        .from('social_accounts')
        .upsert({
          client_id: clientId,
          platform,
          account_id: accountData.account_id,
          account_name: accountData.account_name,
          account_url: accountData.account_url,
          is_active: true,
        })
        .select()
        .single();
    });
  }

  async disconnectAccount(accountId: string) {
    return this.request<null>(async () => {
      return this.client
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId);
    });
  }

  // Posts
  async listPosts(clientId: string, status?: string, limit = 50) {
    return this.request<SocialPost[]>(async () => {
      let query = this.client
        .from('social_posts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      return query;
    });
  }

  async createPost(data: CreatePostInput) {
    return this.request<SocialPost>(async () => {
      return this.client
        .from('social_posts')
        .insert({
          client_id: data.client_id,
          content: data.content,
          platforms: data.platforms,
          media_urls: data.media_urls || [],
          hashtags: data.hashtags || [],
          scheduled_for: data.scheduled_for || null,
          status: data.scheduled_for ? 'scheduled' : 'draft',
        })
        .select()
        .single();
    });
  }

  async updatePost(id: string, data: Partial<SocialPost>) {
    return this.request<SocialPost>(async () => {
      return this.client
        .from('social_posts')
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async schedulePost(id: string, scheduledFor: string) {
    return this.request<SocialPost>(async () => {
      return this.client
        .from('social_posts')
        .update({ 
          scheduled_for: scheduledFor,
          status: 'scheduled',
        })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deletePost(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('social_posts')
        .delete()
        .eq('id', id);
    });
  }

  // Calendar
  async listCalendar(clientId: string, startDate: string, endDate: string) {
    return this.request<CalendarEntry[]>(async () => {
      return this.client
        .from('content_calendar')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
    });
  }

  async createCalendarEntry(data: CreateCalendarInput) {
    return this.request<CalendarEntry>(async () => {
      return this.client
        .from('content_calendar')
        .insert({
          client_id: data.client_id,
          title: data.title,
          date: data.date,
          description: data.description || null,
          content: data.content || null,
          time: data.time || null,
          platforms: data.platforms || [],
          color: data.color || '#3B82F6',
          tags: data.tags || [],
        })
        .select()
        .single();
    });
  }

  async updateCalendarEntry(id: string, data: Partial<CalendarEntry>) {
    return this.request<CalendarEntry>(async () => {
      return this.client
        .from('content_calendar')
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteCalendarEntry(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('content_calendar')
        .delete()
        .eq('id', id);
    });
  }

  // Templates
  async listTemplates(clientId?: string) {
    return this.request<ContentTemplate[]>(async () => {
      let query = this.client
        .from('content_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
      
      if (clientId) {
        query = query.or(`is_global.eq.true,client_id.eq.${clientId}`);
      } else {
        query = query.eq('is_global', true);
      }
      
      return query;
    });
  }

  async useTemplate(templateId: string) {
    // Increment usage count manually
    const { data: template } = await this.client
      .from('content_templates')
      .select('usage_count')
      .eq('id', templateId)
      .single();
    
    if (template) {
      await this.client
        .from('content_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);
    }
  }

  // Hashtag Groups
  async listHashtagGroups(clientId: string) {
    return this.request<HashtagGroup[]>(async () => {
      return this.client
        .from('hashtag_groups')
        .select('*')
        .eq('client_id', clientId)
        .order('usage_count', { ascending: false });
    });
  }

  async createHashtagGroup(clientId: string, name: string, hashtags: string[], category?: string) {
    return this.request<HashtagGroup>(async () => {
      return this.client
        .from('hashtag_groups')
        .insert({
          client_id: clientId,
          name,
          hashtags,
          category: category || null,
        })
        .select()
        .single();
    });
  }

  async updateHashtagGroup(id: string, data: Partial<HashtagGroup>) {
    return this.request<HashtagGroup>(async () => {
      return this.client
        .from('hashtag_groups')
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteHashtagGroup(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('hashtag_groups')
        .delete()
        .eq('id', id);
    });
  }

  // Analytics
  async getEngagementStats(clientId: string, days = 30) {
    return this.request<{
      total_posts: number;
      total_likes: number;
      total_comments: number;
      total_shares: number;
      total_reach: number;
      avg_engagement_rate: number;
    }>(async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const { data: posts } = await this.client
        .from('social_posts')
        .select('engagement')
        .eq('client_id', clientId)
        .eq('status', 'published')
        .gte('published_at', since.toISOString());
      
      const stats = {
        total_posts: posts?.length || 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        total_reach: 0,
        avg_engagement_rate: 0,
      };
      
      for (const post of posts || []) {
        const eng = post.engagement as SocialPost['engagement'];
        stats.total_likes += eng?.likes || 0;
        stats.total_comments += eng?.comments || 0;
        stats.total_shares += eng?.shares || 0;
        stats.total_reach += eng?.reach || 0;
      }
      
      if (stats.total_reach > 0) {
        const totalEngagement = stats.total_likes + stats.total_comments + stats.total_shares;
        stats.avg_engagement_rate = (totalEngagement / stats.total_reach) * 100;
      }
      
      return { data: stats, error: null };
    });
  }
}

export const socialAPI = new SocialAPI();
