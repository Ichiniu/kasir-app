"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

function parseCurrency(value: string | number): number {
  if (typeof value === "number") return value
  const str = String(value)
  // Remove "Rp", spaces, and dots (thousands separator)
  // Replace comma with dot (decimal separator)
  const cleanStr = str.replace(/[Rp\s.]/g, "").replace(",", ".")
  const num = parseFloat(cleanStr)
  return isNaN(num) ? 0 : num
}

export async function upsertProduct(data: any) {
  const { outletId, isSuperAdmin } = await getSessionUser()
  const { id, categoryId, ...rest } = data

  const processedData = {
    ...rest,
    categoryId: categoryId === "" ? null : categoryId,
    price: parseCurrency(rest.price),
    cost: parseCurrency(rest.cost),
    stock: parseInt(String(rest.stock)),
    minStock: parseInt(String(rest.minStock || 5)),
  }

  let product: any;
  if (id) {
    // Validate ownership before updating
    const oldProduct = await prisma.product.findFirst({
      where: isSuperAdmin ? { id } : { id, outletId: outletId! },
      include: { category: true }
    })

    if (!oldProduct) {
      throw new Error("Produk tidak ditemukan atau Anda tidak memiliki akses")
    }

    // If changing category, verify category belongs to the same outlet
    if (processedData.categoryId) {
      const validCategory = await prisma.category.findFirst({
        where: isSuperAdmin 
          ? { id: processedData.categoryId } 
          : { id: processedData.categoryId, outletId: oldProduct.outletId }
      })
      if (!validCategory) {
        throw new Error("Kategori yang dipilih tidak valid untuk outlet ini")
      }
    }

    product = await prisma.product.update({
      where: { id },
      data: processedData,
      include: { category: true }
    })
    
    // Track detailed changes
    const changes: any = {}
    const fields = ['name', 'sku', 'description', 'price', 'cost', 'stock', 'minStock', 'unit', 'categoryId']
    
    fields.forEach(field => {
      const oldVal = oldProduct?.[field as keyof typeof oldProduct]
      const newVal = product[field as keyof typeof product]
      
      if (oldVal !== newVal) {
        changes[field] = {
          old: field === 'categoryId' ? oldProduct?.category?.name || 'Tidak ada' : oldVal,
          new: field === 'categoryId' ? product.category?.name || 'Tidak ada' : newVal
        }
      }
    })

    const changeDetails = Object.keys(changes).map(field => {
      const fieldNames: any = {
        name: 'Nama',
        sku: 'SKU',
        description: 'Deskripsi',
        price: 'Harga Jual',
        cost: 'Harga Modal',
        stock: 'Stok',
        minStock: 'Stok Minimum',
        unit: 'Satuan',
        categoryId: 'Kategori'
      }
      return `${fieldNames[field]}: "${changes[field].old}" → "${changes[field].new}"`
    }).join(', ')

    await createLog(
      "UPDATE_PRODUCT",
      "PRODUCT",
      product.id,
      `Memperbarui produk: ${product.name} (SKU: ${product.sku})${changeDetails ? ' - ' + changeDetails : ''}`,
      oldProduct,
      product,
      product.outletId
    )
  } else {
    if (!outletId && !isSuperAdmin) {
      throw new Error("Pengguna tidak terhubung dengan outlet")
    }

    // Verify category if selected
    if (processedData.categoryId) {
      const validCategory = await prisma.category.findFirst({
        where: isSuperAdmin 
          ? { id: processedData.categoryId } 
          : { id: processedData.categoryId, outletId: outletId! }
      })
      if (!validCategory) {
        throw new Error("Kategori yang dipilih tidak valid untuk outlet ini")
      }
    }

    product = await prisma.product.create({
      data: {
        ...processedData,
        outletId: outletId!,
      },
      include: { category: true }
    })

    await createLog(
      "CREATE_PRODUCT",
      "PRODUCT",
      product.id,
      `Menambah produk baru: ${product.name} (SKU: ${product.sku})`,
      null,
      product,
      product.outletId
    )
  }

  revalidatePath("/produk")
  return { success: true, product }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const { outletId, isSuperAdmin } = await getSessionUser()

  const existingProduct = await prisma.product.findFirst({
    where: isSuperAdmin ? { id } : { id, outletId: outletId! }
  })

  if (!existingProduct) {
    throw new Error("Produk tidak ditemukan atau Anda tidak memiliki akses")
  }

  const product = await prisma.product.update({
    where: { id },
    data: { isActive: !currentStatus },
  })

  await createLog(
    "TOGGLE_PRODUCT_STATUS",
    "PRODUCT",
    product.id,
    `${!currentStatus ? "Mengaktifkan" : "Menonaktifkan"} produk: ${product.name}`,
    null,
    null,
    product.outletId
  )

  revalidatePath("/produk")
  return { success: true, product }
}
