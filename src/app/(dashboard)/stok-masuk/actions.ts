"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"

export async function createStockIn(data: any) {
  const { productId, quantity, cost, price, notes } = data

  const qty = parseInt(quantity)
  const costNum = parseFloat(cost)
  const priceNum = parseFloat(price)

  // Transaction to create adjustment and update product
  await prisma.$transaction([
    prisma.inventoryAdjustment.create({
      data: {
        productId,
        quantity: qty,
        cost: costNum,
        price: priceNum,
        notes,
        type: "IN"
      }
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        stock: { increment: qty },
        cost: costNum,
        price: priceNum
      }
    })
  ])

  revalidatePath("/stok-masuk")

  // Audit Log
  const product = await prisma.product.findUnique({ where: { id: productId } })
  await createLog(
    "UPDATE_STOCK", 
    "PRODUCT", 
    productId, 
    `Penambahan stok produk ${product?.name} sebanyak ${qty} ${product?.unit}.`
  )
}
