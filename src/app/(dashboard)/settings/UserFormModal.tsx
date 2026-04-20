"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser, updateUser } from "./actions"
import { User, Mail, Lock, Shield } from "lucide-react"

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user?: any
}

export function UserFormModal({ isOpen, onClose, user }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role
      })
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "CASHIER"
      })
    }
    setError("")
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.name || !formData.email) {
      setError("Nama dan email harus diisi")
      return
    }

    if (!user && !formData.password) {
      setError("Password harus diisi untuk akun baru")
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    setLoading(true)

    let result
    if (user) {
      result = await updateUser(user.id, formData)
    } else {
      result = await createUser(formData)
    }

    setLoading(false)

    if (result.success) {
      onClose()
      setFormData({ name: "", email: "", password: "", role: "CASHIER" })
    } else {
      setError(result.error || "Terjadi kesalahan")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border border-[#e5e7eb] shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[95vh] gap-0">
        <div className="p-5 border-b border-[#e5e7eb] bg-[#f9fafb] shrink-0">
          <DialogTitle className="text-lg font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <User size={20} className="text-[#111827]" />
            {user ? "Perbarui Akun Pengguna" : "Daftarkan Akun Baru"}
          </DialogTitle>
          <p className="text-[11px] font-medium text-[#6b7280] mt-0.5">Lengkapi kredensial akses untuk personel toko.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Name Field */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Nama Lengkap Personel
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Misal: Ahmad Fauzi"
                className="h-10 pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Alamat Surel (Email)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@email.com"
                className="h-10 pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Kata Sandi Akses {user && <span className="text-[9px] text-emerald-500 lowercase">(Opsional)</span>}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? "••••••••" : "Min. 6 karakter kreatif"}
                className="h-10 pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="space-y-1">
            <Label htmlFor="role" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Otoritas / Hak Akses
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] z-10" size={16} />
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-10 pl-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#e5e7eb]">
                  <SelectItem value="ADMIN" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">ADMINISTRATOR</span>
                      <span className="text-[10px] text-[#9ca3af] tracking-tight">(Akses Penuh)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CASHIER" className="text-xs">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-[#6b7280]">KASIR REGULER</span>
                       <span className="text-[10px] text-[#9ca3af] tracking-tight">(Akses Jualan)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg italic text-[11px] font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[#f3f4f6]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 rounded-lg border-[#e5e7eb] hover:bg-[#f9fafb] text-[10px] font-bold uppercase transition-all"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[1.5] h-10 rounded-lg bg-[#111827] hover:bg-black text-white text-[10px] font-bold uppercase transition-all shadow-sm active:scale-[0.98]"
            >
              {loading ? "Memproses..." : user ? "Update Akun" : "Konfirmasi & Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
