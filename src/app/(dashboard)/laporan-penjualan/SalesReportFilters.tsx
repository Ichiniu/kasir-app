"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Filter } from "lucide-react"

type Outlet = { id: string; nama: string }
type Mode = "day" | "range" | "month"

export function SalesReportFilters({ outlets, outletId, mode, date, startDate, endDate, month }: {
  outlets: Outlet[]
  outletId: string
  mode: Mode
  date: string
  startDate: string
  endDate: string
  month: string
}) {
  const router = useRouter()
  const [selectedOutlet, setSelectedOutlet] = useState(outletId)
  const [selectedMode, setSelectedMode] = useState<Mode>(mode)
  const [selectedDate, setSelectedDate] = useState(date)
  const [selectedStart, setSelectedStart] = useState(startDate)
  const [selectedEnd, setSelectedEnd] = useState(endDate)
  const [selectedMonth, setSelectedMonth] = useState(month)

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams({ mode: selectedMode })
    if (selectedOutlet) params.set("outletId", selectedOutlet)
    if (selectedMode === "range") {
      params.set("startDate", selectedStart)
      params.set("endDate", selectedEnd)
    } else if (selectedMode === "month") {
      params.set("month", selectedMonth)
    } else {
      params.set("date", selectedDate)
    }
    router.push(`/laporan-penjualan?${params.toString()}`)
  }

  return <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.2fr_auto] lg:items-end">
    <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Outlet
      <select value={selectedOutlet} onChange={(event) => setSelectedOutlet(event.target.value)} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827]">
        <option value="">Semua outlet</option>
        {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.nama}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Periode
      <select value={selectedMode} onChange={(event) => setSelectedMode(event.target.value as Mode)} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827]">
        <option value="day">Tanggal tertentu</option>
        <option value="range">Rentang tanggal</option>
        <option value="month">Per bulan</option>
      </select>
    </label>
    {selectedMode === "range" ? <div className="grid grid-cols-2 gap-2">
      <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Dari<input type="date" required value={selectedStart} onChange={(event) => setSelectedStart(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[#e5e7eb] px-2 text-sm text-[#111827]" /></label>
      <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Sampai<input type="date" required min={selectedStart} value={selectedEnd} onChange={(event) => setSelectedEnd(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[#e5e7eb] px-2 text-sm text-[#111827]" /></label>
    </div> : selectedMode === "month" ? <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Bulan<input type="month" required value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="h-10 rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111827]" /></label>
      : <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Tanggal<input type="date" required value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-10 rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111827]" /></label>}
    <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white"><Filter size={15} />Tampilkan</button>
  </form>
}
