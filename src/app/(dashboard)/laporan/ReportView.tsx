"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  ArrowUpRight, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange, DatePickerInput } from "@/components/ui/date-picker"
import { 
  format, 
  parseISO, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  isValid, 
  startOfWeek, 
  endOfWeek 
} from "date-fns"
import { id } from "date-fns/locale"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ReportViewProps {
  title: string
  data: any
  type: "daily" | "weekly" | "monthly"
}

export function ReportView({ title, data, type }: ReportViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- DAILY REPORT CONTROLS ---
  const activeDailyDateStr = React.useMemo(() => {
    return data?.period?.startDate || searchParams.get("date") || format(new Date(), "yyyy-MM-dd")
  }, [data?.period?.startDate, searchParams])

  const activeDailyDateObj = React.useMemo(() => {
    try {
      const d = parseISO(activeDailyDateStr)
      return isValid(d) ? d : new Date()
    } catch {
      return new Date()
    }
  }, [activeDailyDateStr])

  const isDailyToday = React.useMemo(() => {
    return activeDailyDateStr === format(new Date(), "yyyy-MM-dd")
  }, [activeDailyDateStr])

  const handlePrevDay = () => {
    const prev = subDays(activeDailyDateObj, 1)
    router.push(`${pathname}?date=${format(prev, "yyyy-MM-dd")}`)
  }

  const handleToday = () => {
    router.push(pathname)
  }

  const handleNextDay = () => {
    const next = addDays(activeDailyDateObj, 1)
    router.push(`${pathname}?date=${format(next, "yyyy-MM-dd")}`)
  }

  const handleDailySelect = (val: string) => {
    if (!val) return
    router.push(`${pathname}?date=${val}`)
  }

  // --- WEEKLY REPORT CONTROLS ---
  const currentStartStr = React.useMemo(() => {
    return data?.period?.startDate || searchParams.get("startDate") || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  }, [data?.period?.startDate, searchParams])

  const currentEndStr = React.useMemo(() => {
    return data?.period?.endDate || searchParams.get("endDate") || format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  }, [data?.period?.endDate, searchParams])

  const [rangeStartInput, setRangeStartInput] = React.useState(currentStartStr)
  const [rangeEndInput, setRangeEndInput] = React.useState(currentEndStr)

  React.useEffect(() => {
    if (data?.period?.startDate) setRangeStartInput(data.period.startDate)
    if (data?.period?.endDate) setRangeEndInput(data.period.endDate)
  }, [data?.period?.startDate, data?.period?.endDate])

  const isWeeklyCurrentWeek = React.useMemo(() => {
    const now = new Date()
    const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
    const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
    return currentStartStr === thisWeekStart && currentEndStr === thisWeekEnd
  }, [currentStartStr, currentEndStr])

  const handlePrevWeek = () => {
    try {
      const s = parseISO(currentStartStr)
      const newStart = subWeeks(s, 1)
      const newEnd = addDays(newStart, 6)
      router.push(`${pathname}?startDate=${format(newStart, "yyyy-MM-dd")}&endDate=${format(newEnd, "yyyy-MM-dd")}`)
    } catch {
      router.push(pathname)
    }
  }

  const handleThisWeek = () => {
    router.push(pathname)
  }

  const handleNextWeek = () => {
    try {
      const s = parseISO(currentStartStr)
      const newStart = addWeeks(s, 1)
      const newEnd = addDays(newStart, 6)
      router.push(`${pathname}?startDate=${format(newStart, "yyyy-MM-dd")}&endDate=${format(newEnd, "yyyy-MM-dd")}`)
    } catch {
      router.push(pathname)
    }
  }

  const handleApplyWeeklyRange = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!rangeStartInput || !rangeEndInput) return
    router.push(`${pathname}?startDate=${rangeStartInput}&endDate=${rangeEndInput}`)
  }

  // --- MONTHLY REPORT CONTROLS ---
  const currentMonthStr = React.useMemo(() => {
    return data?.period?.monthStr || searchParams.get("date") || format(new Date(), "yyyy-MM")
  }, [data?.period?.monthStr, searchParams])

  const currentMonthDate = React.useMemo(() => {
    try {
      const d = parseISO(`${currentMonthStr}-01`)
      return isValid(d) ? d : new Date()
    } catch {
      return new Date()
    }
  }, [currentMonthStr])

  const isMonthlyCurrentMonth = React.useMemo(() => {
    return currentMonthStr === format(new Date(), "yyyy-MM")
  }, [currentMonthStr])

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonthDate, 1)
    router.push(`${pathname}?date=${format(prev, "yyyy-MM")}`)
  }

  const handleThisMonth = () => {
    router.push(pathname)
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonthDate, 1)
    router.push(`${pathname}?date=${format(next, "yyyy-MM")}`)
  }

  const currentYear = currentMonthDate.getFullYear()
  const currentMonthIdx = currentMonthDate.getMonth()

  const monthsList = [
    { label: "Januari", value: "01" },
    { label: "Februari", value: "02" },
    { label: "Maret", value: "03" },
    { label: "April", value: "04" },
    { label: "Mei", value: "05" },
    { label: "Juni", value: "06" },
    { label: "Juli", value: "07" },
    { label: "Agustus", value: "08" },
    { label: "September", value: "09" },
    { label: "Oktober", value: "10" },
    { label: "November", value: "11" },
    { label: "Desember", value: "12" },
  ]

  const yearsList = React.useMemo(() => {
    const thisYear = new Date().getFullYear()
    return [thisYear - 3, thisYear - 2, thisYear - 1, thisYear, thisYear + 1]
  }, [])

  const handleSelectMonth = (monthVal: string) => {
    router.push(`${pathname}?date=${currentYear}-${monthVal}`)
  }

  const handleSelectYear = (yearVal: string) => {
    const mStr = String(currentMonthIdx + 1).padStart(2, "0")
    router.push(`${pathname}?date=${yearVal}-${mStr}`)
  }

  const handleOutletFilter = (outletId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (outletId) {
      params.set("outletId", outletId)
    } else {
      params.delete("outletId")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, 20)
    
    // Period & Outlet
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode : ${data?.period?.label}`, 14, 28)
    doc.text(`Cabang  : ${data?.currentOutletName || 'Semua Cabang'}`, 14, 34)
    
    // Summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan', 14, 44)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Pendapatan: ${formatCurrency(data?.summary?.totalRevenue || 0)}`, 14, 52)
    doc.text(`Total Transaksi: ${data?.summary?.totalTransactions || 0}`, 14, 59)
    doc.text(`Produk Terjual: ${data?.summary?.totalItemsSold || 0} pcs`, 14, 66)
    
    // Transactions Table
    if (transactions.length > 0) {
      autoTable(doc, {
        startY: 75,
        head: [['No', 'Invoice', 'Tanggal', 'Kasir', 'Total', 'Metode']],
        body: transactions.map((t: any, i: number) => [
          i + 1,
          t.invoiceNumber,
          format(new Date(t.createdAt), 'dd MMM yyyy HH:mm', { locale: id }),
          t.user?.name || '-',
          formatCurrency(t.finalAmount),
          t.paymentMethod
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })
    }
    
    // Save
    doc.save(`${title.replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const transactions = data?.transactions || [];
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data?.period?.start, data?.period?.end, data?.currentOutletId]);

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6b7280] mt-1">
            <span>Periode: <strong className="font-semibold text-[#111827]">{data?.period?.label}</strong></span>
            <span className="text-[#d1d5db]">•</span>
            <span>Cabang: <strong className="font-semibold text-[#111827]">{data?.currentOutletName || "Cabang Utama"}</strong></span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data?.isSuperAdmin && data?.outlets && data.outlets.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#f9fafb] px-2.5 py-1 rounded-xl border border-[#e5e7eb] shadow-2xs">
              <Store size={14} className="text-[#6b7280]" />
              <select
                value={searchParams.get("outletId") || ""}
                onChange={(e) => handleOutletFilter(e.target.value)}
                className="h-8 border-none bg-transparent text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer"
              >
                <option value="">Semua Cabang (Konsolidasi)</option>
                {data.outlets.map((outlet: any) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "daily" && (
            <div className="flex items-center gap-2 bg-[#f9fafb] p-1 rounded-xl border border-[#e5e7eb] shadow-2xs">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  title="Hari Sebelumnya"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isDailyToday
                      ? "bg-[#FFB800] text-black shadow-2xs"
                      : "hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb]"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  title="Hari Berikutnya"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-5 w-px bg-[#e5e7eb]" />

              <DatePickerInput
                date={activeDailyDateObj}
                onDateChange={(selectedDate) => {
                  if (selectedDate && isValid(selectedDate)) {
                    router.push(`${pathname}?date=${format(selectedDate, "yyyy-MM-dd")}`)
                  }
                }}
              />
            </div>
          )}

          {type === "weekly" && (
            <div className="flex flex-wrap items-center gap-2 bg-[#f9fafb] p-1 rounded-xl border border-[#e5e7eb] shadow-2xs">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  title="Minggu Lalu"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleThisWeek}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isWeeklyCurrentWeek
                      ? "bg-[#FFB800] text-black shadow-2xs"
                      : "hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb]"
                  }`}
                >
                  Minggu Ini
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  title="Minggu Depan"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-5 w-px bg-[#e5e7eb] hidden sm:block" />

              <DatePickerWithRange
                date={{
                  from: parseISO(currentStartStr),
                  to: parseISO(currentEndStr),
                }}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    router.push(`${pathname}?startDate=${format(range.from, "yyyy-MM-dd")}&endDate=${format(range.to, "yyyy-MM-dd")}`)
                  } else if (range?.from) {
                    router.push(`${pathname}?startDate=${format(range.from, "yyyy-MM-dd")}`)
                  }
                }}
              />
            </div>
          )}

          {type === "monthly" && (
            <div className="flex flex-wrap items-center gap-2 bg-[#f9fafb] p-1 rounded-xl border border-[#e5e7eb] shadow-2xs">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Bulan Lalu"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleThisMonth}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isMonthlyCurrentMonth
                      ? "bg-[#FFB800] text-black shadow-2xs"
                      : "hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb]"
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Bulan Berikutnya"
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white text-[#374151] hover:text-[#111827] border border-transparent hover:border-[#e5e7eb] hover:shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-5 w-px bg-[#e5e7eb]" />

              <div className="flex items-center gap-1.5">
                <select
                  value={String(currentMonthIdx + 1).padStart(2, "0")}
                  onChange={(e) => handleSelectMonth(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-[#e5e7eb] bg-white text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FFB800] cursor-pointer hover:border-[#d1d5db]"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => handleSelectYear(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-[#e5e7eb] bg-white text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FFB800] cursor-pointer hover:border-[#d1d5db]"
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleExportPDF}
            className="h-10 px-4 rounded-lg border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] text-[#374151] text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download size={16} />
            Unduh PDF
          </button>
        </div>
      </div>

      {/* Summary Cards - Minimalist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl border-[#e5e7eb] bg-[#f9fafb] shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#e5e7eb] text-[#111827]">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Total Pendapatan</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#111827] tracking-tight">
            {formatCurrency(data?.summary?.totalRevenue || 0)}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#166534] bg-[#f0fdf4] w-fit px-2.5 py-1 rounded-full border border-[#dcfce7]">
            <CheckCircle2 className="w-3 h-3" />
            Target Tercapai
          </div>
        </Card>

        <Card className="p-6 rounded-xl border-[#e5e7eb] bg-white shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#f9fafb] rounded-lg flex items-center justify-center border border-[#e5e7eb] text-[#111827]">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Total Transaksi</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#111827] tracking-tight">
            {data?.summary?.totalTransactions || 0}
          </h3>
          <p className="mt-4 text-xs font-medium text-[#6b7280]">
            Rata-rata {formatCurrency(data?.summary?.totalTransactions > 0 ? (data.summary.totalRevenue / data.summary.totalTransactions) : 0)} / trx
          </p>
        </Card>

        <Card className="p-6 rounded-xl border-[#e5e7eb] bg-white shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#f9fafb] rounded-lg flex items-center justify-center border border-[#e5e7eb] text-[#111827]">
              <Package size={20} />
            </div>
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Produk Terjual</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#111827] tracking-tight">
            {data?.summary?.totalItemsSold || 0} <span className="text-sm font-medium text-[#6b7280]">pcs</span>
          </h3>
          <div className="mt-4 flex gap-1.5">
             {data?.bestSellers?.slice(0, 3).map((s: any, i: number) => (
                <div key={i} className="flex-1 h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFC700]" style={{ width: `${(s.qty / (data?.summary?.totalItemsSold || 1)) * 100}%` }}></div>
                </div>
             ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart - Minimalist */}
        <Card className="lg:col-span-2 rounded-xl border-[#e5e7eb] bg-white p-6 shadow-none">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#111827]">Tren Penjualan</h2>
            <p className="text-xs text-[#6b7280] mt-1">
              Visualisasi tren pendapatan periode ini
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trendData || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                  formatter={(value: any) => [formatCurrency(value), "Pendapatan"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FFB800" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Products - Minimalist */}
        <Card className="rounded-xl border-[#e5e7eb] bg-white p-6 shadow-none">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-semibold text-[#111827]">Top Products</h2>
             <Badge variant="outline" className="bg-[#f9fafb] text-[#111827] border-[#e5e7eb] px-2.5 font-medium">Top 5</Badge>
          </div>
          
          <div className="space-y-6">
            {data?.bestSellers?.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#f9fafb] flex items-center justify-center font-semibold text-[#111827] text-xs border border-[#e5e7eb]">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-medium text-[#111827] text-xs truncate max-w-[140px]">{item.name}</span>
                    <span className="font-semibold text-[#111827] text-xs">{item.qty} pcs</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FFC700] rounded-full shadow-sm" 
                      style={{ width: `${(item.qty / (data.bestSellers[0]?.qty || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.bestSellers || data.bestSellers.length === 0) && (
              <div className="py-12 text-center text-[#9ca3af] text-sm italic">Data Kosong</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logistics Table - Minimalist */}
        <Card className="lg:col-span-2 rounded-xl border-[#e5e7eb] bg-white overflow-hidden shadow-none">
          <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#f9fafb]">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Log Penjualan</h2>
              <p className="text-xs text-[#6b7280] mt-0.5">Transaksi periode ini</p>
            </div>
            <div className="flex items-center gap-2">
               <Button 
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-md border-[#e5e7eb] bg-white"
               >
                 <ChevronRight size={14} className="rotate-180" />
               </Button>
               <span className="text-[11px] font-medium text-[#111827] min-w-[50px] text-center">
                 {currentPage} / {totalPages || 1}
               </span>
               <Button 
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-md border-[#e5e7eb] bg-white"
               >
                 <ChevronRight size={14} />
               </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white border-b border-[#e5e7eb]">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {currentTransactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[#111827] text-sm">{t.invoiceNumber}</span>
                          {data?.isSuperAdmin && t.outletName && t.outletName !== "-" && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-medium">
                              {t.outletName}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6b7280]">{format(new Date(t.createdAt), "dd MMM, HH:mm", { locale: id })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#475569]">{t.customerName || "UMUM"}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#111827] text-sm">
                      {formatCurrency(t.finalAmount)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                   <tr>
                      <td colSpan={3} className="py-20 text-center text-[#9ca3af] text-sm italic">
                        Belum ada transaksi
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Customers - Minimalist */}
        <Card className="rounded-xl border-[#e5e7eb] bg-white p-6 shadow-none">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-semibold text-[#111827]">Pelanggan Terbaik</h2>
             <Badge variant="outline" className="bg-[#f0fdf4] text-[#166534] border-[#dcfce7] px-2.5 font-medium">Loyalty</Badge>
          </div>
          <div className="space-y-5">
            {data?.topCustomers?.map((customer: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-[#f9fafb] flex items-center justify-center text-[#111827] font-semibold text-xs border border-[#e5e7eb] flex-shrink-0">
                    {index + 1}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                       <h4 className="font-medium text-sm text-[#111827] truncate">{customer.name}</h4>
                       <span className="text-[10px] font-semibold text-[#6b7280]">{customer.transactions} trx</span>
                    </div>
                    <p className="font-semibold text-xs text-[#111827]">{formatCurrency(customer.total)}</p>
                 </div>
              </div>
            ))}
            {(!data?.topCustomers || data.topCustomers.length === 0) && (
              <div className="py-12 text-center text-[#9ca3af] text-sm italic">Data Kosong</div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Mechanism - Minimalist */}
      <Card className="rounded-xl border-none bg-[#FFB800] text-slate-950 p-8 shadow-xl shadow-[#FFB800]/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
           <div className="lg:col-span-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-950">Live from Database</span>
             </div>
             
             <div className="w-12 h-12 bg-black/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-black/10">
               <CreditCard size={24} className="text-slate-950" />
             </div>
             <h2 className="text-2xl font-semibold mb-3 text-slate-950">Mekanisme Pembayaran</h2>
             <p className="text-slate-800 text-sm leading-relaxed">Analisis metode pembayaran pelanggan untuk optimasi channel transaksi.</p>
           </div>
           
           <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.paymentMethods && Object.entries(data.paymentMethods).map(([method, amount]: [string, any]) => (
                <div key={method} className="bg-black/10 rounded-xl p-6 border border-black/10 transition-colors hover:bg-black/20 backdrop-blur-sm">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{method}</span>
                   </div>
                   <h4 className="text-xl font-semibold mb-1 text-slate-950">{formatCurrency(amount)}</h4>
                   <p className="text-[10px] text-slate-700 mb-4">{((amount / (data?.summary?.totalRevenue || 1)) * 100).toFixed(1)}% dari total</p>
                   <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-950/60 shadow-none" style={{ width: `${(amount / (data?.summary?.totalRevenue || 1)) * 100}%` }}></div>
                   </div>
                </div>
              ))}
              {(!data?.paymentMethods || Object.keys(data.paymentMethods).length === 0) && (
                <div className="col-span-full py-16 text-center text-slate-500 text-sm italic border border-dashed border-black/20 rounded-xl">
                  Belum ada data pembayaran
                </div>
              )}
           </div>
        </div>
      </Card>

      <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] italic text-[10px] text-[#6b7280] leading-relaxed">
        * Laporan ini dihasilkan secara otomatis oleh sistem analitik pusat berbasis data real-time transaksi kasir untuk periode <span className="font-semibold text-[#111827]">{data?.period?.label}</span>.
      </div>
    </div>
  )
}
