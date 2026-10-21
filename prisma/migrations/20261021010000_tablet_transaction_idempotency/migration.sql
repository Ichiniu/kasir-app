ALTER TABLE "transactions" ADD COLUMN "clientRequestId" TEXT;
CREATE UNIQUE INDEX "transactions_clientRequestId_key" ON "transactions"("clientRequestId");
