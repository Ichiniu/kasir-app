"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

export async function upsertCategory(data: { id?: string; name: string; description?: string }) {
  const { outletId, isSuperAdmin } = await getSessionUser()
  const { id, name, description } = data

  const trimmedName = name.trim()
  const trimmedDesc = description?.trim() || null

  if (!trimmedName) {
    throw new Error("Nama kategori tidak boleh kosong")
  }

  let category: any

  if (id) {
    // Enforce ownership: only allow updating category belonging to user's outlet (unless SUPERADMIN)
    const oldCategory = await prisma.category.findFirst({
      where: isSuperAdmin ? { id } : { id, outletId: outletId! },
    })

    if (!oldCategory) {
      throw new Error("Kategori tidak ditemukan atau Anda tidak memiliki akses")
    }

    category = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        description: trimmedDesc,
      },
    })

    await createLog(
      "UPDATE_CATEGORY",
      "CATEGORY",
      category.id,
      `Memperbarui kategori: ${oldCategory?.name} → ${category.name}`,
      oldCategory,
      category,
      category.outletId
    )
  } else {
    if (!outletId && !isSuperAdmin) {
      throw new Error("Pengguna tidak terhubung dengan outlet")
    }

    category = await prisma.category.create({
      data: {
        name: trimmedName,
        description: trimmedDesc,
        outletId: outletId!,
      },
    })

    await createLog(
      "CREATE_CATEGORY",
      "CATEGORY",
      category.id,
      `Menambah kategori baru: ${category.name}`,
      null,
      category,
      category.outletId
    )
  }

  revalidatePath("/kategori")
  revalidatePath("/produk")
  return { success: true, category }
}

export async function deleteCategory(id: string) {
  const { outletId, isSuperAdmin } = await getSessionUser()

  const category = await prisma.category.findFirst({
    where: isSuperAdmin ? { id } : { id, outletId: outletId! },
  })

  if (!category) {
    throw new Error("Kategori tidak ditemukan atau Anda tidak memiliki akses")
  }

  // Check if any product is using this category within the outlet
  const productCount = await prisma.product.count({
    where: isSuperAdmin 
      ? { categoryId: id } 
      : { categoryId: id, outletId: outletId! },
  })

  if (productCount > 0) {
    throw new Error(
      `Tidak dapat menghapus kategori ini karena masih digunakan oleh ${productCount} produk.`
    )
  }

  await prisma.category.delete({
    where: { id },
  })

  await createLog(
    "DELETE_CATEGORY",
    "CATEGORY",
    id,
    `Menghapus kategori: ${category.name || id}`,
    category,
    null,
    category.outletId
  )

  revalidatePath("/kategori")
  revalidatePath("/produk")
  return { success: true }
}
