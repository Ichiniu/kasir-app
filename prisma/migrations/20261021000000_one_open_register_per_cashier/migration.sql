-- Preserve all historical sessions while preventing two open sessions for one cashier at an outlet.
CREATE UNIQUE INDEX "cash_registers_one_open_per_user_outlet"
ON "cash_registers" ("userId", "outletId")
WHERE "status" = 'OPEN';

-- Older closes included QRIS in the expected physical cash balance.
UPDATE "cash_registers" AS register
SET "closingBalance" = register."openingBalance" + COALESCE((
  SELECT SUM(transaction."finalAmount")
  FROM "transactions" AS transaction
  WHERE transaction."cashRegisterId" = register.id
    AND transaction."paymentMethod" = 'CASH'
    AND transaction."paymentStatus" = 'COMPLETED'
), 0)
WHERE register."status" = 'CLOSED';
