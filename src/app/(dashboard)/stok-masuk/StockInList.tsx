"use client"

import React, { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { StockInForm } from "./StockInForm"
import Link from "next/link"

export function StockInList({ 
  adjustments, 
  products,
  pagination 
}: { 
  adjustments: any[], 
  products: any[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
    key: 'createdAt',
    direction: 'desc'
  })

  // Filter and Sort in client for search, but pagination is server-side
  // Note: For a true server-side "like audit", search should also be server side.
  // But let's stick to consistent pagination UI first.
  const filteredAndSortedAdjustments = React.useMemo(() => {
    let items = [...adjustments].filter(adj => 
      adj.product.name.toLowerCase().includes(search.toLowerCase()) || 
      adj.product.sku.toLowerCase().includes(search.toLowerCase())
    )

    if (sortConfig.key && sortConfig.direction) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (sortConfig.key === 'product') {
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
        } else if (sortConfig.key === 'sku') {
          aValue = a.product.sku.toLowerCase();
          bValue = b.product.sku.toLowerCase();
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [adjustments, search, sortConfig])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  }

  const SortHeader = ({ label, sortKey, align = "left" }: { label: string, sortKey: string, align?: "left" | "right" | "center" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <TableHead 
        className={cn(
          "cursor-pointer hover:bg-[#f9fafb] transition-colors h-12 py-0 group/sh border-b border-[#e5e7eb]",
          isActive && "bg-[#f9fafb]"
        )}
        onClick={() => handleSort(sortKey)}
      >
        <div className={cn(
          "flex items-center gap-1.5 w-full",
          align === "right" && "justify-end",
          align === "center" && "justify-center"
        )}>
          <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{label}</span>
          <div className="flex-shrink-0">
            {!isActive && <ArrowUpDown size={12} className="text-[#9ca3af] opacity-0 group-hover/sh:opacity-100 transition-opacity" />}
            {isActive && sortConfig.direction === 'asc' && <ArrowUp size={12} className="text-[#111827]" />}
            {isActive && sortConfig.direction === 'desc' && <ArrowDown size={12} className="text-[#111827]" />}
          </div>
        </div>
      </TableHead>
    );
  }


  const skip = (pagination.page - 1) * pagination.limit

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Stok Masuk</h1>
          <p className="text-sm text-[#6b7280] mt-1">Kelola dan pantau riwayat penambahan stok produk.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#5E54F7] hover:bg-[#4b43c6] text-white h-11 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#5E54F7]/20 active:scale-[0.98]"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">Tambah Stok</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row gap-4 items-center bg-[#f9fafb]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={18} />
            <Input
              placeholder="Cari SKU atau nama produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10 bg-white border-[#e5e7eb] h-10 rounded-lg focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] transition-all text-sm font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#ef4444] transition-colors p-1 rounded-md"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="text-[11px] font-medium text-[#6b7280] px-3 py-1.5 bg-white rounded-lg border border-[#e5e7eb]">
               Halaman {pagination.page} dari {pagination.totalPages}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-[#e5e7eb]">
                <SortHeader label="Tanggal" sortKey="createdAt" />
                <SortHeader label="Produk" sortKey="product" />
                <SortHeader label="Qty" sortKey="quantity" align="center" />
                <SortHeader label="Harga Modal" sortKey="cost" align="right" />
                <SortHeader label="Harga Jual" sortKey="price" align="right" />
                <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4 border-b border-[#e5e7eb]">CATATAN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedAdjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    Tidak ada data stok masuk.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedAdjustments.map((adj) => (
                  <TableRow key={adj.id} className="hover:bg-[#f9fafb] transition-colors border-b-[#e5e7eb]">
                    <TableCell className="text-xs font-medium text-[#64748b]">
                      {format(new Date(adj.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111827] text-sm">{adj.product.name}</span>
                        <code className="text-[10px] font-mono font-medium text-[#5E54F7] bg-[#5E54F7]/5 px-1.5 py-0.5 rounded border border-[#5E54F7]/10">
                          {adj.product.sku}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-[#166534] text-sm">
                      +{adj.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#64748b]">
                      {adj.cost ? formatCurrency(Number(adj.cost)) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-[#111827]">
                      {adj.price ? formatCurrency(Number(adj.price)) : "-"}
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="text-[#64748b] text-[11px] italic leading-tight block truncate max-w-[200px]" title={adj.notes}>{adj.notes || "-"}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
           <div className="text-[11px] font-medium text-[#6b7280]">
             Menampilkan {skip + 1} - {Math.min(skip + filteredAndSortedAdjustments.length, pagination.total)} dari {pagination.total} entitas
           </div>
           
           <div className="flex items-center gap-2">
              <Link 
                href={`/stok-masuk?page=${Math.max(1, pagination.page - 1)}`}
                className={cn(
                  "p-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]",
                  pagination.page <= 1 && "opacity-30 pointer-events-none"
                )}
              >
                <ChevronLeft size={16} />
              </Link>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i-1] !== p - 1 && <span className="text-[#9ca3af] px-1 text-xs">...</span>}
                      <Link
                        href={`/stok-masuk?page=${p}`}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                          pagination.page === p ? "bg-[#5E54F7] text-white shadow-md shadow-[#5E54F7]/20" : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50"
                        )}
                      >
                        {p}
                      </Link>
                    </React.Fragment>
                  ))
                }
              </div>

              <Link 
                href={`/stok-masuk?page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
                className={cn(
                  "p-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]",
                  pagination.page >= pagination.totalPages && "opacity-30 pointer-events-none"
                )}
              >
                <ChevronRight size={16} />
              </Link>
           </div>
        </div>
      </div>

      <StockInForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        products={products}
      />
    </div>
  )
}
