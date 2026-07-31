-- New accounts share profile attribution on by default.
ALTER TABLE "users" ALTER COLUMN "share_profile" SET DEFAULT true;
