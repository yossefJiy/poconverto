-- Add new columns to planning_templates for system prompt and background context
ALTER TABLE public.planning_templates
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS background_context TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.planning_templates.system_prompt IS 'System prompt sent to Claude - constant per template, benefits from prompt caching';
COMMENT ON COLUMN public.planning_templates.background_context IS 'Background context sent at the start of conversation - constant per template';