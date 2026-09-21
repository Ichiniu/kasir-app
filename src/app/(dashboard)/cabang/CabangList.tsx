"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Edit,
  Trash2,
  Store,
  MapPin,
  Users,
  Search,
  AlertTriangle,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CabangFormModal } from "./CabangFormModal"
import { deleteOutlet } from "./actions"
import { TablePagination } from "@/components/TablePagination"

interface OutletItem {
  id: string
  nama: string
  alamat: string | null
  createdAt: Date | string
  _count: {
    users: number
    transactions?: number
    products?: number
  }
}

interface CabangListProps {
  initialOutlets: OutletItem[]
}

export function CabangList({ initialOutlets }: CabangListProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<OutletItem | null>(null)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [outletToDelete, setOutletToDelete] = useState<OutletItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter cabang
  const filteredOutlets = useMemo(() => {
    if (!searchQuery.trim()) return initialOutlets
    const q = searchQuery.toLowerCase().trim()
    return initialOutlets.filter((outlet) => {
      return (
        outlet.nama?.toLowerCase().includes(q) ||
        outlet.alamat?.toLowerCase().includes(q)
      )
    })
  }, [initialOutlets, searchQuery])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOutlets.length / pageSize))

  // Reset page if filtered results are shorter
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const paginatedOutlets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOutlets.slice(startIndex, startIndex + pageSize)
  }, [filteredOutlets, currentPage, pageSize])

  const handleAdd = () => {
    setEditingOutlet(null)
    setIsFormOpen(true)
  }

  const handleEdit = (outlet: OutletItem) => {
    setEditingOutlet(outlet)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (outlet: OutletItem) => {
    setOutletToDelete(outlet)
    setDeleteError("")
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!outletToDelete) return

    setIsDeleting(true)
    setDeleteError("")

    const res = await deleteOutlet(outletToDelete.id)
    setIsDeleting(false)

    if (res.success) {
      setDeleteDialogOpen(false)
      setOutletToDelete(null)
      router.refresh()
    } else {
      setDeleteError(res.error || "Gagal menghapus cabang")
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-5 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">Daftar Cabang</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Total {initialOutlets.length} cabang terdaftar dalam jaringan bisnis Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
              <Input
                type="text"
                placeholder="Cari nama cabang atau alamat..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 h-10 text-xs bg-[#f9fafb] border-[#e5e7eb] rounded-xl focus:bg-white focus:border-[#111827]"
              />
            </div>

            {/* Tambah Cabang Button */}
            <Button
              type="button"
              onClick={handleAdd}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl h-10 px-4 transition-all shadow-sm flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Tambah Cabang
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow className="border-b border-[#e5e7eb] hover:bg-transparent">
                <TableHead className="w-[60px] text-center text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-3.5">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-3.5">
                  Nama Cabang
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-3.5">
                  Alamat
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-3.5 text-center">
                  Jumlah Pengelola
                </TableHead>
                <TableHead className="w-[120px] text-right text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-3.5 pr-6">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#f3f4f6]">
              {paginatedOutlets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-[#6b7280]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Store size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {searchQuery ? "Cabang tidak ditemukan" : "Belum ada cabang terdaftar"}
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        {searchQuery
                          ? "Coba kata kunci pencarian yang lain."
                          : "Klik tombol 'Tambah Cabang' di atas untuk menambahkan cabang pertama."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOutlets.map((outlet, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1
                  const userCount = outlet._count?.users || 0

                  return (
                    <TableRow key={outlet.id} className="hover:bg-[#f9fafb]/80 transition-colors">
                      {/* No */}
                      <TableCell className="text-center text-xs font-semibold text-[#9ca3af]">
                        {itemIndex}
                      </TableCell>

                      {/* Nama Cabang */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shrink-0">
                            <Store size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#111827]">
                              {outlet.nama}
                            </div>
                            <div className="text-[11px] text-[#9ca3af]">
                              ID: {outlet.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Alamat */}
                      <TableCell className="py-4">
                        {outlet.alamat ? (
                          <div className="flex items-start gap-1.5 text-xs text-[#4b5563] max-w-md leading-relaxed">
                            <MapPin size={14} className="text-[#9ca3af] shrink-0 mt-0.5" />
                            <span>{outlet.alamat}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9ca3af] italic">
                            Belum ada alamat
                          </span>
                        )}
                      </TableCell>

                      {/* Jumlah Pengelola */}
                      <TableCell className="py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                          <Users size={13} className="text-slate-500" />
                          <span>{userCount} Pengelola</span>
                        </div>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(outlet)}
                            className="h-8 w-8 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
                            title="Edit Cabang"
                          >
                            <Edit size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(outlet)}
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Hapus Cabang"
                          >
                            <Trash2 size={15} />
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

        {/* Pagination Controls */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOutlets.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          itemLabel="cabang"
        />
      </div>

      {/* Modal Add / Edit */}
      <CabangFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingOutlet(null)
        }}
        onSuccess={() => {
          router.refresh()
        }}
        outletToEdit={editingOutlet}
      />

      {/* Alert Dialog Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-2xl p-6 bg-white border border-[#e5e7eb]">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle size={20} />
            </div>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Hapus Cabang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6b7280] space-y-2">
              <div>
                Apakah Anda yakin ingin menghapus cabang <strong>{outletToDelete?.nama}</strong>?
              </div>
              {outletToDelete?._count?.users ? (
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-[11px] border border-amber-200">
                  Perhatian: Cabang ini masih memiliki {outletToDelete._count.users} pengguna yang ditugaskan.
                </div>
              ) : null}
              {deleteError && (
                <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-[11px] border border-red-200 font-medium">
                  {deleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                setDeleteError("")
                setOutletToDelete(null)
              }}
              className="rounded-xl text-xs h-9"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold h-9"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Cabang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
