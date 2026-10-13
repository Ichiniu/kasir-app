"use server"

import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { createLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export async function createProductSku(rawCode: string) {
  const { outletId, role } = await getSessionUser()
  if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Akses ditolak")
  if (!outletId) throw new Error("Akun harus terhubung ke outlet untuk mengelola SKU")

  const code = rawCode.trim()
  if (!code) throw new Error("Kode SKU tidak boleh kosong")
  if (code.length > 100) throw new Error("Kode SKU maksimal 100 karakter")

  const sku = await prisma.productSku.create({ data: { code, outletId } })
  await createLog("CREATE_PRODUCT_SKU", "PRODUCT_SKU", sku.id, `Menambah SKU: ${sku.code}`, null, sku, outletId)
  revalidatePath("/produk")
  return { success: true }
}

export async function deleteProductSku(id: string) {
  const { outletId, role } = await getSessionUser()
  if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Akses ditolak")
  const sku = await prisma.productSku.findFirst({ where: { id, ...(outletId ? { outletId } : {}) } })
  if (!sku) throw new Error("SKU tidak ditemukan atau Anda tidak memiliki akses")
  const product = await prisma.product.findFirst({ where: { skuId: sku.id }, select: { id: true } })
  if (product) throw new Error("SKU tidak dapat dihapus karena sudah digunakan oleh produk")

  await prisma.productSku.delete({ where: { id: sku.id } })
  await createLog("DELETE_PRODUCT_SKU", "PRODUCT_SKU", sku.id, `Menghapus SKU: ${sku.code}`, sku, null, sku.outletId)
  revalidatePath("/produk")
  return { success: true }
}
