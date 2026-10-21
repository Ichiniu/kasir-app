import assert from "node:assert/strict"
import test from "node:test"
import { Prisma } from "@prisma/client"
import { getRegisterSales } from "./register-sales"

test("physical cash excludes QRIS while total sales includes it", async () => {
  const db = {
    transaction: {
      groupBy: async (query: { where: unknown }) => {
        assert.deepEqual(query.where, { cashRegisterId: "register-1", paymentStatus: "COMPLETED" })
        return [
          { paymentMethod: "CASH", _sum: { finalAmount: new Prisma.Decimal(50000) } },
          { paymentMethod: "QRIS", _sum: { finalAmount: new Prisma.Decimal(100000) } },
        ]
      },
    },
  } as unknown as Parameters<typeof getRegisterSales>[0]

  const sales = await getRegisterSales(db, "register-1")
  assert.equal(sales.total.toString(), "150000")
  assert.equal(sales.cash.toString(), "50000")
  assert.equal(sales.qris.toString(), "100000")
})

test("a register without sales has zero cash and total", async () => {
  const db = { transaction: { groupBy: async () => [] } } as unknown as Parameters<typeof getRegisterSales>[0]
  const sales = await getRegisterSales(db, "register-1")
  assert.equal(sales.total.toString(), "0")
  assert.equal(sales.cash.toString(), "0")
  assert.equal(sales.qris.toString(), "0")
})
