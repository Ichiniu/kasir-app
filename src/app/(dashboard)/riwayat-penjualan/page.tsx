import React from "react"
import { prisma } from "@/lib/prisma"
import { TransactionList } from "./TransactionList"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

// Helper to get YYYY-MM-DD in Asia/Jakarta timezone
function getJakartaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
}

// Converts a YYYY-MM-DD string to start of that day in Jakarta (as UTC Date for DB query)
function jakartaStartOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - WIB_OFFSET_MS)
}

// Converts a YYYY-MM-DD string to end of that day in Jakarta (as UTC Date for DB query)
function jakartaEndOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - WIB_OFFSET_MS)
}

export default async function RiwayatPenjualanPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  let sessionUser
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { outletId, isSuperAdmin } = sessionUser

  const sp = await searchParams
  const todayKey = getJakartaDateKey(new Date())
  const selectedDateKey = sp?.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKey

  const start = jakartaStartOfDay(selectedDateKey)
  const end = jakartaEndOfDay(selectedDateKey)

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(isSuperAdmin ? {} : { outletId: outletId! }),
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
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
          closingNotes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Serialize for Client Component
  const serializableTransactions = transactions.map((t) => ({
    ...t,
    customerName: t.customerName || "Pelanggan",
    totalAmount: Number(t.totalAmount),
    discountAmount: Number(t.discountAmount),
    taxAmount: Number(t.taxAmount),
    finalAmount: Number(t.finalAmount),
    cashReceived: t.cashReceived ? Number(t.cashReceived) : null,
    changeAmount: t.changeAmount ? Number(t.changeAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    cashRegisterId: t.cashRegisterId || "",
    cashRegister: t.cashRegister
      ? {
          ...t.cashRegister,
          openingBalance: Number(t.cashRegister.openingBalance),
          closingBalance: t.cashRegister.closingBalance ? Number(t.cashRegister.closingBalance) : null,
          totalSales: Number(t.cashRegister.totalSales),
          actualCash: t.cashRegister.actualCash ? Number(t.cashRegister.actualCash) : null,
          openedAt: t.cashRegister.openedAt.toISOString(),
          closedAt: t.cashRegister.closedAt?.toISOString() || null,
        }
      : null,
    transactionItems: t.transactionItems.map((item) => ({
      ...item,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <TransactionList 
        initialTransactions={serializableTransactions} 
        currentDate={selectedDateKey}
      />
    </div>
  )
}
