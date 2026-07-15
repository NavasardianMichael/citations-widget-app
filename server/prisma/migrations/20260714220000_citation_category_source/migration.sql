-- AlterEnum
CREATE TYPE "CitationCategory" AS ENUM ('bible', 'fiction');

-- AlterTable: rename columns and drop tags
ALTER TABLE "citations" RENAME COLUMN "source_ref" TO "source";
ALTER TABLE "citations" ADD COLUMN "category" "CitationCategory";

UPDATE "citations" SET "category" = CASE
  WHEN "source_type"::text = 'bible' THEN 'bible'::"CitationCategory"
  ELSE 'fiction'::"CitationCategory"
END;

ALTER TABLE "citations" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "citations" DROP COLUMN "source_type";
ALTER TABLE "citations" DROP COLUMN "tags";

DROP TYPE "SourceType";

-- DropIndex
DROP INDEX IF EXISTS "citations_status_source_type_idx";

-- CreateIndex
CREATE INDEX "citations_status_category_idx" ON "citations"("status", "category");
