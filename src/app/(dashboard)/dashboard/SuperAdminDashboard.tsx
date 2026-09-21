"use client"

import React, { useState, useTransition } from "react"
import { 
  Building2, 
  TrendingUp, 
  Receipt, 
  Store, 
  Users, 
  Search, 
  CreditCard, 
  Banknote, 
  ArrowUpRight, 
  Package,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Layers
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  MultiOutletDashboardData, 
  TimeRange, 
  getMultiOutletDashboardData 
} from "./superadmin-actions"

interface SuperAdminDashboardProps {
  initialData: MultiOutletDashboardData
}

export function SuperAdminDashboard({ initialData }: SuperAdminDashboardProps) {
  const [data, setData] = useState<MultiOutletDashboardData>(initialData)
  const [timeRange, setTimeRange] = useState<TimeRange>(initialData.timeRange)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"revenue_desc" | "revenue_asc" | "transactions_desc" | "name_asc">("revenue_desc")
  const [isPending, startTransition] = useTransition()

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
    startTransition(async () => {
      try {
        const updated = await getMultiOutletDashboardData(newRange)
        setData(updated)
      } catch (err) {
        console.error("Gagal memperbarui data dashboard:", err)
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Filter & Urutkan Outlet
  const filteredOutlets = data.outlets
    .filter((o) => {
      const q = searchQuery.toLowerCase()
      return (
        o.nama.toLowerCase().includes(q) ||
        (o.alamat && o.alamat.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === "revenue_desc") return b.totalRevenue - a.totalRevenue
      if (sortBy === "revenue_asc") return a.totalRevenue - b.totalRevenue
      if (sortBy === "transactions_desc") return b.totalTransactions - a.totalTransactions
      if (sortBy === "name_asc") return a.nama.localeCompare(b.nama)
      return 0
    })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e7eb] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#111827] text-white tracking-wide">
              <Sparkles size={12} className="text-amber-400" />
              OWNER / SUPERADMIN CONSOLE
            </span>
            <span className="text-xs text-[#6b7280] font-medium">• Multi-Outlet Performance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
            Dasbor Penjualan Per Outlet
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Monitoring performa pendapatan, total transaksi, dan status operasional seluruh cabang kasir.
          </p>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex items-center p-1 bg-[#f3f4f6] rounded-xl border border-[#e5e7eb] self-start md:self-auto">
          <button
            onClick={() => handleTimeRangeChange("today")}
            disabled={isPending}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all",
              timeRange === "today"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleTimeRangeChange("7d")}
            disabled={isPending}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all",
              timeRange === "7d"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            7 Hari
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            disabled={isPending}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all",
              timeRange === "month"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => handleTimeRangeChange("all")}
            disabled={isPending}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all",
              timeRange === "all"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            )}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <Card className="p-5 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#6b7280] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Gabungan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            {formatCurrency(data.overall.totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#6b7280]">
            <Building2 size={13} />
            <span>Dari {data.overall.totalOutlets} outlet terdaftar</span>
          </div>
        </Card>

        {/* Total Transaksi */}
        <Card className="p-5 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#6b7280] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            {data.overall.totalTransactions.toLocaleString("id-ID")}
            <span className="text-sm font-medium text-[#6b7280] ml-1.5">Trx</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#6b7280]">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Status pembayaran lunas</span>
          </div>
        </Card>

        {/* Rata-Rata Penjualan per Outlet */}
        <Card className="p-5 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#6b7280] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-Rata Omzet / Outlet</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store size={18} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            {formatCurrency(data.overall.averageRevenuePerOutlet)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#6b7280]">
            <span>Estimasi omzet per cabang</span>
          </div>
        </Card>

        {/* Outlet Performa Tertinggi */}
        <Card className="p-5 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#6b7280] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Outlet Tertinggi (Leader)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-lg font-bold text-[#111827] truncate">
            {data.overall.topPerformingOutlet ? data.overall.topPerformingOutlet.nama : "Belum Ada"}
          </div>
          <div className="mt-1 text-sm font-semibold text-emerald-600">
            {data.overall.topPerformingOutlet 
              ? formatCurrency(data.overall.topPerformingOutlet.revenue)
              : "Rp 0"}
          </div>
        </Card>
      </div>

      {/* Kontribusi Omzet Antar-Outlet Bar */}
      {data.overall.totalRevenue > 0 && (
        <Card className="p-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#111827]" />
              <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide">
                Porsi Kontribusi Pendapatan per Outlet
              </h2>
            </div>
            <span className="text-xs text-[#6b7280]">
              Total 100% ({formatCurrency(data.overall.totalRevenue)})
            </span>
          </div>

          <div className="h-4 w-full bg-[#f3f4f6] rounded-full overflow-hidden flex shadow-inner">
            {data.outlets
              .filter(o => o.totalRevenue > 0)
              .map((o, idx) => {
                const colors = [
                  "bg-[#111827]",
                  "bg-indigo-600",
                  "bg-emerald-600",
                  "bg-amber-500",
                  "bg-sky-500",
                  "bg-purple-600",
                  "bg-rose-500",
                ]
                const color = colors[idx % colors.length]
                return (
                  <div
                    key={o.id}
                    style={{ width: `${o.revenueSharePercentage}%` }}
                    className={cn(color, "h-full transition-all duration-500 relative group cursor-pointer")}
                    title={`${o.nama}: ${o.revenueSharePercentage}% (${formatCurrency(o.totalRevenue)})`}
                  />
                )
              })}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
            {data.outlets
              .filter(o => o.totalRevenue > 0)
              .slice(0, 5)
              .map((o, idx) => {
                const dotColors = [
                  "bg-[#111827]",
                  "bg-indigo-600",
                  "bg-emerald-600",
                  "bg-amber-500",
                  "bg-sky-500",
                ]
                return (
                  <div key={o.id} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-2.5 h-2.5 rounded-full", dotColors[idx % dotColors.length])} />
                    <span className="font-medium text-[#111827] truncate max-w-[150px]">{o.nama}</span>
                    <span className="font-bold text-[#6b7280]">{o.revenueSharePercentage}%</span>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Outlet Section Filter & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111827]">
              Daftar Rincian Outlet ({filteredOutlets.length})
            </h2>
            {isPending && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                Memperbarui data...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <Input
                placeholder="Cari nama atau alamat outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-[#e5e7eb] bg-white focus:border-[#111827]"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
              <SlidersHorizontal size={14} />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-3 text-xs font-semibold rounded-xl border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:border-[#111827]"
              >
                <option value="revenue_desc">Pendapatan Tertinggi</option>
                <option value="revenue_asc">Pendapatan Terendah</option>
                <option value="transactions_desc">Transaksi Terbanyak</option>
                <option value="name_asc">Nama Outlet (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Outlet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOutlets.map((outlet, rank) => {
            return (
              <Card
                key={outlet.id}
                className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md hover:border-[#111827]/30 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header Card Outlet */}
                <div className="p-5 border-b border-[#f3f4f6]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#f3f4f6] text-[#6b7280] text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{rank + 1}
                        </span>
                        <h3 className="font-bold text-sm text-[#111827] truncate">
                          {outlet.nama}
                        </h3>
                      </div>
                      <p className="text-xs text-[#6b7280] line-clamp-1">
                        {outlet.alamat || "Alamat belum diatur"}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border-none",
                        outlet.activeCashiersCount > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-[#6b7280]"
                      )}
                    >
                      {outlet.activeCashiersCount > 0
                        ? `${outlet.activeCashiersCount} Kas Aktif`
                        : "Sesi Kas Tutup"}
                    </Badge>
                  </div>
                </div>

                {/* Body Card Outlet: Metrik Keuangan */}
                <div className="p-5 space-y-4 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                      Pendapatan Outlet
                    </span>
                    <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                      {formatCurrency(outlet.totalRevenue)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#f3f4f6]">
                    <div>
                      <span className="text-[10px] font-semibold text-[#6b7280] uppercase">
                        Total Transaksi
                      </span>
                      <p className="text-base font-bold text-[#111827] mt-0.5">
                        {outlet.totalTransactions}{" "}
                        <span className="text-xs font-normal text-[#6b7280]">nota</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#6b7280] uppercase">
                        Rata-Rata / Nota (AOV)
                      </span>
                      <p className="text-base font-bold text-[#111827] mt-0.5">
                        {formatCurrency(outlet.averageOrderValue)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Breakdown (Tunai vs QRIS) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <Banknote size={13} className="text-emerald-600" />
                        Tunai: {formatCurrency(outlet.cashRevenue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} className="text-[#FFB800]" />
                        QRIS: {formatCurrency(outlet.qrisRevenue)}
                      </span>
                    </div>

                    {outlet.totalRevenue > 0 && (
                      <div className="h-2 w-full bg-[#f3f4f6] rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${(outlet.cashRevenue / outlet.totalRevenue) * 100}%`,
                          }}
                          className="bg-emerald-500 h-full"
                          title="Porsi Tunai"
                        />
                        <div
                          style={{
                            width: `${(outlet.qrisRevenue / outlet.totalRevenue) * 100}%`,
                          }}
                          className="bg-[#FFB800] h-full"
                          title="Porsi QRIS"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card: Info Operasional */}
                <div className="px-5 py-3 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={13} />
                      {outlet.totalStaffCount} Staf
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Package size={13} />
                      {outlet.totalProductsCount} Produk
                    </span>
                  </div>
                  <span className="font-bold text-[#111827]">
                    Kontribusi: {outlet.revenueSharePercentage}%
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredOutlets.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#e5e7eb] space-y-3">
            <Building2 size={36} className="mx-auto text-[#9ca3af]" />
            <h3 className="text-base font-bold text-[#111827]">Tidak Ada Outlet yang Cocok</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              Tidak ditemukan outlet dengan kata kunci pencarian "{searchQuery}". Silakan coba kata kunci lain.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
