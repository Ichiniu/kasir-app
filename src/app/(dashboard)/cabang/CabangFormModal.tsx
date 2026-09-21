"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Store, MapPin, AlertCircle } from "lucide-react"
import { createOutlet, updateOutlet } from "./actions"

interface CabangFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  outletToEdit?: {
    id: string
    nama: string
    alamat?: string | null
  } | null
}

export function CabangFormModal({
  isOpen,
  onClose,
  onSuccess,
  outletToEdit = null,
}: CabangFormModalProps) {
  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isEditing = Boolean(outletToEdit)

  useEffect(() => {
    if (outletToEdit) {
      setNama(outletToEdit.nama || "")
      setAlamat(outletToEdit.alamat || "")
    } else {
      setNama("")
      setAlamat("")
    }
    setError("")
  }, [outletToEdit, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nama.trim()) {
      setError("Nama cabang wajib diisi.")
      return
    }

    setLoading(true)
    try {
      if (isEditing && outletToEdit) {
        const res = await updateOutlet(outletToEdit.id, {
          nama: nama.trim(),
          alamat: alamat.trim(),
        })
        if (res.success) {
          onSuccess()
          onClose()
        } else {
          setError(res.error || "Gagal memperbarui data cabang.")
        }
      } else {
        const res = await createOutlet({
          nama: nama.trim(),
          alamat: alamat.trim(),
        })
        if (res.success) {
          onSuccess()
          onClose()
        } else {
          setError(res.error || "Gagal membuat cabang baru.")
        }
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl">
        <div className="p-6 border-b border-[#e5e7eb] bg-[#f9fafb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shadow-xs">
              <Store size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#111827] tracking-tight">
                {isEditing ? "Edit Cabang" : "Tambah Cabang Baru"}
              </DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {isEditing
                  ? "Perbarui nama dan alamat operasional cabang."
                  : "Buat cabang baru untuk memperluas operasional bisnis."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Cabang */}
          <div className="space-y-1.5">
            <Label htmlFor="nama-cabang" className="text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
              Nama Cabang <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <Input
                id="nama-cabang"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Cabang Jakarta Pusat, Outlet Tebet"
                className="h-10 pl-9 rounded-xl border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Alamat Cabang */}
          <div className="space-y-1.5">
            <Label htmlFor="alamat-cabang" className="text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
              Alamat Lengkap (Opsional)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-[#9ca3af]" size={16} />
              <Textarea
                id="alamat-cabang"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Sudirman No. 45, Jakarta Pusat"
                className="min-h-[90px] pl-9 py-2.5 rounded-xl border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f3f4f6]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-xl border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
            >
              {loading
                ? isEditing
                  ? "Menyimpan..."
                  : "Menambahkan..."
                : isEditing
                ? "Simpan Perubahan"
                : "Tambah Cabang"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
