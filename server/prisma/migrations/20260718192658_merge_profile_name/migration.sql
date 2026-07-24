/*
  Warnings:

  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.

*/
-- Backfill: prefer the attribution name (first_name + last_name) over the
-- registration name where the user has set one, since it's the identity
-- they've already shown on shared citations. Leaves `name` untouched when
-- both are blank.
UPDATE "users"
SET "name" = TRIM(CONCAT_WS(' ', "first_name", "last_name"))
WHERE COALESCE(TRIM(CONCAT_WS(' ', "first_name", "last_name")), '') <> '';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "first_name",
DROP COLUMN "last_name";

-- AlterTable
ALTER TABLE "widget_settings" ADD COLUMN IF NOT EXISTS "show_actions" BOOLEAN NOT NULL DEFAULT true;
