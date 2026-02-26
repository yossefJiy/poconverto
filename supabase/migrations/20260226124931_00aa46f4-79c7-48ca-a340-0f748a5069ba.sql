
-- =============================================
-- NEW DAILY TABLES (these don't exist yet)
-- =============================================

-- daily_marketing_metrics
CREATE TABLE IF NOT EXISTS public.daily_marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  platform text NOT NULL,
  account_id text,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  breakdown_key text,
  spend_original numeric NOT NULL DEFAULT 0,
  currency_original text NOT NULL DEFAULT 'ILS',
  spend_reporting numeric NOT NULL DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  conversions numeric DEFAULT 0,
  conversion_value_original numeric DEFAULT 0,
  conversion_value_reporting numeric DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date, campaign_id, breakdown_key)
);

ALTER TABLE public.daily_marketing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_marketing" ON public.daily_marketing_metrics
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_marketing" ON public.daily_marketing_metrics
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_site_metrics
CREATE TABLE IF NOT EXISTS public.daily_site_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  store_platform text NOT NULL,
  orders integer DEFAULT 0,
  gross_sales numeric DEFAULT 0,
  discounts numeric DEFAULT 0,
  refunds numeric DEFAULT 0,
  net_sales numeric DEFAULT 0,
  currency_original text,
  net_sales_reporting numeric DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date)
);

ALTER TABLE public.daily_site_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_site" ON public.daily_site_metrics
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_site" ON public.daily_site_metrics
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_web_analytics_metrics (GA4)
CREATE TABLE IF NOT EXISTS public.daily_web_analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  engaged_sessions integer DEFAULT 0,
  ecommerce_events integer DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date)
);

ALTER TABLE public.daily_web_analytics_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_web" ON public.daily_web_analytics_metrics
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_web" ON public.daily_web_analytics_metrics
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_google_shopping_metrics
CREATE TABLE IF NOT EXISTS public.daily_google_shopping_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  clicks bigint DEFAULT 0,
  impressions bigint DEFAULT 0,
  cost_reporting numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  conversion_value_reporting numeric DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date)
);

ALTER TABLE public.daily_google_shopping_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_shopping" ON public.daily_google_shopping_metrics
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_shopping" ON public.daily_google_shopping_metrics
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_search_console_metrics
CREATE TABLE IF NOT EXISTS public.daily_search_console_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  clicks bigint DEFAULT 0,
  impressions bigint DEFAULT 0,
  ctr numeric DEFAULT 0,
  position numeric DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date)
);

ALTER TABLE public.daily_search_console_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_gsc" ON public.daily_search_console_metrics
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_gsc" ON public.daily_search_console_metrics
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_offline_revenue
CREATE TABLE IF NOT EXISTS public.daily_offline_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  source text NOT NULL CHECK (source IN ('branch', 'fairs', 'phone', 'wholesale', 'other')),
  amount_original numeric NOT NULL DEFAULT 0,
  currency_original text,
  amount_reporting numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, date, source)
);

ALTER TABLE public.daily_offline_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_offline" ON public.daily_offline_revenue
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "client_access_insert_offline" ON public.daily_offline_revenue
  FOR INSERT WITH CHECK (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "client_access_update_offline" ON public.daily_offline_revenue
  FOR UPDATE USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "client_access_delete_offline" ON public.daily_offline_revenue
  FOR DELETE USING (public.has_client_access(auth.uid(), client_id));

-- invoice_payments
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount_original numeric NOT NULL DEFAULT 0,
  currency_original text NOT NULL DEFAULT 'ILS',
  amount_reporting numeric NOT NULL DEFAULT 0,
  method text,
  reference text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_payments" ON public.invoice_payments
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_payments" ON public.invoice_payments
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- daily_cash_received
CREATE TABLE IF NOT EXISTS public.daily_cash_received (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount_reporting numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'icount',
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, integration_id, date)
);

ALTER TABLE public.daily_cash_received ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_access_view_cash" ON public.daily_cash_received
  FOR SELECT USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "admin_manage_cash" ON public.daily_cash_received
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- sync_runs
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  date_from date,
  date_to date,
  platforms jsonb,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'fail', 'partial')),
  error_summary text,
  rows_upserted integer DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_sync_runs" ON public.sync_runs
  FOR SELECT USING (public.has_role_level(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_manage_sync_runs" ON public.sync_runs
  FOR ALL USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- Update invoices table to add missing columns
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS integration_id uuid REFERENCES public.integrations(id),
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_original text NOT NULL DEFAULT 'ILS',
  ADD COLUMN IF NOT EXISTS total_reporting numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_date date,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz DEFAULT now();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_marketing_client_date ON public.daily_marketing_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_marketing_platform ON public.daily_marketing_metrics(platform, date);
CREATE INDEX IF NOT EXISTS idx_daily_site_client_date ON public.daily_site_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_web_client_date ON public.daily_web_analytics_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_offline_client_date ON public.daily_offline_revenue(client_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_date ON public.invoices(client_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_sync_runs_client ON public.sync_runs(client_id, started_at);
