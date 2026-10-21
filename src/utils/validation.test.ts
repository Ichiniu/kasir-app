import assert from "node:assert/strict"
import test from "node:test"
import { parseStockInAmounts } from "./validation"

test("stock in accepts positive whole units and nonnegative prices", () => {
  assert.deepEqual(parseStockInAmounts("2", "0", "15000"), { qty: 2, costNum: 0, priceNum: 15000 })
})

test("stock in rejects negative, fractional and missing units", () => {
  for (const qty of ["-2", "1.5", "", null]) {
    assert.throws(() => parseStockInAmounts(qty, "100", "200"))
  }
})

test("stock in rejects invalid prices", () => {
  for (const cost of ["-100", "", "abc"]) {
    assert.throws(() => parseStockInAmounts("2", cost, "200"))
  }
})
