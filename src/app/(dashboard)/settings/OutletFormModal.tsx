"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Store, MapPin, AlertCircle, PlusCircle } from "lucide-react"
import { createOutlet } from "./actions"

interface OutletFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newOutlet: any) => void
}

export function OutletFormModal({ isOpen, onClose, onSuccess }: OutletFormModalProps) {
  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nama.trim()) {
      setError("Nama outlet/cabang wajib diisi")
      return
    }

    setLoading(true)
    try {
      const res = await createOutlet({ nama, alamat })
      if (res.success && res.outlet) {
        setNama("")
        setAlamat("")
        onSuccess(res.outlet)
        onClose()
      } else {
        setError(res.error || "Gagal membuat cabang outlet")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl">
        <div className="p-6 border-b border-[#e5e7eb] bg-[#f9fafb]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
              <Store size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#111827] tracking-tight">
                Tambah Cabang / Outlet Baru
              </DialogTitle>
              <p className="text-xs text-[#6b7280]">
                Cabang baru akan langsung tersedia di pilihan penugasan akun.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama Outlet */}
          <div className="space-y-1">
            <Label htmlFor="nama" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Nama Cabang / Outlet <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <Input
                id="nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Cabang Tebet, Outlet Surabaya"
                className="h-10 pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Alamat Outlet */}
          <div className="space-y-1">
            <Label htmlFor="alamat" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Alamat Lengkap Cabang (Opsional)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-[#9ca3af]" size={16} />
              <Textarea
                id="alamat"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Raya No. 123, Kota..."
                className="min-h-[80px] pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-600">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] h-10 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              {loading ? "Menyimpan..." : "Simpan Cabang"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
