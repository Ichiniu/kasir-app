CREATE TABLE "product_skus" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_skus_outletId_code_key" ON "product_skus"("outletId", "code");
CREATE INDEX "product_skus_outletId_idx" ON "product_skus"("outletId");

ALTER TABLE "products" ADD COLUMN "skuId" TEXT;
CREATE UNIQUE INDEX "products_skuId_key" ON "products"("skuId");

INSERT INTO "product_skus" ("id", "outletId", "code")
SELECT 'sku_' || md5(p."outletId" || ':' || p."sku"), p."outletId", p."sku"
FROM "products" p
GROUP BY p."outletId", p."sku";

UPDATE "products" p
SET "skuId" = s."id"
FROM "product_skus" s
WHERE s."outletId" = p."outletId" AND s."code" = p."sku";

ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_outletId_fkey"
    FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_skuId_fkey"
    FOREIGN KEY ("skuId") REFERENCES "product_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
