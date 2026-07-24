-- Citation: fold "author" into "source" and make "source" the single mandatory field.
UPDATE "citations"
SET "source" = COALESCE(NULLIF("source", ''), NULLIF("author", ''), 'Անհայտ աղբյուր')
WHERE "source" IS NULL OR "source" = '';

ALTER TABLE "citations" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "citations" DROP COLUMN "author";

-- WidgetSettings: retire the multi-design switcher (single "Սրբավայր" random-image style now).
ALTER TABLE "widget_settings" DROP COLUMN "widget_design";
DROP TYPE "WidgetDesign";

-- WidgetSettings: typography font-size range control + persisted per-citation background image pick.
ALTER TABLE "widget_settings" ADD COLUMN "font_size" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "widget_settings" ADD COLUMN "current_background_image_index" INTEGER NOT NULL DEFAULT 0;
