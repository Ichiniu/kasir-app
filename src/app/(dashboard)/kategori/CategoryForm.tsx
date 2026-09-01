"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertCategory } from "./actions"

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: any
}

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (category) {
      setName(category.name || "")
      setDescription(category.description || "")
    } else {
      setName("")
      setDescription("")
    }
    setErrorMessage("")
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage("")
    setLoading(true)

    try {
      await upsertCategory({
        id: category?.id,
        name,
        description,
      })
      onOpenChange(false)
    } catch (error: any) {
      setErrorMessage(error.message || "Gagal menyimpan kategori")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border border-[#e5e7eb] shadow-2xl p-0 overflow-hidden bg-white flex flex-col gap-0">
        <div className="p-5 border-b border-[#e5e7eb] shrink-0 bg-[#f9fafb]">
          <DialogTitle className="text-lg font-bold text-[#111827] tracking-tight">
            {category ? "Edit Kategori" : "Tambah Kategori Baru"}
          </DialogTitle>
          <p className="text-[11px] font-medium text-[#6b7280] mt-0.5 tracking-tight">
            {category ? "Ubah detail nama atau deskripsi kategori." : "Buat kategori baru untuk mengelompokkan produk Anda."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Nama Kategori <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Makanan, Minuman, Pakaian..."
              required
              className="h-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-sm font-semibold transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
              Deskripsi (Opsional)
            </Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan singkat tentang kategori ini..."
              rows={3}
              className="rounded-lg border-[#e5e7eb] bg-white text-xs transition-all focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] font-medium"
            />
          </div>

          <div className="pt-3 flex items-center gap-2 border-t border-[#f3f4f6]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-lg border-[#e5e7eb] hover:bg-[#f9fafb] text-[#111827] text-xs font-bold uppercase transition-all"
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-[1.5] h-10 rounded-lg bg-[#5E54F7] hover:bg-[#4b43c6] text-white text-xs font-bold uppercase transition-all shadow-md shadow-[#5E54F7]/20 active:scale-[0.98]"
            >
              {loading ? "Menyimpan..." : category ? "Update Kategori" : "Simpan Kategori"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
