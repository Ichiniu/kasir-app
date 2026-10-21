import { Prisma } from "@prisma/client"

export async function getRegisterSales(db: Pick<Prisma.TransactionClient, "transaction">, registerId: string) {
  const rows = await db.transaction.groupBy({
    by: ["paymentMethod"],
    where: { cashRegisterId: registerId, paymentStatus: "COMPLETED" },
    _sum: { finalAmount: true },
  })

  return {
    total: rows.reduce((sum, row) => sum.add(row._sum.finalAmount ?? 0), new Prisma.Decimal(0)),
    cash: rows.find((row) => row.paymentMethod === "CASH")?._sum.finalAmount ?? new Prisma.Decimal(0),
    qris: rows.find((row) => row.paymentMethod === "QRIS")?._sum.finalAmount ?? new Prisma.Decimal(0),
  }
}
