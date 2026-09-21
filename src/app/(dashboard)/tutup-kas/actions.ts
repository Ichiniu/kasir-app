"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

export async function getActiveRegister() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    return null
  }

  const { userId, outletId } = sessionUser

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId,
      status: "OPEN",
      ...(outletId ? { outletId } : {})
    },
    select: {
      id: true,
      outletId: true,
      openingBalance: true,
      openedAt: true
    }
  })

  if (!activeRegister) return null

  // Get total sales for this specific register session
  const transactions = await prisma.transaction.findMany({
    where: {
      cashRegisterId: activeRegister.id,
      ...(activeRegister.outletId ? { outletId: activeRegister.outletId } : {})
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
  const { userId, outletId, role } = await getSessionUser()

  if (role === "ADMIN") {
    throw new Error("Akses ditolak: Admin hanya memiliki hak akses read-only.")
  }

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId,
      status: "OPEN",
      ...(outletId ? { outletId } : {})
    },
    select: {
      id: true,
      outletId: true,
      openingBalance: true
    }
  })

  if (!activeRegister) throw new Error("Tidak ditemukan sesi kas aktif untuk ditutup")

  // Calculate closing balance (Opening + Total Sales)
  const transactions = await prisma.transaction.findMany({
    where: { 
      cashRegisterId: activeRegister.id,
      ...(activeRegister.outletId ? { outletId: activeRegister.outletId } : {})
    }
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
    `Tutup kas. Sistem: Rp ${closingBalance.toLocaleString('id-ID')}, Fisik: Rp ${actualCash.toLocaleString('id-ID')}, Selisih: Rp ${diff.toLocaleString('id-ID')}`,
    null,
    null,
    activeRegister.outletId
  )

  return { success: true }
}
