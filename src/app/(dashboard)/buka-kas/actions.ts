"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

export async function checkCashRegister() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    return { hasActiveRegister: false }
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
      openingBalance: true,
      status: true
    }
  })

  return { 
    hasActiveRegister: !!activeRegister,
    activeRegister: activeRegister ? {
      id: activeRegister.id,
      openingBalance: Number(activeRegister.openingBalance)
    } : null 
  }
}

export async function openCashRegister(openingBalance: number, notes?: string) {
  const { userId, outletId, isSuperAdmin, role } = await getSessionUser()

  if (role === "ADMIN") {
    throw new Error("Akses ditolak: Admin hanya memiliki hak akses read-only.")
  }

  if (!outletId && !isSuperAdmin) {
    throw new Error("Pengguna tidak terhubung dengan outlet")
  }

  const targetOutletId = outletId || (await prisma.outlet.findFirst({ select: { id: true } }))?.id
  if (!targetOutletId) {
    throw new Error("Tidak ada data outlet yang tersedia")
  }

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId,
      outletId: targetOutletId,
      status: "OPEN"
    },
    select: {
      id: true
    }
  })

  if (activeRegister) throw new Error("Kasir ini sudah memiliki sesi kas yang aktif")

  const newRegister = await prisma.cashRegister.create({
    data: {
      outletId: targetOutletId,
      userId,
      openingBalance: openingBalance,
      status: "OPEN",
      openingNotes: notes
    }
  })

  revalidatePath("/kasir")
  revalidatePath("/buka-kas")
  revalidatePath("/riwayat-kas")
  
  // Audit Log
  await createLog(
    "OPEN_CASH_REGISTER", 
    "CASH_REGISTER", 
    newRegister.id, 
    `Buka kas dengan modal awal Rp ${openingBalance.toLocaleString('id-ID')}`,
    null,
    null,
    targetOutletId
  )

  return { 
    success: true, 
    register: {
      id: newRegister.id,
      openingBalance: Number(newRegister.openingBalance),
      status: newRegister.status
    }
  }
}
