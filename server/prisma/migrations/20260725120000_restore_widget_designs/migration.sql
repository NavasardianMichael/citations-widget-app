-- Restore multi-design widget styles: 6 solids + sanctuary (random photo pool).
-- Sanctuary uses current_background_image_index as an ephemeral pick for the
-- current citation window only — not a permanent citation property.
CREATE TYPE "WidgetDesign" AS ENUM (
  'classic',
  'parchment',
  'midnight',
  'glass',
  'ink',
  'manuscript',
  'sanctuary'
);

ALTER TABLE "widget_settings"
ADD COLUMN "widget_design" "WidgetDesign" NOT NULL DEFAULT 'classic';
