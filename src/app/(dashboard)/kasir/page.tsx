import React from "react"
import { prisma } from "@/lib/prisma"
import { Cashier } from "./Cashier"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { userId, outletId, isSuperAdmin, role } = sessionUser
  const isReadOnly = role === "ADMIN"

  // Cek apakah kasir sudah melakukan buka kas
  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId,
      status: "OPEN",
      ...(outletId ? { outletId } : {})
    },
    select: {
      id: true
    }
  })

  if (!activeRegister && !isReadOnly) {
    redirect("/buka-kas")
  }

  const products = await prisma.product.findMany({
    where: { 
      isActive: true,
      ...(isSuperAdmin ? {} : { outletId: outletId! })
    },
    include: { category: true },
    orderBy: { name: "asc" }
  })

  // Serialize Decimal and Date
  const serializableProducts = products.map(p => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Cashier 
        initialProducts={serializableProducts} 
        userId={userId} 
        cashRegisterId={activeRegister?.id || ""}
        isReadOnly={isReadOnly}
      />
    </div>
  )
}
