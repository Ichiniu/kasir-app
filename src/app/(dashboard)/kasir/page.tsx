import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Cashier } from "./Cashier"
import { redirect } from "next/navigation"

export default async function KasirPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session) {
    redirect("/login")
  }

  // Cek apakah kasir sudah melakukan buka kas
  const activeRegister = await prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
      status: "OPEN"
    },
    select: {
      id: true
    }
  })

  if (!activeRegister) {
    redirect("/buka-kas")
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
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
        userId={session.user.id} 
        cashRegisterId={activeRegister.id}
      />
    </div>
  )
}
