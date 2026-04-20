"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { PaymentMethod } from "@prisma/client"

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
  paymentMethod: z.nativeEnum(PaymentMethod),
  cashReceived: z.number().or(z.string().transform(v => parseFloat(v))).optional().nullable(),
  changeAmount: z.number().or(z.string().transform(v => parseFloat(v))).optional().nullable(),
  customerName: z.string().optional().nullable(),
  cashRegisterId: z.string().optional().nullable(),
})

export async function createTransaction(rawData: any) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized: Harap login terlebih dahulu" }
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
      // Create the main transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          totalAmount: data.totalAmount,
          discountAmount: data.discountAmount,
          taxAmount: data.taxAmount,
          finalAmount: data.finalAmount,
          paymentMethod: data.paymentMethod,
          cashReceived: data.cashReceived || null,
          changeAmount: data.changeAmount || null,
          customerName: data.customerName || "Umum",
          userId: session.user.id, // Securely use session user ID
          cashRegisterId: data.cashRegisterId,
          transactionItems: {
            create: data.items.map((item) => ({
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

      // Update CashRegister total sales
      if (data.cashRegisterId) {
        await tx.cashRegister.update({
          where: { id: data.cashRegisterId },
          data: {
            totalSales: { increment: data.finalAmount }
          }
        })
      }

      // Update product stocks
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.id }
        })

        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok produk ${item.name} tidak mencukupi atau produk tidak ditemukan. (Sisa: ${product?.stock ?? 0})`)
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
      `Penjualan No. ${transaction.invoiceNumber} sebesar Rp ${data.finalAmount.toLocaleString('id-ID')}`
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
  return await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: "asc" }
  })
}
