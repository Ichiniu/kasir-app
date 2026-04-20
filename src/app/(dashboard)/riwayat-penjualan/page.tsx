import React from "react"
import { prisma } from "@/lib/prisma"
import { TransactionList } from "./TransactionList"

export default async function RiwayatPenjualanPage() {
  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      transactionItems: true,
      cashRegister: {
        select: {
          id: true,
          openingBalance: true,
          closingBalance: true,
          totalSales: true,
          actualCash: true,
          openedAt: true,
          closedAt: true,
          status: true,
          openingNotes: true,
          closingNotes: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Serialize for Client Component
  const serializableTransactions = transactions.map(t => ({
    ...t,
    totalAmount: Number(t.totalAmount),
    discountAmount: Number(t.discountAmount),
    taxAmount: Number(t.taxAmount),
    finalAmount: Number(t.finalAmount),
    cashReceived: t.cashReceived ? Number(t.cashReceived) : null,
    changeAmount: t.changeAmount ? Number(t.changeAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    cashRegister: t.cashRegister ? {
      ...t.cashRegister,
      openingBalance: Number(t.cashRegister.openingBalance),
      closingBalance: t.cashRegister.closingBalance ? Number(t.cashRegister.closingBalance) : null,
      totalSales: Number(t.cashRegister.totalSales),
      actualCash: t.cashRegister.actualCash ? Number(t.cashRegister.actualCash) : null,
      openedAt: t.cashRegister.openedAt.toISOString(),
      closedAt: t.cashRegister.closedAt?.toISOString() || null
    } : null,
    transactionItems: t.transactionItems.map(item => ({
      ...item,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString()
    }))
  }))

  return (
    <div className="p-6 bg-white min-h-screen">
      <TransactionList initialTransactions={serializableTransactions} />
    </div>
  )
}
