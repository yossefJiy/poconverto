-- טבלת חבילות קרדיטים
CREATE TABLE public.client_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  hours_equivalent NUMERIC NOT NULL,
  price_per_hour NUMERIC NOT NULL DEFAULT 218,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- טבלת קרדיטים ללקוח
CREATE TABLE public.client_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.client_credit_packages(id),
  total_credits INTEGER NOT NULL DEFAULT 1200,
  used_credits INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  is_active BOOLEAN DEFAULT true,
  show_credits_to_client BOOLEAN DEFAULT true,
  notify_at_percentage INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- היסטוריית עסקאות קרדיטים
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_credit_id UUID REFERENCES public.client_credits(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  credits_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('task_deduction', 'purchase', 'refund', 'bonus', 'adjustment')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- בקשות משימות מלקוחות
CREATE TABLE public.task_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requested_by UUID,
  estimated_credits INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- התראות קרדיטים
CREATE TABLE public.credit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_credits', 'credits_exceeded', 'period_ending', 'credits_added')),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- הוספת עלות קרדיטים למשימות
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS credits_cost INTEGER DEFAULT 60;

-- Enable RLS
ALTER TABLE public.client_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_credit_packages (everyone can read, team manages)
CREATE POLICY "Anyone can view credit packages"
ON public.client_credit_packages FOR SELECT
USING (true);

CREATE POLICY "Team members can manage credit packages"
ON public.client_credit_packages FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for client_credits
CREATE POLICY "Users can view credits for assigned clients"
ON public.client_credits FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage client credits"
ON public.client_credits FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view transactions for assigned clients"
ON public.credit_transactions FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage transactions"
ON public.credit_transactions FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for task_requests
CREATE POLICY "Users can view requests for assigned clients"
ON public.task_requests FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can create requests for assigned clients"
ON public.task_requests FOR INSERT
WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage all requests"
ON public.task_requests FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for credit_alerts
CREATE POLICY "Users can view alerts for assigned clients"
ON public.credit_alerts FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Users can update own alerts"
ON public.credit_alerts FOR UPDATE
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage all alerts"
ON public.credit_alerts FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- Insert default credit package
INSERT INTO public.client_credit_packages (name, credits, hours_equivalent, price_per_hour, is_default)
VALUES ('חבילה סטנדרטית', 1200, 20, 218, true);

-- Indexes for performance
CREATE INDEX idx_client_credits_client_id ON public.client_credits(client_id);
CREATE INDEX idx_client_credits_active ON public.client_credits(is_active) WHERE is_active = true;
CREATE INDEX idx_credit_transactions_client_id ON public.credit_transactions(client_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_task_requests_client_id ON public.task_requests(client_id);
CREATE INDEX idx_task_requests_status ON public.task_requests(status);
CREATE INDEX idx_credit_alerts_client_id ON public.credit_alerts(client_id);
CREATE INDEX idx_credit_alerts_unread ON public.credit_alerts(is_read) WHERE is_read = false;

-- Trigger to update updated_at
CREATE TRIGGER update_client_credits_updated_at
BEFORE UPDATE ON public.client_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_requests_updated_at
BEFORE UPDATE ON public.task_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_credit_packages_updated_at
BEFORE UPDATE ON public.client_credit_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();