-- Align WidgetSettings with @citations/shared:
-- DEFAULT_QUOTE_FONT_SIZE (24) and DEFAULT_WIDGET_DESIGN (sanctuary / Սրբավայր).
-- App not published yet — force existing rows, not only column defaults.
ALTER TABLE "widget_settings" ALTER COLUMN "font_size" SET DEFAULT 24;
ALTER TABLE "widget_settings" ALTER COLUMN "widget_design" SET DEFAULT 'sanctuary';

UPDATE "widget_settings" SET "font_size" = 24;
UPDATE "widget_settings" SET "widget_design" = 'sanctuary';
