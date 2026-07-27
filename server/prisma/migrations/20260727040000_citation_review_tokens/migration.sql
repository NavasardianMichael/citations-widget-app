-- CreateEnum
CREATE TYPE "CitationReviewAction" AS ENUM ('approve', 'reject');

-- CreateTable
CREATE TABLE "citation_review_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "citation_id" TEXT NOT NULL,
    "action" "CitationReviewAction" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_review_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citation_review_tokens_token_key" ON "citation_review_tokens"("token");

-- CreateIndex
CREATE INDEX "citation_review_tokens_citation_id_idx" ON "citation_review_tokens"("citation_id");

-- CreateIndex
CREATE INDEX "citation_review_tokens_token_idx" ON "citation_review_tokens"("token");

-- AddForeignKey
ALTER TABLE "citation_review_tokens" ADD CONSTRAINT "citation_review_tokens_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
