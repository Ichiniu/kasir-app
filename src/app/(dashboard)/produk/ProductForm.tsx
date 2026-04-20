"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { upsertProduct } from "./actions"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  categories: any[]
}

const units = ["Pcs", "Kg", "Gram", "Ikat", "Botol", "Gelas", "Bungkus", "Box"]

export function ProductForm({ open, onOpenChange, product, categories }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [cost, setCost] = useState<string>(product?.cost ? String(Number(product.cost)) : "0")
  const [price, setPrice] = useState<string>(product?.price ? String(Number(product.price)) : "0")

  // Sync state when product changes
  React.useEffect(() => {
    if (product) {
      setCost(String(Number(product.cost)))
      setPrice(String(Number(product.price)))
    } else {
      setCost("0")
      setPrice("0")
    }
  }, [product])

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, "")
    const split = numberString.split(",")
    let sisa = split[0].length % 3
    let rupiah = split[0].substr(0, sisa)
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

    if (ribuan) {
      const separator = sisa ? "." : ""
      rupiah += separator + ribuan.join(".")
    }

    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah
    return rupiah
  }

  const handleCurrencyChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setter(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    try {
      await upsertProduct({
        ...data,
        id: product?.id,
        cost: cost,
        price: price,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save product:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border border-[#e5e7eb] shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[95vh] gap-0">
        <div className="p-5 border-b border-[#e5e7eb] shrink-0 bg-[#f9fafb]">
          <DialogTitle className="text-lg font-bold text-[#111827] tracking-tight">
            {product ? "Edit Informasi Produk" : "Registrasi Produk Baru"}
          </DialogTitle>
          <p className="text-[11px] font-medium text-[#6b7280] mt-0.5 tracking-tight">Pastikan data produk terisi dengan akurat.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="sku" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Nomor SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product?.sku}
                placeholder="PROD-..."
                required
                className="h-9 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold transition-all"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Nama Lengkap Produk</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                placeholder="Ketik nama produk..."
                required
                className="h-9 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="categoryId" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Kategori Inventori</Label>
              <Select name="categoryId" defaultValue={product?.categoryId || ""}>
                <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold transition-all">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#e5e7eb] bg-white">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Satuan Unit</Label>
              <Select name="unit" defaultValue={product?.unit || "Pcs"}>
                <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold transition-all">
                  <SelectValue placeholder="Unit..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#e5e7eb] bg-white">
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit} className="text-xs">
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-[#f3f4f6]">
            <div className="space-y-1">
              <Label htmlFor="cost" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Harga Beli (Modal)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[10px] font-bold">Rp</span>
                <Input
                  id="cost"
                  type="text"
                  value={formatRupiah(cost)}
                  onChange={handleCurrencyChange(setCost)}
                  placeholder="0"
                  required
                  className="h-9 rounded-lg border-[#e5e7eb] pl-8 bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-bold text-[#111827] transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Harga Jual Konsumen</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3b82f6] text-[10px] font-bold">Rp</span>
                <Input
                  id="price"
                  type="text"
                  value={formatRupiah(price)}
                  onChange={handleCurrencyChange(setPrice)}
                  placeholder="0"
                  required
                  className="h-9 rounded-lg border-[#e5e7eb] pl-8 bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-bold text-[#3b82f6] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="stock" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Stok Tersedia Saat Ini</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={product?.stock || 0}
                placeholder="0"
                required
                className="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] text-xs font-bold transition-all focus:bg-white focus:ring-2 focus:ring-[#111827]/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="minStock" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Limit Stok Minimum</Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                defaultValue={product?.minStock || 5}
                placeholder="5"
                required
                className="h-9 rounded-lg border-[#e5e7eb] bg-[#f9fafb] text-xs font-bold transition-all focus:bg-white focus:ring-2 focus:ring-[#111827]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Keterangan Produk</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description || ""}
              placeholder="Berikan deskripsi singkat produk (opasinal)..."
              className="rounded-lg border-[#e5e7eb] bg-white min-h-[60px] text-xs transition-all focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] font-medium"
            />
          </div>

          <div className="pt-2 flex items-center gap-2 border-t border-[#f3f4f6]">
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
              disabled={loading}
              className="flex-[1.5] h-10 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-bold uppercase transition-all shadow-sm active:scale-[0.98]"
            >
              {loading ? "Menyimpan..." : (product ? "Update Data" : "Simpan Produk")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
