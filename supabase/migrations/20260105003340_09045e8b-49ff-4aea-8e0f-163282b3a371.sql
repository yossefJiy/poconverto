-- Phase 2: Marketing & KPI Hub Tables

-- Table 1: Brand KPIs - יעדים ומדדים עסקיים
CREATE TABLE public.brand_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom', -- revenue, traffic, engagement, conversion, brand, custom
  metric_type TEXT NOT NULL DEFAULT 'number', -- number, percentage, currency, ratio
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  previous_value NUMERIC,
  unit TEXT, -- e.g., 'ILS', '%', 'clicks'
  period TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'on_track', -- on_track, at_risk, behind, exceeded
  threshold_warning NUMERIC DEFAULT 80, -- percentage at which to warn
  threshold_critical NUMERIC DEFAULT 60, -- percentage at which to alert
  data_source TEXT, -- manual, google_ads, facebook_ads, shopify, etc.
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 2: KPI History - היסטוריית שינויים
CREATE TABLE public.kpi_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID NOT NULL REFERENCES public.brand_kpis(id) ON DELETE CASCADE,
  recorded_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  status TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Table 3: Competitor Tracking - מעקב מתחרים
CREATE TABLE public.competitor_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  social_links JSONB DEFAULT '{}', -- {facebook, instagram, linkedin, etc.}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 4: Competitor Metrics - מדדי מתחרים
CREATE TABLE public.competitor_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitor_tracking(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  source TEXT, -- manual, scraped, api
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Table 5: Industry Benchmarks - מדדי תעשייה
CREATE TABLE public.industry_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  percentile INTEGER, -- 25, 50, 75, 90
  source TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(industry, metric_name, percentile)
);

-- Table 6: Brand Health Scores - ציון בריאות מותג
CREATE TABLE public.brand_health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  visibility_score NUMERIC DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  sentiment_score NUMERIC DEFAULT 0,
  growth_score NUMERIC DEFAULT 0,
  competitive_score NUMERIC DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start DATE,
  period_end DATE
);

-- Enable RLS
ALTER TABLE public.brand_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_kpis
CREATE POLICY "Users can view KPIs for their clients" ON public.brand_kpis
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can create KPIs for their clients" ON public.brand_kpis
  FOR INSERT WITH CHECK (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can update KPIs for their clients" ON public.brand_kpis
  FOR UPDATE USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can delete KPIs for their clients" ON public.brand_kpis
  FOR DELETE USING (public.has_client_access(auth.uid(), client_id));

-- RLS Policies for kpi_history
CREATE POLICY "Users can view KPI history" ON public.kpi_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brand_kpis k 
      WHERE k.id = kpi_id AND public.has_client_access(auth.uid(), k.client_id)
    )
  );

CREATE POLICY "Users can insert KPI history" ON public.kpi_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_kpis k 
      WHERE k.id = kpi_id AND public.has_client_access(auth.uid(), k.client_id)
    )
  );

-- RLS Policies for competitor_tracking
CREATE POLICY "Users can view competitors for their clients" ON public.competitor_tracking
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can manage competitors for their clients" ON public.competitor_tracking
  FOR ALL USING (public.has_client_access(auth.uid(), client_id));

-- RLS Policies for competitor_metrics
CREATE POLICY "Users can view competitor metrics" ON public.competitor_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.competitor_tracking c 
      WHERE c.id = competitor_id AND public.has_client_access(auth.uid(), c.client_id)
    )
  );

CREATE POLICY "Users can manage competitor metrics" ON public.competitor_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.competitor_tracking c 
      WHERE c.id = competitor_id AND public.has_client_access(auth.uid(), c.client_id)
    )
  );

-- RLS Policies for industry_benchmarks (read-only for all authenticated)
CREATE POLICY "Authenticated users can view benchmarks" ON public.industry_benchmarks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage benchmarks" ON public.industry_benchmarks
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'));

-- RLS Policies for brand_health_scores
CREATE POLICY "Users can view health scores for their clients" ON public.brand_health_scores
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can manage health scores for their clients" ON public.brand_health_scores
  FOR ALL USING (public.has_client_access(auth.uid(), client_id));

-- Triggers for updated_at
CREATE TRIGGER update_brand_kpis_updated_at
  BEFORE UPDATE ON public.brand_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_tracking_updated_at
  BEFORE UPDATE ON public.competitor_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industry_benchmarks_updated_at
  BEFORE UPDATE ON public.industry_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update KPI status based on current vs target
CREATE OR REPLACE FUNCTION public.calculate_kpi_status()
RETURNS TRIGGER AS $$
DECLARE
  progress_percent NUMERIC;
BEGIN
  IF NEW.target_value > 0 THEN
    progress_percent := (NEW.current_value / NEW.target_value) * 100;
  ELSE
    progress_percent := 0;
  END IF;
  
  IF progress_percent >= 100 THEN
    NEW.status := 'exceeded';
  ELSIF progress_percent >= COALESCE(NEW.threshold_warning, 80) THEN
    NEW.status := 'on_track';
  ELSIF progress_percent >= COALESCE(NEW.threshold_critical, 60) THEN
    NEW.status := 'at_risk';
  ELSE
    NEW.status := 'behind';
  END IF;
  
  -- Store previous value
  NEW.previous_value := OLD.current_value;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calculate_kpi_status_trigger
  BEFORE UPDATE OF current_value ON public.brand_kpis
  FOR EACH ROW EXECUTE FUNCTION public.calculate_kpi_status();

-- Function to log KPI history on value change
CREATE OR REPLACE FUNCTION public.log_kpi_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_value IS DISTINCT FROM NEW.current_value THEN
    INSERT INTO public.kpi_history (kpi_id, recorded_value, target_value, status)
    VALUES (NEW.id, NEW.current_value, NEW.target_value, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER log_kpi_history_trigger
  AFTER UPDATE OF current_value ON public.brand_kpis
  FOR EACH ROW EXECUTE FUNCTION public.log_kpi_history();

-- Indexes for performance
CREATE INDEX idx_brand_kpis_client_id ON public.brand_kpis(client_id);
CREATE INDEX idx_brand_kpis_status ON public.brand_kpis(status);
CREATE INDEX idx_kpi_history_kpi_id ON public.kpi_history(kpi_id);
CREATE INDEX idx_kpi_history_recorded_at ON public.kpi_history(recorded_at);
CREATE INDEX idx_competitor_tracking_client_id ON public.competitor_tracking(client_id);
CREATE INDEX idx_competitor_metrics_competitor_id ON public.competitor_metrics(competitor_id);
CREATE INDEX idx_brand_health_scores_client_id ON public.brand_health_scores(client_id);