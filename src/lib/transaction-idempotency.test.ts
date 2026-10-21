import assert from "node:assert/strict"
import { test } from "node:test"
import { findPreviousSale } from "./transaction-idempotency"

test("retry returns the same sale for its cashier and register", async () => {
  const sale = { id: "sale-1", userId: "cashier-1", cashRegisterId: "register-1" }
  assert.equal(await findPreviousSale(async () => sale, "cashier-1", "register-1"), sale)
  assert.equal(await findPreviousSale(async () => null, "cashier-1", "register-1"), null)
})

test("request id cannot retrieve another cashier or register's sale", async () => {
  const sale = { userId: "cashier-1", cashRegisterId: "register-1" }
  await assert.rejects(() => findPreviousSale(async () => sale, "cashier-2", "register-1"))
  await assert.rejects(() => findPreviousSale(async () => sale, "cashier-1", "register-2"))
})
