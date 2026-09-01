import React from "react"
import { prisma } from "@/lib/prisma"
import { CategoryList } from "./CategoryList"

export const dynamic = "force-dynamic"

export default async function CategoryPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  const serializableCategories = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <CategoryList categories={serializableCategories} />
    </div>
  )
}
