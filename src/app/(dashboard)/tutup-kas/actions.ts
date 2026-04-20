"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/audit"

export async function getActiveRegister() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
      status: "OPEN"
    },
    select: {
      id: true,
      openingBalance: true,
      openedAt: true
    }
  })

  if (!activeRegister) return null

  // Get total sales for this specific register session
  const transactions = await prisma.transaction.findMany({
    where: {
      cashRegisterId: activeRegister.id
    }
  })

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.finalAmount), 0)

  return {
    id: activeRegister.id,
    openingBalance: Number(activeRegister.openingBalance),
    totalSales: totalSales,
    openedAt: activeRegister.openedAt.toISOString()
  }
}

export async function closeCashRegister(actualCash: number, notes?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
      status: "OPEN"
    },
    select: {
      id: true,
      openingBalance: true
    }
  })

  if (!activeRegister) throw new Error("No active register found")

  // Calculate closing balance (Opening + Total Sales)
  const transactions = await prisma.transaction.findMany({
    where: { cashRegisterId: activeRegister.id }
  })
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.finalAmount), 0)
  const closingBalance = Number(activeRegister.openingBalance) + totalSales

  await prisma.cashRegister.update({
    where: { id: activeRegister.id },
    data: {
      status: "CLOSED",
      closingBalance: closingBalance,
      actualCash: actualCash,
      totalSales: totalSales,
      closedAt: new Date(),
      closingNotes: notes
    }
  })

  revalidatePath("/kasir")
  revalidatePath("/tutup-kas")
  revalidatePath("/buka-kas")
  revalidatePath("/riwayat-kas")
  
  // Audit Log
  const diff = actualCash - closingBalance
  await createLog(
    "CLOSE_CASH_REGISTER", 
    "CASH_REGISTER", 
    activeRegister.id, 
    `Tutup kas. Sistem: Rp ${closingBalance.toLocaleString('id-ID')}, Fisik: Rp ${actualCash.toLocaleString('id-ID')}, Selisih: Rp ${diff.toLocaleString('id-ID')}`
  )

  return { success: true }
}
