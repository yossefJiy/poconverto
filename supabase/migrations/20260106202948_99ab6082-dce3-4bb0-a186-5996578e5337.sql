-- Fix JIY Digital Agency to be a regular client (not master account)
UPDATE clients 
SET is_master_account = false 
WHERE name = 'JIY Digital Agency';

-- Add missing modules to global_module_settings
INSERT INTO global_module_settings (module_name, display_name, is_globally_enabled, default_for_basic, default_for_premium, sort_order)
VALUES
  ('projects', 'פרויקטים', true, true, true, 2),
  ('kpis', 'יעדים', true, true, true, 6),
  ('competitors', 'מתחרים', true, false, true, 7),
  ('social', 'סושיאל', true, true, true, 8),
  ('content_studio', 'סטודיו תוכן', true, true, true, 9),
  ('programmatic', 'פרוגרמטי', true, false, true, 11),
  ('ab_tests', 'A/B Tests', true, false, true, 12),
  ('google_shopping', 'Google Shopping', true, false, true, 14),
  ('ai_insights', 'AI Insights', true, false, true, 19),
  ('agency', 'סוכנות', true, false, false, 20)
ON CONFLICT (module_name) DO NOTHING;

-- Update sort_order for existing modules to organize by category
UPDATE global_module_settings SET sort_order = 1 WHERE module_name = 'dashboard';
UPDATE global_module_settings SET sort_order = 3 WHERE module_name = 'tasks';
UPDATE global_module_settings SET sort_order = 4 WHERE module_name = 'team';
UPDATE global_module_settings SET sort_order = 5 WHERE module_name = 'marketing';
UPDATE global_module_settings SET sort_order = 10 WHERE module_name = 'campaigns';
UPDATE global_module_settings SET sort_order = 13 WHERE module_name = 'ecommerce';
UPDATE global_module_settings SET sort_order = 15 WHERE module_name = 'analytics';
UPDATE global_module_settings SET sort_order = 16 WHERE module_name = 'insights';
UPDATE global_module_settings SET sort_order = 17 WHERE module_name = 'reports';
UPDATE global_module_settings SET sort_order = 18 WHERE module_name = 'ai_agent';
UPDATE global_module_settings SET sort_order = 21 WHERE module_name = 'leads';
UPDATE global_module_settings SET sort_order = 22 WHERE module_name = 'billing';
UPDATE global_module_settings SET sort_order = 23 WHERE module_name = 'approvals';