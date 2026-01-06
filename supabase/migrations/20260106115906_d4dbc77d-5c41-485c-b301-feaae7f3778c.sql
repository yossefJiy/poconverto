-- Create role simulation audit log table
CREATE TABLE public.role_simulation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actual_role text NOT NULL,
  simulated_role text NOT NULL,
  simulated_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  simulated_contact_id uuid REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('start', 'stop', 'switch')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_simulation_log ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_role_simulation_log_user_id ON public.role_simulation_log(user_id);
CREATE INDEX idx_role_simulation_log_created_at ON public.role_simulation_log(created_at DESC);

-- Policy: Admins can view all simulation logs
CREATE POLICY "Admins can view simulation logs"
  ON public.role_simulation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_emails ae
      WHERE ae.email = auth.jwt()->>'email'
      AND ae.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Users can insert their own simulation logs
CREATE POLICY "Users can insert their own logs"
  ON public.role_simulation_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());