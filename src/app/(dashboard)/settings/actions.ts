"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import bcrypt from "bcrypt"
import { getSessionUser } from "@/lib/session"

export async function getOutlets() {
  const { isSuperAdmin, outletId } = await getSessionUser()
  if (isSuperAdmin) {
    return await prisma.outlet.findMany({
      orderBy: { nama: "asc" }
    })
  }
  if (outletId) {
    return await prisma.outlet.findMany({
      where: { id: outletId },
      orderBy: { nama: "asc" }
    })
  }
  return []
}

export async function createOutlet(data: { nama: string; alamat?: string }) {
  const { role } = await getSessionUser()
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Hanya Superadmin yang memiliki izin menambah outlet/cabang baru." }
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
      select: {
        id: true,
        nama: true,
        alamat: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    await createLog(
      "CREATE_OUTLET",
      "OUTLET",
      newOutlet.id,
      `Menambah cabang outlet baru: ${newOutlet.nama}`,
      null,
      newOutlet,
      newOutlet.id
    )

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true, outlet: newOutlet }
  } catch (error: any) {
    console.error("Error creating outlet:", error)
    return { success: false, error: error.message || "Gagal membuat cabang outlet baru" }
  }
}

export async function createUser(data: any) {
  const { userId, role, outletId: creatorOutletId, isSuperAdmin } = await getSessionUser()
  
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existing) {
      return { success: false, error: "Email sudah terdaftar" }
    }

    // Determine target outletId
    let targetOutletId = data.outletId || null
    if (data.role !== "SUPERADMIN") {
      if (!targetOutletId) {
        targetOutletId = creatorOutletId
      }
      if (!targetOutletId) {
        return { success: false, error: "Outlet wajib dipilih untuk akun non-Superadmin" }
      }
    }

    // Non-superadmin cannot create users for other outlets
    if (!isSuperAdmin && targetOutletId !== creatorOutletId) {
      return { success: false, error: "Anda hanya dapat membuat pengguna untuk outlet Anda sendiri" }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        outletId: targetOutletId,
        accounts: {
          create: {
            accountId: data.email,
            providerId: "credential",
            password: hashedPassword,
          }
        }
      }
    })

    await createLog(
      "CREATE_USER",
      "USER",
      user.id,
      `Membuat akun baru: ${user.name} (${user.email}) dengan role ${user.role}`,
      null,
      { name: user.name, email: user.email, role: user.role, outletId: user.outletId },
      user.outletId
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Gagal membuat user" }
  }
}

export async function updateUser(id: string, data: any) {
  const { role, outletId: updaterOutletId, isSuperAdmin } = await getSessionUser()
  
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const oldUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!oldUser) {
      return { success: false, error: "User tidak ditemukan" }
    }

    // Non-superadmin can only update users in their own outlet
    if (!isSuperAdmin && oldUser.outletId !== updaterOutletId) {
      return { success: false, error: "Anda tidak memiliki akses untuk mengubah user di outlet lain" }
    }

    let targetOutletId = data.outletId !== undefined ? data.outletId : oldUser.outletId
    if (data.role === "SUPERADMIN") {
      targetOutletId = null
    } else if (!targetOutletId) {
      return { success: false, error: "Outlet wajib dipilih untuk akun non-Superadmin" }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      outletId: targetOutletId,
    }

    // Only update password if provided
    let newHashedPassword: string | null = null
    if (data.password && data.password.trim() !== "") {
      newHashedPassword = await bcrypt.hash(data.password, 10)
      updateData.password = newHashedPassword
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Sinkronisasi tabel accounts untuk better-auth
    if (newHashedPassword) {
      const existingAccount = await prisma.account.findFirst({
        where: { userId: id, providerId: "credential" }
      })
      if (existingAccount) {
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            accountId: data.email || oldUser.email,
            password: newHashedPassword,
          }
        })
      } else {
        await prisma.account.create({
          data: {
            userId: id,
            accountId: data.email || oldUser.email,
            providerId: "credential",
            password: newHashedPassword,
          }
        })
      }
    } else if (data.email && data.email !== oldUser.email) {
      await prisma.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { accountId: data.email }
      })
    }

    // Track changes
    const changes: any = {}
    if (oldUser.name !== user.name) changes.name = { old: oldUser.name, new: user.name }
    if (oldUser.email !== user.email) changes.email = { old: oldUser.email, new: user.email }
    if (oldUser.role !== user.role) changes.role = { old: oldUser.role, new: user.role }
    if (oldUser.outletId !== user.outletId) changes.outletId = { old: oldUser.outletId, new: user.outletId }
    if (data.password) changes.password = { old: "***", new: "*** (diubah)" }

    const changeDetails = Object.keys(changes).map(field => {
      const fieldNames: any = {
        name: 'Nama',
        email: 'Email',
        role: 'Role',
        outletId: 'Outlet',
        password: 'Password'
      }
      return `${fieldNames[field] || field}: "${changes[field].old}" → "${changes[field].new}"`
    }).join(', ')

    await createLog(
      "UPDATE_USER",
      "USER",
      user.id,
      `Memperbarui akun: ${user.name} (${user.email})${changeDetails ? ' - ' + changeDetails : ''}`,
      oldUser,
      user,
      user.outletId
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Gagal mengupdate user" }
  }
}

export async function deleteUser(id: string) {
  const { userId, role, outletId: deleterOutletId, isSuperAdmin } = await getSessionUser()
  
  if (role !== "SUPERADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Prevent deleting own account
    if (userId === id) {
      return { success: false, error: "Tidak dapat menghapus akun sendiri" }
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return { success: false, error: "User tidak ditemukan" }
    }

    // Non-superadmin cannot delete user from other outlet
    if (!isSuperAdmin && user.outletId !== deleterOutletId) {
      return { success: false, error: "Anda tidak memiliki akses untuk menghapus user di outlet lain" }
    }

    await prisma.user.delete({
      where: { id }
    })

    await createLog(
      "DELETE_USER",
      "USER",
      id,
      `Menghapus akun: ${user.name} (${user.email}) dengan role ${user.role}`,
      user,
      null,
      user.outletId
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Gagal menghapus user" }
  }
}
