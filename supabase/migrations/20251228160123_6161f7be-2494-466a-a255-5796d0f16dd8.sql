-- Add profitability settings columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS avg_profit_margin numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS jiy_commission_percent numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.avg_profit_margin IS 'Average profit margin percentage for the client';
COMMENT ON COLUMN public.clients.jiy_commission_percent IS 'JIY commission percentage for the client';