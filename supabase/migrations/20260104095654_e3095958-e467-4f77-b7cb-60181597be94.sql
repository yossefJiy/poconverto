-- Add missing DELETE policy for widget_conversations
CREATE POLICY "Team members can delete conversations for their widgets"
ON public.widget_conversations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM widget_configurations wc
  WHERE wc.id = widget_id AND has_client_access(auth.uid(), wc.client_id)
  AND has_role_level(auth.uid(), 'team_member'::app_role)
));