CREATE TYPE "StocktakeShift" AS ENUM ('MORNING', 'AFTERNOON');
CREATE TYPE "StocktakeStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');
CREATE TYPE "StocktakeFieldType" AS ENUM ('TEXT', 'NUMBER');
CREATE TYPE "MaterialRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_stocktakes" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "StocktakeShift" NOT NULL,
    "status" "StocktakeStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "reviewNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "fieldsSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_stocktakes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_stocktake_lines" (
    "id" TEXT NOT NULL,
    "stocktakeId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "openingStock" DECIMAL(12,3) NOT NULL,
    "incoming" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "outgoing" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "endingStock" DECIMAL(12,3) NOT NULL,
    "physicalStock" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    "extraValues" JSONB,
    CONSTRAINT "inventory_stocktake_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stocktake_fields" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "StocktakeFieldType" NOT NULL DEFAULT 'TEXT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stocktake_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_requests" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "forDate" DATE NOT NULL,
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "reviewNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_request_lines" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "material_request_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "raw_materials_outletId_name_key" ON "raw_materials"("outletId", "name");
CREATE UNIQUE INDEX "stocktake_fields_outletId_key_key" ON "stocktake_fields"("outletId", "key");
CREATE INDEX "raw_materials_outletId_isActive_idx" ON "raw_materials"("outletId", "isActive");
CREATE INDEX "stocktake_fields_outletId_isActive_position_idx" ON "stocktake_fields"("outletId", "isActive", "position");
CREATE UNIQUE INDEX "inventory_stocktakes_outletId_date_shift_key" ON "inventory_stocktakes"("outletId", "date", "shift");
CREATE INDEX "inventory_stocktakes_outletId_status_date_idx" ON "inventory_stocktakes"("outletId", "status", "date");
CREATE UNIQUE INDEX "inventory_stocktake_lines_stocktakeId_rawMaterialId_key" ON "inventory_stocktake_lines"("stocktakeId", "rawMaterialId");
CREATE INDEX "inventory_stocktake_lines_rawMaterialId_idx" ON "inventory_stocktake_lines"("rawMaterialId");
CREATE UNIQUE INDEX "material_requests_outletId_forDate_key" ON "material_requests"("outletId", "forDate");
CREATE INDEX "material_requests_outletId_status_forDate_idx" ON "material_requests"("outletId", "status", "forDate");
CREATE UNIQUE INDEX "material_request_lines_requestId_rawMaterialId_key" ON "material_request_lines"("requestId", "rawMaterialId");
CREATE INDEX "material_request_lines_rawMaterialId_idx" ON "material_request_lines"("rawMaterialId");

ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocktake_fields" ADD CONSTRAINT "stocktake_fields_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocktakes" ADD CONSTRAINT "inventory_stocktakes_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocktakes" ADD CONSTRAINT "inventory_stocktakes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocktakes" ADD CONSTRAINT "inventory_stocktakes_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_stocktake_lines" ADD CONSTRAINT "inventory_stocktake_lines_stocktakeId_fkey" FOREIGN KEY ("stocktakeId") REFERENCES "inventory_stocktakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_stocktake_lines" ADD CONSTRAINT "inventory_stocktake_lines_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "material_request_lines" ADD CONSTRAINT "material_request_lines_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "material_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_request_lines" ADD CONSTRAINT "material_request_lines_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "stocktake_fields" ("id", "outletId", "key", "label", "type", "position", "isCore", "updatedAt")
SELECT 'field_' || md5(o."id" || ':' || f."key"), o."id", f."key", f."label", f."type"::"StocktakeFieldType", f."position", true, CURRENT_TIMESTAMP
FROM "outlets" o
CROSS JOIN (VALUES
    ('ITEM', 'Item', 'TEXT', 0),
    ('OPENING', 'Stock Awal', 'NUMBER', 1),
    ('INCOMING', 'Masuk', 'NUMBER', 2),
    ('OUTGOING', 'Keluar', 'NUMBER', 3),
    ('ENDING', 'Stock Akhir', 'NUMBER', 4),
    ('PHYSICAL', 'Hitung Fisik', 'NUMBER', 5),
    ('NOTES', 'Keterangan', 'TEXT', 6)
) AS f("key", "label", "type", "position");
