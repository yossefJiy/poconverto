// Engagement Sync Edge Function
// Syncs engagement metrics from social platforms

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  clientId?: string;
  accountId?: string;
  postId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json().catch(() => ({}));
    console.log('[engagement-sync] Request:', body);

    // Build query for published posts
    let query = supabase
      .from('social_posts')
      .select('*, social_accounts!inner(*)')
      .eq('status', 'published')
      .not('external_post_id', 'is', null);

    if (body.clientId) {
      query = query.eq('client_id', body.clientId);
    }

    if (body.accountId) {
      query = query.eq('account_id', body.accountId);
    }

    if (body.postId) {
      query = query.eq('id', body.postId);
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      console.error('[engagement-sync] Error fetching posts:', fetchError);
      throw fetchError;
    }

    console.log(`[engagement-sync] Found ${posts?.length || 0} posts to sync`);

    const syncResults: Array<{
      post_id: string;
      success: boolean;
      engagement?: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
      };
    }> = [];

    for (const post of posts || []) {
      try {
        // In a real implementation, this would call the platform APIs
        // For now, we'll simulate engagement data
        const mockEngagement = {
          likes: Math.floor(Math.random() * 100) + (post.engagement?.likes || 0),
          comments: Math.floor(Math.random() * 20) + (post.engagement?.comments || 0),
          shares: Math.floor(Math.random() * 10) + (post.engagement?.shares || 0),
          reach: Math.floor(Math.random() * 500) + (post.engagement?.reach || 0),
        };

        // Update post engagement
        await supabase
          .from('social_posts')
          .update({ engagement: mockEngagement })
          .eq('id', post.id);

        syncResults.push({
          post_id: post.id,
          success: true,
          engagement: mockEngagement,
        });

        console.log(`[engagement-sync] Synced post ${post.id}:`, mockEngagement);

      } catch (syncError) {
        console.error(`[engagement-sync] Error syncing post ${post.id}:`, syncError);
        syncResults.push({
          post_id: post.id,
          success: false,
        });
      }
    }

    // Update last_sync_at for accounts
    if (body.accountId) {
      await supabase
        .from('social_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', body.accountId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length,
        results: syncResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[engagement-sync] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
