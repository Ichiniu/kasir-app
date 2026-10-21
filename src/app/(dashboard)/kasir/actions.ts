"use server"

import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"
import { z } from "zod"
import { findPreviousSale } from "@/lib/transaction-idempotency"

const inputSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  cashReceived: z.coerce.number().finite().nonnegative().nullable().optional(),
  customerName: z.string().trim().max(120).nullable().optional(),
  cashRegisterId: z.string().min(1),
  clientRequestId: z.string().uuid().optional(),
}).superRefine((data, context) => {
  if (data.paymentMethod === "CASH" && data.cashReceived == null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cashReceived"],
      message: "Jumlah uang tunai wajib diisi",
    })
  }
})

export async function createTransaction(rawData: unknown) {
  let sessionUser
  try {
    sessionUser = await getSessionUser()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized: Harap login terlebih dahulu"
    return { success: false, error: message }
  }

  const { userId, outletId, isSuperAdmin, role } = sessionUser
  if (role === "ADMIN") {
    return { success: false, error: "Akses ditolak: Admin hanya memiliki hak akses read-only di kasir." }
  }
  if (role !== "CASHIER" && role !== "SUPERADMIN") {
    return { success: false, error: "Akses ditolak" }
  }
  if (!outletId && !isSuperAdmin) {
    return { success: false, error: "Pengguna tidak terhubung dengan outlet manapun" }
  }

  const result = inputSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: "Data transaksi tidak valid" }
  }

  const data = result.data

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const findPrevious = async () => data.clientRequestId
        ? tx.transaction.findUnique({
          where: { clientRequestId: data.clientRequestId },
          include: { transactionItems: true },
        })
        : null
      const previous = await findPreviousSale(findPrevious, userId, data.cashRegisterId)
      if (previous) {
        return { transaction: previous, isNew: false }
      }

      // Hold the register row until the sale commits, so closing waits for this sale.
      const locked = await tx.cashRegister.updateMany({
        where: {
          id: data.cashRegisterId,
          userId,
          status: "OPEN",
          ...(outletId ? { outletId } : {}),
        },
        data: { totalSales: { increment: 0 } },
      })
      if (locked.count !== 1) {
        throw new Error("Sesi kas tidak valid atau sudah ditutup")
      }

      const register = await tx.cashRegister.findUnique({
        where: { id: data.cashRegisterId },
        select: { id: true, outletId: true },
      })
      if (!register) throw new Error("Sesi kas tidak valid atau sudah ditutup")

      if (data.clientRequestId) {
        const existing = await findPreviousSale(findPrevious, userId, register.id)
        if (existing) {
          return { transaction: existing, isNew: false }
        }
      }

      const targetOutletId = register.outletId
      const quantities = new Map<string, number>()
      for (const item of data.items) {
        quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity)
      }

      const products = await tx.product.findMany({
        where: {
          id: { in: Array.from(quantities.keys()) },
          outletId: targetOutletId,
          isActive: true,
        },
        select: { id: true, name: true, price: true },
      })
      if (products.length !== quantities.size) {
        throw new Error("Satu atau lebih produk tidak aktif atau tidak tersedia di outlet ini")
      }

      const productById = new Map(products.map(product => [product.id, product]))
      const transactionItems: Array<{
        outletId: string
        productId: string
        productName: string
        quantity: number
        price: Prisma.Decimal
        subtotal: Prisma.Decimal
      }> = []
      let totalAmount = new Prisma.Decimal(0)

      for (const [productId, quantity] of quantities) {
        const product = productById.get(productId)!
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: productId,
            outletId: targetOutletId,
            isActive: true,
            stock: { gte: quantity },
          },
          data: { stock: { decrement: quantity } },
        })
        if (stockUpdate.count !== 1) {
          throw new Error(`Stok produk ${product.name} tidak mencukupi`)
        }

        const price = new Prisma.Decimal(product.price)
        const subtotal = price.mul(quantity)
        totalAmount = totalAmount.add(subtotal)
        transactionItems.push({
          outletId: targetOutletId,
          productId,
          productName: product.name,
          quantity,
          price,
          subtotal,
        })
      }

      const cashReceived = data.paymentMethod === "CASH" && data.cashReceived != null
        ? new Prisma.Decimal(data.cashReceived)
        : null
      if (data.paymentMethod === "CASH" && cashReceived!.lessThan(totalAmount)) {
        throw new Error("Pembayaran tunai kurang")
      }
      const changeAmount = cashReceived ? cashReceived.sub(totalAmount) : new Prisma.Decimal(0)
      const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const invoiceNumber = `INV-${dateString}-${randomUUID().replace(/-/g, "").toUpperCase()}`

      const newTransaction = await tx.transaction.create({
        data: {
          outletId: targetOutletId,
          invoiceNumber,
          totalAmount,
          discountAmount: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          finalAmount: totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: "COMPLETED",
          cashReceived,
          changeAmount,
          customerName: data.customerName || "Umum",
          userId,
          cashRegisterId: register.id,
          clientRequestId: data.clientRequestId,
          transactionItems: { create: transactionItems },
        },
        include: { transactionItems: true },
      })

      await tx.cashRegister.update({
        where: { id: register.id },
        data: { totalSales: { increment: totalAmount } },
      })

      return { transaction: newTransaction, isNew: true }
    })

    revalidatePath("/riwayat-penjualan")
    revalidatePath("/produk")
    revalidatePath("/laporan")

    if (transaction.isNew) await createLog(
      "CREATE_TRANSACTION",
      "TRANSACTION",
      transaction.transaction.id,
      `Penjualan No. ${transaction.transaction.invoiceNumber} sebesar Rp ${Number(transaction.transaction.finalAmount).toLocaleString("id-ID")}`,
      null,
      null,
      transaction.transaction.outletId,
    )

    const serializedTransaction = {
      ...transaction.transaction,
      totalAmount: Number(transaction.transaction.totalAmount),
      discountAmount: Number(transaction.transaction.discountAmount),
      taxAmount: Number(transaction.transaction.taxAmount),
      finalAmount: Number(transaction.transaction.finalAmount),
      cashReceived: transaction.transaction.cashReceived ? Number(transaction.transaction.cashReceived) : null,
      changeAmount: transaction.transaction.changeAmount ? Number(transaction.transaction.changeAmount) : null,
      createdAt: transaction.transaction.createdAt.toISOString(),
      updatedAt: transaction.transaction.updatedAt.toISOString(),
      transactionItems: transaction.transaction.transactionItems.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    }

    return { success: true, transaction: serializedTransaction }
  } catch (error: unknown) {
    console.error("Transaction Error:", error)
    const message = error instanceof Error ? error.message : "Gagal memproses transaksi"
    return { success: false, error: message }
  }
}

export async function getProductsForCashier() {
  const { outletId, isSuperAdmin } = await getSessionUser()
  return await prisma.product.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin ? {} : { outletId: outletId! }),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  })
}
