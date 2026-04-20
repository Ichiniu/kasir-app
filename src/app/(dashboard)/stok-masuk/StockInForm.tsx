"use client"

import React, { useState, useEffect } from "react"
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
import { createStockIn } from "./actions"

interface StockInFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
}

export function StockInForm({ open, onOpenChange, products }: StockInFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [cost, setCost] = useState("0")
  const [price, setPrice] = useState("0")

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      if (product) {
        setCost(String(Number(product.cost)))
        setPrice(String(Number(product.price)))
      }
    }
  }, [selectedProductId, products])

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
    const data = {
      productId: selectedProductId,
      quantity: formData.get("quantity"),
      cost: cost,
      price: price,
      notes: formData.get("notes"),
    }
    
    try {
      await createStockIn(data)
      onOpenChange(false)
      setSelectedProductId("")
      setCost("0")
      setPrice("0")
    } catch (error) {
      console.error("Failed to save stock in:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border border-[#e5e7eb] shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[95vh] gap-0">
        <div className="p-5 border-b border-[#e5e7eb] bg-[#f9fafb] shrink-0">
          <DialogTitle className="text-lg font-bold text-[#111827] tracking-tight">
            Input Stok Masuk
          </DialogTitle>
          <p className="text-[11px] font-medium text-[#6b7280] mt-0.5">Catat penambahan stok barang ke dalam gudang.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1 relative">
            <Label htmlFor="productId" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Pilih Produk</Label>
            <Select onValueChange={setSelectedProductId} value={selectedProductId}>
              <SelectTrigger className="h-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-semibold transition-all">
                <SelectValue placeholder="Cari nama atau SKU produk..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#e5e7eb] bg-white">
                {products.filter(p => p.isActive).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} <span className="text-[#9ca3af] ml-1">({p.sku})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-[#f3f4f6]">
            <div className="space-y-1">
              <Label htmlFor="quantity" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Kuantitas Masuk</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="0"
                required
                className="h-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-bold transition-all"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Satuan Unit</Label>
              <Input
                disabled
                value={products.find(p => p.id === selectedProductId)?.unit || "-"}
                className="h-10 rounded-lg border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af] text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cost" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Harga Beli Baru (Modal)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[10px] font-bold">Rp</span>
                <Input
                  id="cost"
                  type="text"
                  value={formatRupiah(cost)}
                  onChange={handleCurrencyChange(setCost)}
                  placeholder="0"
                  required
                  className="h-10 rounded-lg border-[#e5e7eb] pl-8 bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-bold text-[#111827] transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Harga Jual Baru</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3b82f6] text-[10px] font-bold">Rp</span>
                <Input
                  id="price"
                  type="text"
                  value={formatRupiah(price)}
                  onChange={handleCurrencyChange(setPrice)}
                  placeholder="0"
                  required
                  className="h-10 rounded-lg border-[#e5e7eb] pl-8 bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-xs font-bold text-[#3b82f6] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Berikan keterangan (opasinal)..."
              className="rounded-lg border-[#e5e7eb] bg-white min-h-[60px] text-xs font-medium transition-all focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827]"
            />
          </div>

          <div className="pt-2 flex items-center gap-2 border-t border-[#f3f4f6]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-lg border-[#e5e7eb] hover:bg-[#f9fafb] text-[10px] font-bold uppercase transition-all"
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedProductId}
              className="flex-[1.5] h-10 rounded-lg bg-[#111827] hover:bg-black text-white text-[10px] font-bold uppercase transition-all shadow-sm active:scale-[0.98]"
            >
              {loading ? "Menyimpan..." : "Posting Stok Masuk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
