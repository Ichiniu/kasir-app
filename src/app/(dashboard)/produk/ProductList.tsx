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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Power, PowerOff, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X, ChevronDown, Tag, CheckCircle, XCircle, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProductForm } from "./ProductForm"
import { toggleProductStatus } from "./actions"
import Link from "next/link"

export function ProductList({ 
  initialProducts, 
  categories,
  pagination 
}: { 
  initialProducts: any[], 
  categories: any[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
    key: 'createdAt',
    direction: 'desc'
  })

  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")


  const sortedProducts = React.useMemo(() => {
    let items = [...initialProducts].filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.toLowerCase()) ||
                            (p.category?.name || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? p.isActive : !p.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    })

    if (sortConfig.key && sortConfig.direction) {
      items.sort((a, b) => {
        let aValue: any = a;
        let bValue: any = b;
        
        // Handle nested category name
        if (sortConfig.key === 'category') {
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle string comparison for case-insensitivity
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [initialProducts, search, sortConfig, filterCategory, filterStatus])

  const handleAdd = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (confirm(`Apakah Anda yakin ingin ${currentStatus ? 'Menonaktifkan' : 'Mengaktifkan'} produk ini?`)) {
      await toggleProductStatus(id, currentStatus)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Sortable Header Component
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
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Produk</h1>
          <p className="text-sm text-[#6b7280] mt-1">Kelola inventori, harga, dan stok produk Anda.</p>
        </div>
        <Button 
          onClick={handleAdd}
          className="bg-[#5E54F7] hover:bg-[#4b43c6] text-white h-11 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#5E54F7]/20 active:scale-[0.98]"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">Tambah Produk</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex flex-col xl:flex-row gap-4 items-center bg-[#f9fafb]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={18} />
            <Input
              placeholder="Cari SKU, nama produk atau kategori..."
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
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10 px-4 rounded-lg border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-sm font-medium transition-all"
                >
                  <Tag size={16} className="text-[#9ca3af] mr-2" />
                  {filterCategory === "all" ? "Semua Kategori" : categories.find(cat => cat.id === filterCategory)?.name}
                  <ChevronDown size={14} className="ml-2 text-[#9ca3af]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-[#e5e7eb]">
                <DropdownMenuItem onClick={() => setFilterCategory("all")} className={cn(filterCategory === "all" && "bg-[#5E54F7] text-white focus:bg-[#5E54F7] focus:text-white")}>
                  Semua Kategori
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map(cat => (
                  <DropdownMenuItem key={cat.id} onClick={() => setFilterCategory(cat.id)} className={cn(filterCategory === cat.id && "bg-[#5E54F7] text-white focus:bg-[#5E54F7] focus:text-white")}>
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10 px-4 rounded-lg border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-sm font-medium transition-all"
                >
                  <Circle size={14} className={cn("mr-2", filterStatus === "active" ? "text-emerald-500 fill-emerald-500" : filterStatus === "inactive" ? "text-red-500 fill-red-500" : "text-[#9ca3af]")} />
                  {filterStatus === "all" ? "Semua Status" : filterStatus === "active" ? "Aktif" : "Nonaktif"}
                  <ChevronDown size={14} className="ml-2 text-[#9ca3af]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-[#e5e7eb]">
                <DropdownMenuItem onClick={() => setFilterStatus("all")} className={cn(filterStatus === "all" && "bg-[#5E54F7] text-white focus:bg-[#5E54F7] focus:text-white")}>
                  Semua Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus("active")} className={cn(filterStatus === "active" && "bg-emerald-500 text-white")}>
                  Aktif
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")} className={cn(filterStatus === "inactive" && "bg-red-500 text-white")}>
                  Nonaktif
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-[#e5e7eb]">
                <SortHeader label="SKU" sortKey="sku" />
                <SortHeader label="Nama Produk" sortKey="name" />
                <SortHeader label="Kategori" sortKey="category" />
                <SortHeader label="Harga Modal" sortKey="cost" align="right" />
                <SortHeader label="Harga Jual" sortKey="price" align="right" />
                <TableHead className="font-semibold text-[#6b7280] h-12 text-center text-[11px] uppercase tracking-wider px-4 border-b border-[#e5e7eb]">UNIT</TableHead>
                <SortHeader label="Stok" sortKey="stock" align="center" />
                <TableHead className="font-semibold text-[#6b7280] h-12 text-center text-[11px] uppercase tracking-wider px-4 border-b border-[#e5e7eb]">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    Tidak ada produk yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className={cn(
                      "group transition-colors border-b-[#e5e7eb]",
                      !product.isActive && "bg-[#f9fafb]/50 grayscale select-none"
                    )}
                  >
                    <TableCell>
                      <code className="text-xs font-mono font-medium text-[#3b82f6] bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-semibold text-[#111827]", !product.isActive && "line-through")}>
                          {product.name}
                        </span>
                        <span className="text-[11px] text-[#6b7280] truncate max-w-[200px]">{product.description || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-[#e5e7eb] text-[#6b7280] font-medium text-[10px] h-5">
                        {product.category?.name || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#6b7280]">
                      {formatCurrency(Number(product.cost))}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-[#111827]">
                      {formatCurrency(Number(product.price))}
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#6b7280]">
                      {product.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-[11px] font-bold",
                        !product.isActive ? "bg-gray-100 text-[#9ca3af]" : 
                        product.stock <= product.minStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {product.stock}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(product)}
                          disabled={!product.isActive}
                          className="h-8 w-8 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleStatus(product.id, product.isActive)}
                          className={cn(
                            "h-8 w-8 rounded-lg",
                            product.isActive ? "text-[#6b7280] hover:text-red-600 hover:bg-red-50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          )}
                        >
                          {product.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
           <div className="text-[11px] font-medium text-[#6b7280]">
             Menampilkan {skip + 1} - {Math.min(skip + sortedProducts.length, pagination.total)} dari {pagination.total} entitas
           </div>
           
           <div className="flex items-center gap-2">
              <Link 
                href={`/produk?page=${Math.max(1, pagination.page - 1)}`}
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
                        href={`/produk?page=${p}`}
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
                href={`/produk?page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
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

      <ProductForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={selectedProduct}
        categories={categories}
      />
    </div>
  )
}
