import React from "react"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { Settings as SettingsIcon } from "lucide-react"
import { UserList } from "./UserList"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { role, outletId, isSuperAdmin } = sessionUser
  
  if (role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  const [users, outlets] = await Promise.all([
    prisma.user.findMany({
      where: isSuperAdmin ? {} : { outletId: outletId! },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        outletId: true,
        outlet: {
          select: {
            id: true,
            nama: true,
          }
        },
        createdAt: true,
        updatedAt: true,
      }
    }),
    prisma.outlet.findMany({
      orderBy: {
        nama: "asc"
      },
      select: {
        id: true,
        nama: true,
        alamat: true,
      }
    })
  ])

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon size={20} className="text-[#FFB800]" />
            <span className="text-xs font-black text-[#FFB800] uppercase tracking-widest">System Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Pengaturan Akun & Outlet</h1>
          <p className="text-[#64748b] mt-1">Kelola akun Superadmin, Admin, dan Kasir beserta penugasan outlet.</p>
        </div>
      </div>

      <UserList users={users} outlets={outlets} currentRole={role} currentOutletId={outletId} />
    </div>
  )
}
