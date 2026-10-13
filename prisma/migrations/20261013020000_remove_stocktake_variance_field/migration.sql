-- Selisih remains derivable from the saved calculated and physical quantities,
-- but is no longer a configurable/displayed stocktake column.
DELETE FROM "stocktake_fields"
WHERE "key" = 'VARIANCE';

ALTER TABLE "inventory_stocktake_lines"
DROP COLUMN IF EXISTS "variance";
