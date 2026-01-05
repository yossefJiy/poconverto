-- Add INSERT policy for projects table
CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add UPDATE policy for projects table  
CREATE POLICY "Team members can update projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team t
    WHERE t.user_id = auth.uid()
    AND t.is_active = true
  )
);

-- Add DELETE policy for projects table
CREATE POLICY "Team members can delete projects"
ON public.projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team t
    WHERE t.user_id = auth.uid()
    AND t.is_active = true
  )
);