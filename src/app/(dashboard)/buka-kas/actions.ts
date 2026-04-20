"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/audit"

export async function checkCashRegister() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { hasActiveRegister: false }

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
      status: "OPEN"
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
      status: "OPEN"
    },
    select: {
      id: true
    }
  })

  if (activeRegister) throw new Error("An active cash register already exists")

  const newRegister = await prisma.cashRegister.create({
    data: {
      userId: session.user.id,
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
    `Buka kas dengan modal awal Rp ${openingBalance.toLocaleString('id-ID')}`
  )

  return { success: true, register: newRegister }
}
