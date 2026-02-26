
-- Add missing columns to clients table per master spec
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Jerusalem',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ILS',
  ADD COLUMN IF NOT EXISTS revenue_model text NOT NULL DEFAULT 'online_only';

-- Add is_active column to integrations (maps from is_connected)
ALTER TABLE public.integrations 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Copy existing is_connected values to is_active
UPDATE public.integrations SET is_active = is_connected;

-- Add integration_id to invoices if missing as FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_integration_id_fkey' AND table_name = 'invoices'
  ) THEN
    -- integration_id column already exists, just add FK if possible
    ALTER TABLE public.invoices 
      ADD CONSTRAINT invoices_integration_id_fkey 
      FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ensure RLS on all new daily tables
ALTER TABLE public.daily_marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_site_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_web_analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_offline_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_google_shopping_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_search_console_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily tables - users with client access can read
CREATE POLICY "Users can read daily_marketing_metrics for their clients" 
  ON public.daily_marketing_metrics FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_site_metrics for their clients" 
  ON public.daily_site_metrics FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_web_analytics_metrics for their clients" 
  ON public.daily_web_analytics_metrics FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_offline_revenue for their clients" 
  ON public.daily_offline_revenue FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Admins can insert daily_offline_revenue" 
  ON public.daily_offline_revenue FOR INSERT 
  WITH CHECK (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Admins can update daily_offline_revenue" 
  ON public.daily_offline_revenue FOR UPDATE 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Admins can delete daily_offline_revenue" 
  ON public.daily_offline_revenue FOR DELETE 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_google_shopping_metrics for their clients" 
  ON public.daily_google_shopping_metrics FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_search_console_metrics for their clients" 
  ON public.daily_search_console_metrics FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read daily_cash_received for their clients" 
  ON public.daily_cash_received FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read invoices for their clients" 
  ON public.invoices FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can read invoice_payments for their clients" 
  ON public.invoice_payments FOR SELECT 
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Admins can read sync_runs" 
  ON public.sync_runs FOR SELECT 
  USING (public.has_role_level(auth.uid(), 'employee'::app_role));

-- Add indexes for performance on daily tables
CREATE INDEX IF NOT EXISTS idx_daily_marketing_client_date ON public.daily_marketing_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_marketing_platform ON public.daily_marketing_metrics(client_id, platform, date);
CREATE INDEX IF NOT EXISTS idx_daily_site_client_date ON public.daily_site_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_web_client_date ON public.daily_web_analytics_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_offline_client_date ON public.daily_offline_revenue(client_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_date ON public.invoices(client_id, invoice_date);
