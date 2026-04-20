"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Lock, AlertCircle, TrendingUp, Wallet, Banknote } from "lucide-react"
import { closeCashRegister } from "./actions"
import { useRouter } from "next/navigation"

interface TutupKasFormProps {
  activeRegister: {
    id: string
    openingBalance: number
    totalSales: number
  } | null
}

export function TutupKasForm({ activeRegister }: TutupKasFormProps) {
  const [actualCash, setActualCash] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const systemTotal = activeRegister ? activeRegister.openingBalance + activeRegister.totalSales : 0
  const actualCashNum = Number(actualCash.replace(/[^0-9]/g, ""))
  const difference = actualCashNum - systemTotal

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatRupiahInput = (value: string) => {
    const numberString = value.replace(/[^0-9]/g, "")
    if (!numberString) return ""
    return new Intl.NumberFormat("id-ID").format(Number(numberString))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actualCash) {
      setError("Masukkan jumlah uang tunai fisik di laci")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await closeCashRegister(actualCashNum, notes)
      if (res.success) {
        router.push("/buka-kas")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Gagal menutup kas")
    } finally {
      setLoading(false)
    }
  }

  if (!activeRegister) {
    return (
      <div className="flex items-center justify-center p-8 mt-12">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="w-16 h-16 bg-[#f9fafb] border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#9ca3af]">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">Tidak Ada Kas Terbuka</h2>
            <p className="text-sm text-[#6b7280] mt-1.5">Semua kas sudah ditutup atau belum ada kas yang dibuka untuk shift ini.</p>
          </div>
          <Button 
            onClick={() => router.push("/buka-kas")}
            className="w-full h-11 bg-[#111827] hover:bg-black text-white rounded-lg font-semibold transition-all active:scale-[0.98]"
          >
            Buka Kas Baru
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8 mt-4">
      <Card className="max-w-xl w-full p-8 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Tutup Kas / Akhiri Shift</h1>
          <p className="text-sm text-[#6b7280]">Rekapitulasi penjualan dan hitung saldo akhir fisik.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Modal Awal</p>
            <p className="text-lg font-bold text-[#111827]">{formatCurrency(activeRegister.openingBalance)}</p>
          </div>
          <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Total Penjualan</p>
            <p className="text-lg font-bold text-[#3b82f6]">+{formatCurrency(activeRegister.totalSales)}</p>
          </div>
        </div>

        <div className="p-6 bg-[#111827] rounded-xl text-center">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Saldo Akhir Seharusnya (Sistem)</span>
          <p className="text-3xl font-bold text-white mt-1">{formatCurrency(systemTotal)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Uang Fisik di Laci (Cash)</Label>
              {actualCashNum > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                  difference === 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {difference === 0 ? "Saldo Pas" : `Selisih: ${formatCurrency(difference)}`}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9ca3af]">Rp</span>
              <Input
                required
                type="text"
                value={actualCash}
                onChange={(e) => setActualCash(formatRupiahInput(e.target.value))}
                placeholder="0"
                className="pl-10 h-12 text-xl font-bold border-[#e5e7eb] bg-[#f9fafb] focus:bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 rounded-lg transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Catatan Tutup Kas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan alasan jika ada selisih saldo..."
              className="min-h-[80px] rounded-lg border-[#e5e7eb] bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 italic text-xs font-medium">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-11 border-[#e5e7eb] rounded-lg font-semibold text-[#6b7280] hover:bg-[#f9fafb]"
            >
              BATAL
            </Button>
            <Button 
              disabled={loading}
              className="flex-[2] h-11 bg-[#ef4444] hover:bg-black text-white font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              {loading ? "MEMPROSES..." : "TUTUP KAS & SELESAIKAN"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
