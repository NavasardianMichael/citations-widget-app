-- Move share_profile from citations (per-row) to users (per-account).

ALTER TABLE "users" ADD COLUMN "share_profile" BOOLEAN NOT NULL DEFAULT false;

-- Preserve prior opt-ins: any user who shared on at least one citation stays opted in.
UPDATE "users" AS u
SET "share_profile" = true
WHERE EXISTS (
  SELECT 1
  FROM "citations" AS c
  WHERE c."submitted_by_user_id" = u."id"
    AND c."share_profile" = true
);

ALTER TABLE "citations" DROP COLUMN "share_profile";
