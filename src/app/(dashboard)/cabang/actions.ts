"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

export async function getOutletsWithStats() {
  const { role } = await getSessionUser()
  if (role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Hanya Superadmin yang dapat mengakses data cabang.")
  }

  return await prisma.outlet.findMany({
    orderBy: { nama: "asc" },
    include: {
      _count: {
        select: {
          users: true,
          transactions: true,
          products: true,
        },
      },
    },
  })
}

export async function createOutlet(data: { nama: string; alamat?: string }) {
  const { role } = await getSessionUser()
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Hanya Superadmin yang memiliki izin menambah cabang baru." }
  }

  const cleanNama = data.nama?.trim()
  if (!cleanNama) {
    return { success: false, error: "Nama cabang/outlet wajib diisi." }
  }

  try {
    const newOutlet = await prisma.outlet.create({
      data: {
        nama: cleanNama,
        alamat: data.alamat?.trim() || null,
      },
    })

    await createLog(
      "CREATE_OUTLET",
      "OUTLET",
      newOutlet.id,
      `Menambah cabang baru: ${newOutlet.nama}`,
      null,
      newOutlet,
      newOutlet.id
    )

    revalidatePath("/cabang")
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true, outlet: newOutlet }
  } catch (error: any) {
    console.error("Error creating outlet:", error)
    return { success: false, error: error.message || "Gagal membuat cabang baru" }
  }
}

export async function updateOutlet(id: string, data: { nama: string; alamat?: string }) {
  const { role } = await getSessionUser()
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Hanya Superadmin yang memiliki izin mengubah data cabang." }
  }

  const cleanNama = data.nama?.trim()
  if (!cleanNama) {
    return { success: false, error: "Nama cabang/outlet wajib diisi." }
  }

  try {
    const oldOutlet = await prisma.outlet.findUnique({
      where: { id },
    })

    if (!oldOutlet) {
      return { success: false, error: "Cabang tidak ditemukan." }
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id },
      data: {
        nama: cleanNama,
        alamat: data.alamat?.trim() || null,
      },
    })

    await createLog(
      "UPDATE_OUTLET",
      "OUTLET",
      updatedOutlet.id,
      `Memperbarui data cabang: ${oldOutlet.nama} -> ${updatedOutlet.nama}`,
      oldOutlet,
      updatedOutlet,
      updatedOutlet.id
    )

    revalidatePath("/cabang")
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true, outlet: updatedOutlet }
  } catch (error: any) {
    console.error("Error updating outlet:", error)
    return { success: false, error: error.message || "Gagal memperbarui cabang" }
  }
}

export async function deleteOutlet(id: string) {
  const { role } = await getSessionUser()
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Hanya Superadmin yang memiliki izin menghapus cabang." }
  }

  try {
    const outlet = await prisma.outlet.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
            products: true,
          },
        },
      },
    })

    if (!outlet) {
      return { success: false, error: "Cabang tidak ditemukan." }
    }

    // Safety check: Jangan izinkan hapus jika masih ada data pengguna atau transaksi terkait
    if (outlet._count.users > 0) {
      return {
        success: false,
        error: `Cabang tidak dapat dihapus karena masih ada ${outlet._count.users} pengguna/pengelola yang ditugaskan di cabang ini. Pindahkan atau hapus akun pengguna terlebih dahulu.`,
      }
    }

    if (outlet._count.transactions > 0) {
      return {
        success: false,
        error: `Cabang tidak dapat dihapus karena memiliki ${outlet._count.transactions} riwayat transaksi penjualan.`,
      }
    }

    await prisma.outlet.delete({
      where: { id },
    })

    await createLog(
      "DELETE_OUTLET",
      "OUTLET",
      id,
      `Menghapus cabang: ${outlet.nama}`,
      outlet,
      null,
      id
    )

    revalidatePath("/cabang")
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting outlet:", error)
    return { success: false, error: error.message || "Gagal menghapus cabang" }
  }
}
