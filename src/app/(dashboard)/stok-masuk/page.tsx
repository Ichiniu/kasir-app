import React from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { StockInList } from "./StockInList";

export const dynamic = "force-dynamic";

export default async function StokMasukPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { outletId, isSuperAdmin } = sessionUser
  const sp = await searchParams
  const page = typeof sp?.page === "string" ? parseInt(sp.page) : 1
  const limit = 10
  const skip = (page - 1) * limit

  const outletFilter = isSuperAdmin ? {} : { outletId: outletId! }

  const [adjustments, total, products] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      where: {
        type: "IN",
        ...outletFilter,
      },
      include: {
        product: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: skip
    }),
    prisma.inventoryAdjustment.count({
      where: { 
        type: "IN",
        ...outletFilter,
      }
    }),
    prisma.product.findMany({
      where: outletFilter,
      orderBy: {
        name: "asc"
      }
    })
  ]);

  const totalPages = Math.ceil(total / limit)

  // Serialize objects for Client Component
  const serializableAdjustments = adjustments.map((adj) => ({
    ...adj,
    cost: adj.cost ? Number(adj.cost) : null,
    price: adj.price ? Number(adj.price) : null,
    createdAt: adj.createdAt.toISOString(),
    product: {
      ...adj.product,
      price: Number(adj.product.price),
      cost: Number(adj.product.cost),
      createdAt: adj.product.createdAt.toISOString(),
      updatedAt: adj.product.updatedAt.toISOString(),
    }
  }));

  const serializableProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <StockInList 
        adjustments={serializableAdjustments} 
        products={serializableProducts} 
        pagination={{
          page,
          limit,
          total,
          totalPages
        }}
      />
    </div>
  );
}
