"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, User, Store, Building2, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { UserFormModal } from "./UserFormModal"
import { deleteUser } from "./actions"
import { TablePagination } from "@/components/TablePagination"
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

interface UserListProps {
  users: any[]
  outlets?: any[]
  currentRole?: string
  currentOutletId?: string | null
}

export function UserList({ users, outlets = [], currentRole = "ADMIN", currentOutletId = null }: UserListProps) {
  const [localOutlets, setLocalOutlets] = useState<any[]>(outlets)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State Pagination & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setLocalOutlets(outlets)
  }, [outlets])

  // Filter Pengguna
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase().trim()
    return users.filter((u) => {
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.outlet?.nama?.toLowerCase().includes(q)
      )
    })
  }, [users, searchQuery])

  // Hitung total halaman
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  // Sesuaikan halaman aktif jika data terfilter
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Potong data sesuai halaman (Paginated)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredUsers.slice(startIndex, startIndex + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    setIsDeleting(true)
    const result = await deleteUser(userToDelete.id)
    setIsDeleting(false)
    
    if (result.success) {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } else {
      alert(result.error || "Gagal menghapus user")
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === "SUPERADMIN") {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-purple-700 bg-purple-50 border-purple-200 px-1.5 py-0 uppercase">
          Super Admin
        </Badge>
      )
    }
    if (role === "ADMIN") {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-gray-700 bg-gray-50 border-gray-200 px-1.5 py-0 uppercase">
          Administrator
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-gray-400 bg-white border-gray-100 px-1.5 py-0 uppercase">
        Kasir Staff
      </Badge>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="p-5 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">Daftar Pengguna & Cabang</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Total {users.length} akun terdaftar • {localOutlets.length} cabang outlet aktif.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
              <Input
                type="text"
                placeholder="Cari nama, email, outlet..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 h-10 text-xs bg-[#f9fafb] border-[#e5e7eb] rounded-xl focus:bg-white focus:border-[#111827]"
              />
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl h-10 px-4 transition-all shadow-sm flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Tambah Akun
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Identitas</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Alamat Email</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Peran</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Outlet / Cabang</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Tanggal Dibuat</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-right text-[11px] uppercase tracking-wider px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    {searchQuery ? `Tidak ada pengguna yang cocok dengan "${searchQuery}".` : "Belum ada pengguna terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#f9fafb]/50 border-b-[#e5e7eb] last:border-0 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#111827]">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-semibold text-[#111827]">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-xs font-medium text-[#6b7280]">{user.email}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {user.role === "SUPERADMIN" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Store size={12} /> Semua Outlet
                        </span>
                      ) : user.outlet?.nama ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-950 bg-[#FFB800]/20 px-2 py-0.5 rounded-full border border-[#FFB800]/30">
                          <Store size={12} /> {user.outlet.nama}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Belum ditentukan</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-[11px] font-medium text-[#6b7280]">
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: id })}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination Controls */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          itemLabel="pengguna"
        />
      </div>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser}
        outlets={localOutlets}
        currentRole={currentRole}
        currentOutletId={currentOutletId}
        onOutletCreated={(newOutlet) => {
          setLocalOutlets((prev) => [...prev, newOutlet])
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengguna <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Menghapus..." : "Hapus Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
