"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"
import { z } from "zod"
import { PaymentStatus } from "@prisma/client"

const inputSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().or(z.string().transform(v => parseInt(v))),
    price: z.number().or(z.string().transform(v => parseFloat(v))),
    subtotal: z.number().or(z.string().transform(v => parseFloat(v))),
  })),
  totalAmount: z.number().or(z.string().transform(v => parseFloat(v))),
  discountAmount: z.number().or(z.string().transform(v => parseFloat(v))).optional().default(0),
  taxAmount: z.number().or(z.string().transform(v => parseFloat(v))).optional().default(0),
  finalAmount: z.number().or(z.string().transform(v => parseFloat(v))),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  paymentStatus: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.COMPLETED),
  cashReceived: z.number().or(z.string().transform(v => parseFloat(v))).optional().nullable(),
  changeAmount: z.number().or(z.string().transform(v => parseFloat(v))).optional().nullable(),
  customerName: z.string().optional().nullable(),
  cashRegisterId: z.string().optional().nullable(),
})

export async function createTransaction(rawData: any) {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized: Harap login terlebih dahulu" }
  }

  const { userId, outletId, isSuperAdmin, role } = sessionUser
  if (role === "ADMIN") {
    return { success: false, error: "Akses ditolak: Admin hanya memiliki hak akses read-only di kasir." }
  }

  if (!outletId && !isSuperAdmin) {
    return { success: false, error: "Pengguna tidak terhubung dengan outlet manapun" }
  }

  // Validate Input
  const result = inputSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: "Invalid Data: " + result.error.errors.map(e => e.message).join(", ") }
  }

  const data = result.data

  // 1. Generate Invoice Number (e.g., INV-20231026-0001)
  const date = new Date()
  const dateString = date.toISOString().slice(0, 10).replace(/-/g, "")
  const count = await prisma.transaction.count({
    where: {
      ...(outletId ? { outletId } : {}),
      createdAt: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999))
      }
    }
  })
  const invoiceNumber = `INV-${dateString}-${(count + 1).toString().padStart(4, "0")}`

  // 2. Perform Transaction in a Transaction block
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // Determine effective outletId
      const targetOutletId = outletId || (await tx.outlet.findFirst({ select: { id: true } }))?.id
      if (!targetOutletId) {
        throw new Error("Tidak ada data outlet yang tersedia")
      }

      // If cashRegisterId is passed, verify register belongs to this outlet and user
      if (data.cashRegisterId) {
        const register = await tx.cashRegister.findFirst({
          where: {
            id: data.cashRegisterId,
            outletId: targetOutletId,
            userId: userId,
            status: "OPEN"
          }
        })
        if (!register) {
          throw new Error("Sesi kas tidak valid atau sudah ditutup")
        }
      }

      // Check and update product stocks (ensuring product belongs to same outlet)
      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.id,
            outletId: targetOutletId
          }
        })

        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok produk ${item.name} tidak mencukupi atau produk tidak ditemukan di outlet ini. (Sisa: ${product?.stock ?? 0})`)
        }

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Create the main transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          outletId: targetOutletId,
          invoiceNumber,
          totalAmount: data.totalAmount,
          discountAmount: data.discountAmount,
          taxAmount: data.taxAmount,
          finalAmount: data.finalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          cashReceived: data.cashReceived || null,
          changeAmount: data.changeAmount || null,
          customerName: data.customerName || "Umum",
          userId: userId,
          cashRegisterId: data.cashRegisterId,
          transactionItems: {
            create: data.items.map((item) => ({
              outletId: targetOutletId,
              productId: item.id,
              productName: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          transactionItems: true
        }
      })

      // Update CashRegister total sales only if payment status is COMPLETED
      if (data.cashRegisterId && data.paymentStatus === PaymentStatus.COMPLETED) {
        await tx.cashRegister.update({
          where: { id: data.cashRegisterId },
          data: {
            totalSales: { increment: data.finalAmount }
          }
        })
      }

      return newTransaction
    })

    revalidatePath("/riwayat-penjualan")
    revalidatePath("/produk")
    revalidatePath("/laporan")

    // Audit Log
    await createLog(
      "CREATE_TRANSACTION", 
      "TRANSACTION", 
      transaction.id, 
      `Penjualan No. ${transaction.invoiceNumber} sebesar Rp ${data.finalAmount.toLocaleString('id-ID')}`,
      null,
      null,
      transaction.outletId
    )

    // Serialize transaction for client
    const serializedTransaction = {
      ...transaction,
      totalAmount: Number(transaction.totalAmount),
      discountAmount: Number(transaction.discountAmount),
      taxAmount: Number(transaction.taxAmount),
      finalAmount: Number(transaction.finalAmount),
      cashReceived: transaction.cashReceived ? Number(transaction.cashReceived) : null,
      changeAmount: transaction.changeAmount ? Number(transaction.changeAmount) : null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      transactionItems: transaction.transactionItems.map((item: any) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString()
      }))
    }

    return { success: true, transaction: serializedTransaction }
  } catch (error: any) {
    console.error("Transaction Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getProductsForCashier() {
  const { outletId, isSuperAdmin } = await getSessionUser()
  return await prisma.product.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin ? {} : { outletId: outletId! })
    },
    include: { category: true },
    orderBy: { name: "asc" }
  })
}
