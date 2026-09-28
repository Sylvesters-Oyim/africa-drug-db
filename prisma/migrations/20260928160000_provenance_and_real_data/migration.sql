-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('LITERATURE', 'DATABASE', 'LAB_DEPOSIT', 'OTHER');

-- AlterTable Compound: add optional columns first
ALTER TABLE "Compound" ADD COLUMN "code" TEXT;
ALTER TABLE "Compound" ADD COLUMN "sourceType" "SourceType";
ALTER TABLE "Compound" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "Compound" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Compound" ADD COLUMN "doi" TEXT;
ALTER TABLE "Compound" ADD COLUMN "citation" TEXT;
ALTER TABLE "Compound" ADD COLUMN "license" TEXT;
ALTER TABLE "Compound" ADD COLUMN "sourceRecordId" TEXT;
ALTER TABLE "Compound" ADD COLUMN "countryOfOrigin" TEXT;
ALTER TABLE "Compound" ADD COLUMN "collectionDate" TIMESTAMP(3);
ALTER TABLE "Compound" ADD COLUMN "absPermitRef" TEXT;
ALTER TABLE "Compound" ADD COLUMN "isExample" BOOLEAN NOT NULL DEFAULT false;

-- Backfill compound codes from names like "ADD-0001 ..." (seed pattern)
UPDATE "Compound"
SET "code" = UPPER(SUBSTRING("name" FROM '^([A-Za-z]+-[0-9]+)'))
WHERE "code" IS NULL
  AND "name" ~ '^[A-Za-z]+-[0-9]+';

-- Any remaining rows without a parseable code get a stable placeholder from id
UPDATE "Compound"
SET "code" = 'LEGACY-' || UPPER(SUBSTRING("id" FROM 1 FOR 8))
WHERE "code" IS NULL;

ALTER TABLE "Compound" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Compound_code_key" ON "Compound"("code");

-- Flag all pre-existing rows as example/demo data
UPDATE "Compound" SET "isExample" = true;

-- AlterTable Assay
ALTER TABLE "Assay" ADD COLUMN "organism" TEXT;
ALTER TABLE "Assay" ADD COLUMN "measurementType" TEXT;
ALTER TABLE "Assay" ADD COLUMN "relation" TEXT;
ALTER TABLE "Assay" ADD COLUMN "sourceType" "SourceType";
ALTER TABLE "Assay" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "Assay" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Assay" ADD COLUMN "doi" TEXT;
ALTER TABLE "Assay" ADD COLUMN "citation" TEXT;
ALTER TABLE "Assay" ADD COLUMN "license" TEXT;
ALTER TABLE "Assay" ADD COLUMN "sourceRecordId" TEXT;
ALTER TABLE "Assay" ADD COLUMN "isExample" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Assay" SET "isExample" = true;

-- Indexes
CREATE INDEX "Compound_isExample_idx" ON "Compound"("isExample");
CREATE INDEX "Compound_countryOfOrigin_idx" ON "Compound"("countryOfOrigin");
CREATE INDEX "Assay_isExample_idx" ON "Assay"("isExample");
CREATE INDEX "Assay_sourceRecordId_idx" ON "Assay"("sourceRecordId");
