
-- Phase 5: Campaign Assets & Programmatic Tables

-- Ad Placements table
CREATE TABLE public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  placement_type VARCHAR(100) NOT NULL,
  placement_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  bid_amount DECIMAL(10,2),
  daily_budget DECIMAL(10,2),
  performance_data JSONB DEFAULT '{}',
  targeting_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B Tests table
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  variant_a JSONB NOT NULL DEFAULT '{}',
  variant_b JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  winner VARCHAR(10),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sample_size INTEGER DEFAULT 1000,
  confidence_level DECIMAL(5,2) DEFAULT 95.00,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget Rules table
CREATE TABLE public.budget_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 6: E-commerce Expansion Tables

-- Product Feeds table
CREATE TABLE public.product_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  feed_name VARCHAR(255) NOT NULL,
  feed_url TEXT,
  feed_type VARCHAR(50) DEFAULT 'xml',
  status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency VARCHAR(50) DEFAULT 'daily',
  product_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Price Tracking table
CREATE TABLE public.price_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(500),
  our_price DECIMAL(10,2),
  competitor_name VARCHAR(255),
  competitor_price DECIMAL(10,2),
  competitor_url TEXT,
  price_difference DECIMAL(10,2),
  tracked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Segments table
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_type VARCHAR(50) DEFAULT 'custom',
  conditions JSONB NOT NULL DEFAULT '[]',
  customer_count INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  total_revenue DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_placements
CREATE POLICY "Users can view ad placements" ON public.ad_placements
  FOR SELECT USING (true);
CREATE POLICY "Users can manage ad placements" ON public.ad_placements
  FOR ALL USING (true);

-- RLS Policies for ab_tests
CREATE POLICY "Users can view ab tests" ON public.ab_tests
  FOR SELECT USING (true);
CREATE POLICY "Users can manage ab tests" ON public.ab_tests
  FOR ALL USING (true);

-- RLS Policies for budget_rules
CREATE POLICY "Users can view budget rules" ON public.budget_rules
  FOR SELECT USING (true);
CREATE POLICY "Users can manage budget rules" ON public.budget_rules
  FOR ALL USING (true);

-- RLS Policies for product_feeds
CREATE POLICY "Users can view product feeds" ON public.product_feeds
  FOR SELECT USING (true);
CREATE POLICY "Users can manage product feeds" ON public.product_feeds
  FOR ALL USING (true);

-- RLS Policies for price_tracking
CREATE POLICY "Users can view price tracking" ON public.price_tracking
  FOR SELECT USING (true);
CREATE POLICY "Users can manage price tracking" ON public.price_tracking
  FOR ALL USING (true);

-- RLS Policies for customer_segments
CREATE POLICY "Users can view customer segments" ON public.customer_segments
  FOR SELECT USING (true);
CREATE POLICY "Users can manage customer segments" ON public.customer_segments
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_ad_placements_client ON public.ad_placements(client_id);
CREATE INDEX idx_ad_placements_campaign ON public.ad_placements(campaign_id);
CREATE INDEX idx_ab_tests_client ON public.ab_tests(client_id);
CREATE INDEX idx_ab_tests_campaign ON public.ab_tests(campaign_id);
CREATE INDEX idx_budget_rules_client ON public.budget_rules(client_id);
CREATE INDEX idx_product_feeds_client ON public.product_feeds(client_id);
CREATE INDEX idx_price_tracking_client ON public.price_tracking(client_id);
CREATE INDEX idx_customer_segments_client ON public.customer_segments(client_id);

-- Update timestamp triggers
CREATE TRIGGER update_ad_placements_updated_at
  BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_rules_updated_at
  BEFORE UPDATE ON public.budget_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_feeds_updated_at
  BEFORE UPDATE ON public.product_feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
