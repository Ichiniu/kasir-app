import React from "react"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { Store } from "lucide-react"
import { CabangList } from "./CabangList"
import { getOutletsWithStats } from "./actions"

export const dynamic = "force-dynamic"

export default async function CabangPage() {
  let sessionUser
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { role } = sessionUser

  if (role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  const outlets = await getOutletsWithStats()

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store size={20} className="text-[#FFB800]" />
            <span className="text-xs font-black text-[#FFB800] uppercase tracking-widest">
              Multi-Branch Management
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
            Kelola Cabang
          </h1>
          <p className="text-[#64748b] mt-1">
            Daftar seluruh cabang toko, lokasi alamat, serta jumlah staf/pengelola di setiap cabang.
          </p>
        </div>
      </div>

      <CabangList initialOutlets={outlets} />
    </div>
  )
}
