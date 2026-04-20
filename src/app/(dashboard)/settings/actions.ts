"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createLog } from "@/lib/audit"
import bcrypt from "bcrypt"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function createUser(data: any) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "ADMIN") {
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

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      }
    })

    await createLog(
      "CREATE_USER",
      "USER",
      user.id,
      `Membuat akun baru: ${user.name} (${user.email}) dengan role ${user.role}`,
      null,
      { name: user.name, email: user.email, role: user.role }
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Gagal membuat user" }
  }
}

export async function updateUser(id: string, data: any) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const oldUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!oldUser) {
      return { success: false, error: "User tidak ditemukan" }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
    }

    // Only update password if provided
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Track changes
    const changes: any = {}
    if (oldUser.name !== user.name) changes.name = { old: oldUser.name, new: user.name }
    if (oldUser.email !== user.email) changes.email = { old: oldUser.email, new: user.email }
    if (oldUser.role !== user.role) changes.role = { old: oldUser.role, new: user.role }
    if (data.password) changes.password = { old: "***", new: "*** (diubah)" }

    const changeDetails = Object.keys(changes).map(field => {
      const fieldNames: any = {
        name: 'Nama',
        email: 'Email',
        role: 'Role',
        password: 'Password'
      }
      return `${fieldNames[field]}: "${changes[field].old}" → "${changes[field].new}"`
    }).join(', ')

    await createLog(
      "UPDATE_USER",
      "USER",
      user.id,
      `Memperbarui akun: ${user.name} (${user.email})${changeDetails ? ' - ' + changeDetails : ''}`,
      { name: oldUser.name, email: oldUser.email, role: oldUser.role },
      { name: user.name, email: user.email, role: user.role }
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Gagal mengupdate user" }
  }
}

export async function deleteUser(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Prevent deleting own account
    if (session.user.id === id) {
      return { success: false, error: "Tidak dapat menghapus akun sendiri" }
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return { success: false, error: "User tidak ditemukan" }
    }

    await prisma.user.delete({
      where: { id }
    })

    await createLog(
      "DELETE_USER",
      "USER",
      id,
      `Menghapus akun: ${user.name} (${user.email}) dengan role ${user.role}`,
      { name: user.name, email: user.email, role: user.role },
      null
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Gagal menghapus user" }
  }
}
