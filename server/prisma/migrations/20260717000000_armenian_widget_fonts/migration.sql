-- Replace FontStyle enum with commercially free Armenian widget fonts.
CREATE TYPE "FontStyle_new" AS ENUM (
  'vrdznagir',
  'braind_amanor',
  'artsakh',
  'davel_aghvor',
  'mardoto',
  'arti',
  'arian_grqi',
  'braind_zbans',
  'nortar_body',
  'arm_hmks_script',
  'noyemi',
  'armeniapedia_garun',
  'armeniapedia_geghagrutyun',
  'sasuntsi',
  'armeniapedia_jhapaven'
);

ALTER TABLE "widget_settings" ALTER COLUMN "font_style" DROP DEFAULT;

ALTER TABLE "widget_settings"
  ALTER COLUMN "font_style" TYPE "FontStyle_new"
  USING (
    CASE "font_style"::text
      WHEN 'source_serif_4' THEN 'arian_grqi'::"FontStyle_new"
      WHEN 'hanken_grotesk' THEN 'mardoto'::"FontStyle_new"
      ELSE 'mardoto'::"FontStyle_new"
    END
  );

DROP TYPE "FontStyle";

ALTER TYPE "FontStyle_new" RENAME TO "FontStyle";

ALTER TABLE "widget_settings"
  ALTER COLUMN "font_style" SET DEFAULT 'mardoto'::"FontStyle";
