-- Create team_members table
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  name_hi text,
  departments text[] NOT NULL DEFAULT '{}',
  email text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Team members can view all team members"
ON public.team_members FOR SELECT
USING (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Managers can manage team members"
ON public.team_members FOR ALL
USING (has_role_level(auth.uid(), 'manager'::app_role));

-- Add subtask support and new fields to tasks
ALTER TABLE public.tasks 
ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
ADD COLUMN assigned_member_id uuid REFERENCES public.team_members(id),
ADD COLUMN reminder_date timestamp with time zone,
ADD COLUMN reminder_sent boolean DEFAULT false,
ADD COLUMN estimated_hours numeric,
ADD COLUMN actual_hours numeric,
ADD COLUMN completion_notes text,
ADD COLUMN completed_at timestamp with time zone;

-- Create translations table
CREATE TABLE public.translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  he text NOT NULL,
  en text,
  hi text,
  context text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- RLS policies for translations
CREATE POLICY "Anyone authenticated can view translations"
ON public.translations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage translations"
ON public.translations FOR ALL
USING (has_role_level(auth.uid(), 'manager'::app_role));

-- Insert team members
INSERT INTO public.team_members (name, name_en, name_hi, departments) VALUES
('יוסף אוחיון', 'Yosef Ochion', 'योसेफ ओखियोन', ARRAY['קריאייטיב', 'תוכן', 'אסטרטגיה', 'קופירייטינג', 'קמפיינים', 'ניהול מוצר', 'ניהול פרוייקטים']),
('אלכס רמבה', 'Alex Ramba', 'एलेक्स रम्बा', ARRAY['סטודיו', 'גרפיקה', 'סרטונים', 'כלי AI', 'מיתוג', 'אפיון אתרים', 'UX', 'עיצוב אתרים']),
('מילן פנדיר', 'Milan Pandir', 'मिलान पांडिर', ARRAY['תכנות', 'ניהול אתרים', 'משימות רפטטיביות']);

-- Insert initial translations
INSERT INTO public.translations (key, he, en, hi, context) VALUES
('tasks', 'משימות', 'Tasks', 'कार्य', 'navigation'),
('subtasks', 'תת-משימות', 'Subtasks', 'उप-कार्य', 'tasks'),
('completed', 'הושלם', 'Completed', 'पूर्ण', 'status'),
('pending', 'ממתין', 'Pending', 'लंबित', 'status'),
('in_progress', 'בביצוע', 'In Progress', 'प्रगति में', 'status'),
('reminder', 'תזכורת', 'Reminder', 'अनुस्मारक', 'tasks'),
('due_date', 'תאריך יעד', 'Due Date', 'नियत तारीख', 'tasks'),
('assignee', 'אחראי', 'Assignee', 'जिम्मेदार', 'tasks'),
('department', 'מחלקה', 'Department', 'विभाग', 'general'),
('priority', 'עדיפות', 'Priority', 'प्राथमिकता', 'tasks'),
('high', 'גבוהה', 'High', 'उच्च', 'priority'),
('medium', 'בינונית', 'Medium', 'मध्यम', 'priority'),
('low', 'נמוכה', 'Low', 'कम', 'priority'),
('save', 'שמור', 'Save', 'सहेजें', 'actions'),
('cancel', 'ביטול', 'Cancel', 'रद्द करें', 'actions'),
('edit', 'עריכה', 'Edit', 'संपादित करें', 'actions'),
('delete', 'מחיקה', 'Delete', 'हटाएं', 'actions'),
('add_task', 'הוסף משימה', 'Add Task', 'कार्य जोड़ें', 'actions'),
('add_subtask', 'הוסף תת-משימה', 'Add Subtask', 'उप-कार्य जोड़ें', 'actions'),
('estimated_hours', 'שעות משוערות', 'Estimated Hours', 'अनुमानित घंटे', 'tasks'),
('actual_hours', 'שעות בפועל', 'Actual Hours', 'वास्तविक घंटे', 'tasks'),
('notes', 'הערות', 'Notes', 'टिप्पणियाँ', 'general'),
('team_members', 'חברי צוות', 'Team Members', 'टीम के सदस्य', 'general'),
('parent_task', 'משימת אב', 'Parent Task', 'मूल कार्य', 'tasks'),
('other_completed', 'הושלם על ידי אחרים', 'Completed by Others', 'दूसरों द्वारा पूर्ण', 'status');

-- Update trigger for team_members
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for translations
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();