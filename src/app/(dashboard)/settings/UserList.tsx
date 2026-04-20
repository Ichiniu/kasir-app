"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, User, Mail, Shield } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { UserFormModal } from "./UserFormModal"
import { deleteUser } from "./actions"
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
}

export function UserList({ users }: UserListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    if (role === "ADMIN") {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-gray-700 bg-gray-50 border-gray-200 px-1.5 py-0 uppercase">
          Administrator
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-gray-400 bg-white border-gray-100 px-1.5 py-0 uppercase">
        Cashier Staff
      </Badge>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">Daftar Pengguna</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">Total {users.length} akun terdaftar dalam sistem.</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-lg h-10 px-4 transition-all"
          >
            <Plus size={16} className="mr-2" />
            Tambah Akun
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Identitas</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Alamat Email</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Peran</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-6">Tanggal Dibuat</TableHead>
                <TableHead className="font-semibold text-[#6b7280] h-11 text-right text-[11px] uppercase tracking-wider px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-[#9ca3af] text-sm italic">
                    Belum ada pengguna terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
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
                      <span className="text-[11px] font-medium text-[#6b7280]">
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: id })}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="h-8 px-2 text-[#6b7280] hover:text-[#111827] hover:bg-white border-transparent hover:border-[#e5e7eb] border"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          className="h-8 px-2 text-[#9ca3af] hover:text-[#ef4444] hover:bg-white border-transparent hover:border-red-50 border"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-[#e5e7eb]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#111827]">Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#6b7280]">
              Yakin menghapus <strong>{userToDelete?.name}</strong>? Tindakan ini permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-[#e5e7eb] h-10 text-xs font-bold uppercase">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-[#ef4444] hover:bg-black text-white rounded-lg h-10 text-xs font-bold uppercase"
            >
              Hapus Selamanya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
