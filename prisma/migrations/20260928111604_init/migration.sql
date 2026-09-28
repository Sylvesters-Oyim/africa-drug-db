-- CreateEnum
CREATE TYPE "ActivityLabel" AS ENUM ('ACTIVE', 'INACTIVE', 'INCONCLUSIVE');

-- CreateTable
CREATE TABLE "Compound" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "smiles" TEXT,
    "inchikey" TEXT,
    "formula" TEXT,
    "sourceRegion" TEXT NOT NULL,
    "sourceNotes" TEXT,
    "diseaseTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assay" (
    "id" TEXT NOT NULL,
    "compoundId" TEXT NOT NULL,
    "assayType" TEXT NOT NULL,
    "target" TEXT,
    "resultValue" DOUBLE PRECISION,
    "resultUnit" TEXT,
    "activityLabel" "ActivityLabel" NOT NULL,
    "reference" TEXT,
    "performedInCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Compound_name_idx" ON "Compound"("name");

-- CreateIndex
CREATE INDEX "Compound_sourceRegion_idx" ON "Compound"("sourceRegion");

-- CreateIndex
CREATE INDEX "Assay_compoundId_idx" ON "Assay"("compoundId");

-- CreateIndex
CREATE INDEX "Assay_activityLabel_idx" ON "Assay"("activityLabel");

-- CreateIndex
CREATE INDEX "Assay_assayType_idx" ON "Assay"("assayType");

-- AddForeignKey
ALTER TABLE "Assay" ADD CONSTRAINT "Assay_compoundId_fkey" FOREIGN KEY ("compoundId") REFERENCES "Compound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
