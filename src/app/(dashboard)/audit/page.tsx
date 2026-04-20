import React from "react"
import { prisma } from "@/lib/prisma"
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AuditTable } from "./AuditTable"

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = typeof sp?.page === "string" ? parseInt(sp.page) : 1
  const limit = 10
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, role: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: skip
    }),
    prisma.auditLog.count()
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Audit Aktivitas</h1>
          <p className="text-sm text-[#6b7280] mt-1">Rekaman seluruh kegiatan penting yang dilakukan oleh Admin dan Kasir.</p>
        </div>
      </div>

      <div className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <AuditTable logs={logs} />
        </div>
        
        <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
           <div className="text-[11px] font-medium text-[#6b7280]">
             Menampilkan {skip + 1} - {Math.min(skip + logs.length, total)} dari {total} entitas
           </div>
           
           <div className="flex items-center gap-2">
              <Link 
                href={`/audit?page=${Math.max(1, page - 1)}`}
                className={cn(
                  "p-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]",
                  page <= 1 && "opacity-30 pointer-events-none"
                )}
              >
                <ChevronLeft size={16} />
              </Link>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i-1] !== p - 1 && <span className="text-[#9ca3af] px-1 text-xs">...</span>}
                      <Link
                        href={`/audit?page=${p}`}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                          page === p ? "bg-[#111827] text-white" : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50"
                        )}
                      >
                        {p}
                      </Link>
                    </React.Fragment>
                  ))
                }
              </div>

              <Link 
                href={`/audit?page=${Math.min(totalPages, page + 1)}`}
                className={cn(
                  "p-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]",
                  page >= totalPages && "opacity-30 pointer-events-none"
                )}
              >
                <ChevronRight size={16} />
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
