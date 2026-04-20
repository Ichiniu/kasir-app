import React from "react"
import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function RiwayatKasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const page = typeof sp?.page === "string" ? parseInt(sp.page) : 1
  const limit = 10
  const skip = (page - 1) * limit

  const [registers, total] = await Promise.all([
    prisma.cashRegister.findMany({
      select: {
        id: true,
        openingBalance: true,
        closingBalance: true,
        totalSales: true,
        actualCash: true,
        status: true,
        openingNotes: true,
        closingNotes: true,
        openedAt: true,
        closedAt: true,
        user: {
          select: { name: true }
        }
      },
      orderBy: {
        openedAt: "desc"
      },
      take: limit,
      skip: skip
    }),
    prisma.cashRegister.count()
  ])

  const totalPages = Math.ceil(total / limit)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-8 space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Riwayat Buka/Tutup Kas</h1>
        <p className="text-sm text-[#6b7280] mt-1">Laporan aktivitas laci kas per shift karyawan.</p>
      </div>

      <div className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Buka Kas</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Tutup Kas</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Kasir</TableHead>
                <TableHead className="text-right font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Modal</TableHead>
                <TableHead className="text-right font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Total Jual</TableHead>
                <TableHead className="text-right font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Uang Fisik</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    Belum ada data riwayat kas.
                  </TableCell>
                </TableRow>
              ) : (
                registers.map((reg) => {
                  const diff = reg.actualCash ? Number(reg.actualCash) - (Number(reg.openingBalance) + Number(reg.totalSales)) : 0

                  return (
                    <TableRow key={reg.id} className="hover:bg-[#f9fafb] transition-colors border-b-[#e5e7eb] last:border-0">
                       <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#111827]">{format(new Date(reg.openedAt), "dd MMM yyyy", { locale: id })}</span>
                          <span className="text-[10px] text-[#6b7280]">{format(new Date(reg.openedAt), "HH:mm", { locale: id })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {reg.closedAt ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#111827]">{format(new Date(reg.closedAt), "dd MMM yyyy", { locale: id })}</span>
                            <span className="text-[10px] text-[#6b7280]">{format(new Date(reg.closedAt), "HH:mm", { locale: id })}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9ca3af] italic">Sedang berjalan</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111827]">{reg.user.name}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs font-medium text-[#6b7280]">
                        {formatCurrency(Number(reg.openingBalance))}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs font-bold text-[#111827]">
                        {formatCurrency(Number(reg.totalSales))}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-[#111827]">
                            {reg.actualCash ? formatCurrency(Number(reg.actualCash)) : "-"}
                          </span>
                          {reg.status === "CLOSED" && (
                            <span className={cn(
                              "text-[9px] font-bold px-1 rounded uppercase tracking-tighter mt-1",
                              diff === 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                              {diff === 0 ? "PAS" : `SELISIH: ${formatCurrency(diff)}`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-bold py-0 px-2 border-none rounded uppercase",
                          reg.status === "OPEN" ? "bg-blue-50 text-[#3b82f6]" : "bg-gray-100 text-[#6b7280]"
                        )}>
                          {reg.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination UI */}
        <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
           <div className="text-[11px] font-medium text-[#6b7280]">
             Menampilkan {skip + 1} - {Math.min(skip + registers.length, total)} dari {total} entitas
           </div>
           
           <div className="flex items-center gap-2">
              <Link 
                href={`/riwayat-kas?page=${Math.max(1, page - 1)}`}
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
                        href={`/riwayat-kas?page=${p}`}
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
                href={`/riwayat-kas?page=${Math.min(totalPages, page + 1)}`}
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
