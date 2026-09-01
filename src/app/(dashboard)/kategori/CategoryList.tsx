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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Tag, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryForm } from "./CategoryForm"
import { deleteCategory } from "./actions"

interface CategoryItem {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    products: number
  }
}

export function CategoryList({ categories }: { categories: CategoryItem[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "name",
    direction: "asc",
  })
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredAndSortedCategories = React.useMemo(() => {
    let items = [...categories].filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })

    if (sortConfig.key && sortConfig.direction) {
      items.sort((a, b) => {
        let aValue: any = a
        let bValue: any = b

        if (sortConfig.key === "productsCount") {
          aValue = a._count?.products || 0
          bValue = b._count?.products || 0
        } else {
          aValue = a[sortConfig.key as keyof CategoryItem] || ""
          bValue = b[sortConfig.key as keyof CategoryItem] || ""
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return items
  }, [categories, search, sortConfig])

  const handleAdd = () => {
    setActionError(null)
    setSelectedCategory(null)
    setIsFormOpen(true)
  }

  const handleEdit = (category: CategoryItem) => {
    setActionError(null)
    setSelectedCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = async (category: CategoryItem) => {
    setActionError(null)
    const productCount = category._count?.products || 0

    if (productCount > 0) {
      alert(`Kategori "${category.name}" masih memiliki ${productCount} produk. Pindahkan atau hapus produk terlebih dahulu sebelum menghapus kategori ini.`)
      return
    }

    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      try {
        await deleteCategory(category.id)
      } catch (err: any) {
        setActionError(err.message || "Gagal menghapus kategori")
      }
    }
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const SortHeader = ({
    label,
    sortKey,
    align = "left",
  }: {
    label: string
    sortKey: string
    align?: "left" | "right" | "center"
  }) => {
    const isActive = sortConfig.key === sortKey
    return (
      <TableHead
        className={cn(
          "cursor-pointer hover:bg-[#f9fafb] transition-colors h-12 py-0 group/sh border-b border-[#e5e7eb]",
          isActive && "bg-[#f9fafb]"
        )}
        onClick={() => handleSort(sortKey)}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 w-full",
            align === "right" && "justify-end",
            align === "center" && "justify-center"
          )}
        >
          <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{label}</span>
          <div className="flex-shrink-0">
            {!isActive && (
              <ArrowUpDown
                size={12}
                className="text-[#9ca3af] opacity-0 group-hover/sh:opacity-100 transition-opacity"
              />
            )}
            {isActive && sortConfig.direction === "asc" && <ArrowUp size={12} className="text-[#111827]" />}
            {isActive && sortConfig.direction === "desc" && <ArrowDown size={12} className="text-[#111827]" />}
          </div>
        </div>
      </TableHead>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Kategori Produk</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Kelola kategori untuk mengelompokkan dan memudahkan pencarian produk inventori Anda.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-[#5E54F7] hover:bg-[#4b43c6] text-white h-11 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#5E54F7]/20 active:scale-[0.98]"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">Tambah Kategori</span>
        </Button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex flex-col md:flex-row gap-4 items-center bg-[#f9fafb]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={18} />
            <Input
              placeholder="Cari nama atau deskripsi kategori..."
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
          <div className="text-xs font-semibold text-[#6b7280]">
            Total {filteredAndSortedCategories.length} Kategori
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-[#e5e7eb]">
                <SortHeader label="Nama Kategori" sortKey="name" />
                <SortHeader label="Deskripsi" sortKey="description" />
                <SortHeader label="Jumlah Produk Terkait" sortKey="productsCount" align="center" />
                <TableHead className="font-semibold text-[#6b7280] h-12 text-center text-[11px] uppercase tracking-wider px-4 border-b border-[#e5e7eb] w-[120px]">
                  AKSI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    {search ? "Tidak ada kategori yang sesuai dengan pencarian." : "Belum ada kategori yang ditambahkan."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedCategories.map((cat) => {
                  const productCount = cat._count?.products || 0
                  return (
                    <TableRow key={cat.id} className="group transition-colors border-b-[#e5e7eb]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#5E54F7]/10 flex items-center justify-center text-[#5E54F7]">
                            <Tag size={16} />
                          </div>
                          <span className="text-sm font-bold text-[#111827]">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[#6b7280] max-w-md line-clamp-2">
                          {cat.description || <span className="italic text-[#9ca3af]">Tidak ada deskripsi</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold text-xs px-2.5 py-1 gap-1.5 inline-flex items-center",
                            productCount > 0
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}
                        >
                          <Package size={13} />
                          {productCount} Produk
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cat)}
                            className="h-8 w-8 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
                            title="Edit Kategori"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat)}
                            className="h-8 w-8 rounded-lg text-[#6b7280] hover:text-red-600 hover:bg-red-50"
                            title="Hapus Kategori"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={selectedCategory}
      />
    </div>
  )
}
