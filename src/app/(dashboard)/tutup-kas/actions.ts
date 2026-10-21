"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"
import { getRegisterSales } from "@/lib/register-sales"

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

  const sales = await getRegisterSales(prisma, activeRegister.id)

  return {
    id: activeRegister.id,
    openingBalance: Number(activeRegister.openingBalance),
    totalSales: Number(sales.total),
    cashSales: Number(sales.cash),
    qrisSales: Number(sales.qris),
    openedAt: activeRegister.openedAt.toISOString()
  }
}

export async function closeCashRegister(actualCash: number, notes?: string) {
  const { userId, outletId, role } = await getSessionUser()

  if (role === "ADMIN") {
    throw new Error("Akses ditolak: Admin hanya memiliki hak akses read-only.")
  }
  if (!Number.isFinite(actualCash) || actualCash < 0) {
    throw new Error("Uang tunai fisik harus bernilai nol atau lebih")
  }

  const { activeRegister, closingBalance } = await prisma.$transaction(async (tx) => {
    const activeRegister = await tx.cashRegister.findFirst({
      where: { userId, status: "OPEN", ...(outletId ? { outletId } : {}) },
      select: { id: true, outletId: true, openingBalance: true },
    })
    if (!activeRegister) throw new Error("Tidak ditemukan sesi kas aktif untuk ditutup")

    const claimed = await tx.cashRegister.updateMany({
      where: { id: activeRegister.id, userId, status: "OPEN" },
      data: { status: "CLOSED" },
    })
    if (claimed.count !== 1) throw new Error("Sesi kas sudah ditutup")

    const sales = await getRegisterSales(tx, activeRegister.id)
    const closingBalance = activeRegister.openingBalance.add(sales.cash)
    await tx.cashRegister.update({
      where: { id: activeRegister.id },
      data: {
        closingBalance,
        actualCash,
        totalSales: sales.total,
        closedAt: new Date(),
        closingNotes: notes,
      },
    })
    return { activeRegister, closingBalance: Number(closingBalance) }
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
