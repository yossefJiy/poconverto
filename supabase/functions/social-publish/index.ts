// Social Publish Edge Function
// Handles scheduled post publishing to social platforms

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  postId?: string;
  processScheduled?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PublishRequest = await req.json().catch(() => ({}));
    console.log('[social-publish] Request:', body);

    const results: Array<{
      post_id: string;
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    // Get posts to publish
    let query = supabase
      .from('social_posts')
      .select('*');

    if (body.postId) {
      // Publish specific post
      query = query.eq('id', body.postId);
    } else if (body.processScheduled) {
      // Process all scheduled posts that are due
      query = query
        .eq('status', 'scheduled')
        .lte('scheduled_for', new Date().toISOString());
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide postId or processScheduled=true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      console.error('[social-publish] Error fetching posts:', fetchError);
      throw fetchError;
    }

    console.log(`[social-publish] Found ${posts?.length || 0} posts to publish`);

    for (const post of posts || []) {
      // Update status to publishing
      await supabase
        .from('social_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id);

      // Process each platform
      for (const platform of post.platforms || []) {
        try {
          // In a real implementation, this would call the platform APIs
          // For now, we'll simulate the publish
          console.log(`[social-publish] Publishing to ${platform}:`, post.id);

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Mock successful publish
          results.push({
            post_id: post.id,
            platform,
            success: true,
          });

        } catch (platformError) {
          console.error(`[social-publish] Error publishing to ${platform}:`, platformError);
          results.push({
            post_id: post.id,
            platform,
            success: false,
            error: platformError instanceof Error ? platformError.message : 'Unknown error',
          });
        }
      }

      // Update post status based on results
      const postResults = results.filter(r => r.post_id === post.id);
      const allSucceeded = postResults.every(r => r.success);
      const anySucceeded = postResults.some(r => r.success);

      if (allSucceeded) {
        await supabase
          .from('social_posts')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', post.id);
      } else if (!anySucceeded) {
        const errors = postResults.filter(r => !r.success).map(r => r.error).join('; ');
        await supabase
          .from('social_posts')
          .update({ 
            status: 'failed',
            error_message: errors,
          })
          .eq('id', post.id);
      } else {
        // Partial success
        await supabase
          .from('social_posts')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString(),
            error_message: 'Partial publish - some platforms failed',
          })
          .eq('id', post.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: posts?.length || 0,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[social-publish] Error:', error);
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
