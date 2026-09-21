"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "data",
  className = "",
}: TablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div
      className={`p-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      {/* Informasi Data & Pilihan Rows Per Page */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#6b7280]">
        <span>
          Menampilkan <strong className="text-[#111827]">{startItem}</strong> -{" "}
          <strong className="text-[#111827]">{endItem}</strong> dari{" "}
          <strong className="text-[#111827]">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-[#e5e7eb] pl-4">
            <span className="text-[11px]">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
              }}
              className="h-7 px-2 text-xs font-semibold rounded-md border border-[#cbd5e1] bg-white text-[#111827] focus:outline-none focus:border-[#111827]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tombol Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="h-8 w-8 p-0 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-[#9ca3af] px-1 text-xs font-bold">
                      ...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`h-8 min-w-[32px] px-2 text-xs font-bold rounded-lg transition-all ${
                      currentPage === p
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <Button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="h-8 w-8 p-0 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Selanjutnya"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
