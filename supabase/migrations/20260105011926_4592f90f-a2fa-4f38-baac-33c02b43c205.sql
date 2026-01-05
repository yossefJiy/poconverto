-- Indexes for social_posts performance optimization
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled 
  ON social_posts(scheduled_for) 
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_social_posts_status 
  ON social_posts(status);

CREATE INDEX IF NOT EXISTS idx_social_posts_client_status 
  ON social_posts(client_id, status);