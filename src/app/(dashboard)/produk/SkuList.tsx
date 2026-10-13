"use client"

import { useState } from "react"
import { Barcode, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProductSku, deleteProductSku } from "./sku-actions"

type SkuItem = { id: string; code: string; productCount: number; product?: { id: string } | null }

export function SkuList({ skus }: { skus: SkuItem[] }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const addSku = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      await createProductSku(code)
      setCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat SKU")
    } finally {
      setLoading(false)
    }
  }

  const removeSku = async (sku: SkuItem) => {
    if (!confirm(`Hapus SKU ${sku.code}?`)) return
    setError("")
    try {
      await deleteProductSku(sku.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus SKU")
    }
  }

  return (
    <div className="space-y-5 font-sans">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Master SKU</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Buat kode SKU di sini, lalu pilih kode tersebut saat mendaftarkan produk.</p>
      </header>
      <form onSubmit={addSku} className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:flex-row">
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Contoh: BRG-001" maxLength={100} required className="h-10" />
        <Button type="submit" disabled={loading} className="h-10 shrink-0 bg-[#FFB800] font-semibold text-slate-950 hover:bg-[#e6a600]"><Plus size={16} className="mr-2" />{loading ? "Menyimpan..." : "Tambah SKU"}</Button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        {skus.length ? skus.map((sku) => (
          <div key={sku.id} className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3 last:border-0">
            <div className="flex items-center gap-3"><Barcode size={18} className="text-[#9ca3af]" /><code className="text-sm font-semibold text-[#111827]">{sku.code}</code><span className="text-xs text-[#6b7280]">{sku.productCount ? "Sudah dipakai" : "Belum dipakai"}</span></div>
            <Button variant="ghost" size="icon" disabled={sku.productCount > 0} onClick={() => removeSku(sku)} aria-label={`Hapus SKU ${sku.code}`} className="text-[#6b7280] hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></Button>
          </div>
        )) : <div className="p-10 text-center text-sm text-[#6b7280]">Belum ada SKU.</div>}
      </div>
    </div>
  )
}
