-- Retire `manuscript` widget design (remap to parchment) and keep sanctuary last in the app list.
UPDATE "widget_settings"
SET "widget_design" = 'parchment'
WHERE "widget_design" = 'manuscript';

ALTER TYPE "WidgetDesign" RENAME TO "WidgetDesign_old";

CREATE TYPE "WidgetDesign" AS ENUM (
  'classic',
  'parchment',
  'midnight',
  'glass',
  'ink',
  'ember',
  'lagoon',
  'copper',
  'noir',
  'frost',
  'sanctuary'
);

ALTER TABLE "widget_settings"
  ALTER COLUMN "widget_design" DROP DEFAULT;

ALTER TABLE "widget_settings"
  ALTER COLUMN "widget_design" TYPE "WidgetDesign"
  USING ("widget_design"::text::"WidgetDesign");

ALTER TABLE "widget_settings"
  ALTER COLUMN "widget_design" SET DEFAULT 'classic';

DROP TYPE "WidgetDesign_old";
