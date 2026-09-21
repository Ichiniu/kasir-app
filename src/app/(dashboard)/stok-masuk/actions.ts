"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

export async function createStockIn(data: any) {
  const { outletId, isSuperAdmin } = await getSessionUser()
  const { productId, quantity, cost, price, notes } = data

  const qty = parseInt(quantity)
  const costNum = parseFloat(cost)
  const priceNum = parseFloat(price)

  // Verify product belongs to user's outlet
  const product = await prisma.product.findFirst({
    where: isSuperAdmin ? { id: productId } : { id: productId, outletId: outletId! }
  })

  if (!product) {
    throw new Error("Produk tidak ditemukan atau Anda tidak memiliki akses ke produk ini")
  }

  // Transaction to create adjustment and update product
  await prisma.$transaction([
    prisma.inventoryAdjustment.create({
      data: {
        outletId: product.outletId,
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
  revalidatePath("/produk")

  // Audit Log
  await createLog(
    "UPDATE_STOCK", 
    "PRODUCT", 
    productId, 
    `Penambahan stok produk ${product.name} sebanyak ${qty} ${product.unit}.`,
    null,
    null,
    product.outletId
  )
}
