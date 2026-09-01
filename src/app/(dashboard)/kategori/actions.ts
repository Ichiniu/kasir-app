"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"

export async function upsertCategory(data: { id?: string; name: string; description?: string }) {
  const { id, name, description } = data

  const trimmedName = name.trim()
  const trimmedDesc = description?.trim() || null

  if (!trimmedName) {
    throw new Error("Nama kategori tidak boleh kosong")
  }

  let category: any

  if (id) {
    const oldCategory = await prisma.category.findUnique({
      where: { id },
    })

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
      category
    )
  } else {
    category = await prisma.category.create({
      data: {
        name: trimmedName,
        description: trimmedDesc,
      },
    })

    await createLog(
      "CREATE_CATEGORY",
      "CATEGORY",
      category.id,
      `Menambah kategori baru: ${category.name}`,
      null,
      category
    )
  }

  revalidatePath("/kategori")
  revalidatePath("/produk")
  return { success: true, category }
}

export async function deleteCategory(id: string) {
  // Check if any product is using this category
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  })

  if (productCount > 0) {
    throw new Error(
      `Tidak dapat menghapus kategori ini karena masih digunakan oleh ${productCount} produk.`
    )
  }

  const category = await prisma.category.findUnique({
    where: { id },
  })

  await prisma.category.delete({
    where: { id },
  })

  await createLog(
    "DELETE_CATEGORY",
    "CATEGORY",
    id,
    `Menghapus kategori: ${category?.name || id}`,
    category,
    null
  )

  revalidatePath("/kategori")
  revalidatePath("/produk")
  return { success: true }
}
