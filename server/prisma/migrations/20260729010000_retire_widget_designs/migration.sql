-- Retire glass/ink/ember/lagoon/copper from the selectable pool.
-- Keep enum values in Postgres (enum value removal is unsafe); remap rows to classic.
UPDATE "widget_settings"
SET "widget_design" = 'classic'
WHERE "widget_design" IN ('glass', 'ink', 'ember', 'lagoon', 'copper');
