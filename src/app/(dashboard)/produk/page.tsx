import React from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProductList } from "./ProductList";
import { ProductWorkspace } from "./ProductWorkspace";
import { CategoryList } from "../kategori/CategoryList";
import { StockInList } from "../stok-masuk/StockInList";
import { SkuList } from "./SkuList";

export const dynamic = "force-dynamic";

export default async function ProductPage({
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
  const activeTab = typeof sp?.tab === "string" ? sp.tab : "produk"
  const limit = 10
  const skip = (page - 1) * limit

  const outletFilter = isSuperAdmin ? {} : { outletId: outletId! }

  const [products, total, categories, adjustments, adjustmentTotal, stockProducts, skus] = await Promise.all([
    prisma.product.findMany({
      where: outletFilter,
      include: {
        category: true,
        skuRecord: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip
    }),
    prisma.product.count({
      where: outletFilter
    }),
    prisma.category.findMany({
      where: outletFilter,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.inventoryAdjustment.findMany({
      where: { type: "IN", ...outletFilter },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.inventoryAdjustment.count({ where: { type: "IN", ...outletFilter } }),
    prisma.product.findMany({ where: outletFilter, orderBy: { name: "asc" } }),
    prisma.productSku.findMany({
      where: outletFilter,
      include: { product: { select: { id: true } } },
      orderBy: { code: "asc" },
    })
  ]);

  const totalPages = Math.ceil(total / limit)

  // Serialize Decimal and Date objects for Client Component
  const serializableProducts = products.map((p) => ({
    ...p,
    skuRecord: p.skuRecord ? { ...p.skuRecord, createdAt: p.skuRecord.createdAt.toISOString() } : null,
    price: Number(p.price),
    cost: Number(p.cost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
  const serializableCategories = categories.map((category) => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }))

  const adjustmentPages = Math.ceil(adjustmentTotal / limit)
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
    },
  }))
  const serializableStockProducts = stockProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
  const serializableSkus = skus.map((sku) => ({
    id: sku.id,
    outletId: sku.outletId,
    code: sku.code,
    createdAt: sku.createdAt.toISOString(),
    assignedProductId: sku.product?.id ?? null,
    productCount: sku.product ? 1 : 0,
  }))

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <ProductWorkspace activeTab={activeTab}>
        {activeTab === "kategori" ? (
          <CategoryList categories={serializableCategories} />
        ) : activeTab === "stok-masuk" ? (
          <StockInList adjustments={serializableAdjustments} products={serializableStockProducts} pagination={{ page, limit, total: adjustmentTotal, totalPages: adjustmentPages }} />
        ) : activeTab === "sku" ? (
          <SkuList skus={serializableSkus} />
        ) : (
          <ProductList
            initialProducts={serializableProducts}
            categories={serializableCategories}
            skus={serializableSkus}
            pagination={{ page, limit, total, totalPages }}
          />
        )}
      </ProductWorkspace>
    </div>
  );
}
