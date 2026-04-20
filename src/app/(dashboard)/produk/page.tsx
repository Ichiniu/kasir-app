import React from "react";
import { prisma } from "@/lib/prisma";
import { ProductList } from "./ProductList";

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = typeof sp?.page === "string" ? parseInt(sp.page) : 1
  const limit = 10
  const skip = (page - 1) * limit

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip
    }),
    prisma.product.count(),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    })
  ]);

  const totalPages = Math.ceil(total / limit)

  // Serialize Decimal and Date objects for Client Component
  const serializableProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <ProductList 
        initialProducts={serializableProducts} 
        categories={categories} 
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
