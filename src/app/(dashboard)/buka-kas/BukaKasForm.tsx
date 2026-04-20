"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react"
import { openCashRegister } from "./actions"
import { useRouter } from "next/navigation"

export function BukaKasForm({ hasActive }: { hasActive: boolean }) {
  const [openingBalance, setOpeningBalance] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const formatRupiahInput = (value: string) => {
    const numberString = value.replace(/[^0-9]/g, "")
    if (!numberString) return ""
    return new Intl.NumberFormat("id-ID").format(Number(numberString))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const balanceNum = Number(openingBalance.replace(/[^0-9]/g, ""))
    
    if (balanceNum < 0) {
      setError("Modal awal tidak boleh kurang dari 0")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await openCashRegister(balanceNum, notes)
      if (res.success) {
        router.push("/kasir")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Gagal membuka kas")
    } finally {
      setLoading(false)
    }
  }

  if (hasActive) {
    return (
      <div className="flex items-center justify-center p-8 mt-12">
        <Card className="max-w-md w-full p-8 flex flex-col items-center text-center gap-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="w-16 h-16 bg-[#f9fafb] border border-[#e5e7eb] rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">Kas Masih Terbuka</h2>
            <p className="text-sm text-[#6b7280] mt-1.5">Anda sudah melakukan buka kas. Silakan lanjut ke menu Kasir untuk berjualan.</p>
          </div>
          <Button 
            onClick={() => router.push("/kasir")}
            className="w-full h-11 bg-[#5E54F7] hover:bg-[#4b43c6] text-white rounded-lg font-semibold transition-all shadow-lg shadow-[#5E54F7]/20 active:scale-[0.98]"
          >
            Buka Menu Kasir
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8 mt-4">
      <Card className="max-w-md w-full p-8 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Buka Kas Baru</h1>
          <p className="text-sm text-[#6b7280] mt-1">Masukkan modal awal uang di laci kasir.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Modal Awal (Tunai)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9ca3af]">Rp</span>
              <Input
                required
                type="text"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(formatRupiahInput(e.target.value))}
                placeholder="0"
                className="pl-10 h-12 text-xl font-bold border-[#e5e7eb] bg-[#f9fafb] focus:bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 rounded-lg transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Catatan Opsional</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="min-h-[80px] rounded-lg border-[#e5e7eb] bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 italic text-xs font-medium">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          <Button 
            disabled={loading}
            className="w-full h-11 bg-[#5E54F7] hover:bg-[#4b43c6] text-white font-semibold rounded-lg shadow-lg shadow-[#5E54F7]/20 transition-all active:scale-[0.98]"
          >
            {loading ? "MEMPROSES..." : "BUKA KAS SEKARANG"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
