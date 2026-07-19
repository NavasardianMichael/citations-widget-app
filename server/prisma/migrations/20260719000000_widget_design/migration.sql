-- CreateEnum
CREATE TYPE "WidgetDesign" AS ENUM (
  'classic',
  'parchment',
  'midnight',
  'glass',
  'ink',
  'manuscript'
);

-- AlterTable
ALTER TABLE "widget_settings"
  ADD COLUMN "widget_design" "WidgetDesign" NOT NULL DEFAULT 'classic';
