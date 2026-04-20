import React from "react"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Settings as SettingsIcon } from "lucide-react"
import { UserList } from "./UserList"

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon size={20} className="text-blue-600" />
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">System Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Pengaturan Akun</h1>
          <p className="text-[#64748b] mt-1">Kelola akun Admin dan Kasir untuk sistem POS.</p>
        </div>
      </div>

      <UserList users={users} />
    </div>
  )
}
