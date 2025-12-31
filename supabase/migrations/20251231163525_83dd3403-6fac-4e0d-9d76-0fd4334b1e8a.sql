-- Task Attachments - נספחים למשימות
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('file', 'link', 'image', 'video')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments for tasks they can access"
ON public.task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
    AND (t.client_id IS NULL OR has_client_access(auth.uid(), t.client_id))
  )
);

CREATE POLICY "Team members can manage attachments"
ON public.task_attachments
FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

-- Task Shares - שיתוף משימות עם לקוחות
CREATE TABLE public.task_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  share_type TEXT NOT NULL DEFAULT 'view' CHECK (share_type IN ('view', 'edit', 'approve')),
  expires_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  UNIQUE(task_id, client_id)
);

-- Enable RLS
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_shares
CREATE POLICY "Team members can manage task shares"
ON public.task_shares
FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Clients can view their shared tasks"
ON public.task_shares
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- Task Comments - תגובות על משימות
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for tasks they can access"
ON public.task_comments
FOR SELECT
USING (
  -- Internal comments only for team members
  (is_internal = false OR has_role_level(auth.uid(), 'team_member'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
    AND (t.client_id IS NULL OR has_client_access(auth.uid(), t.client_id))
  )
);

CREATE POLICY "Team members can create comments"
ON public.task_comments
FOR INSERT
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Users can update their own comments"
ON public.task_comments
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Team leads can delete comments"
ON public.task_comments
FOR DELETE
USING (has_role_level(auth.uid(), 'team_lead'::app_role) OR user_id = auth.uid());

-- Add trigger for updated_at on task_comments
CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments', 
  'task-attachments', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Storage policies for task-attachments bucket
CREATE POLICY "Team members can upload task attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments' 
  AND has_role_level(auth.uid(), 'team_member'::app_role)
);

CREATE POLICY "Team members can view task attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'task-attachments' 
  AND has_role_level(auth.uid(), 'team_member'::app_role)
);

CREATE POLICY "Team members can delete task attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'task-attachments' 
  AND has_role_level(auth.uid(), 'team_lead'::app_role)
);

-- Enable realtime for task_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;