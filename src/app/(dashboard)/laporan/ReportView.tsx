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
  ChevronRight,
  Download,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DatePicker } from "@/components/ui/date-picker"

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

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    const params = new URLSearchParams(searchParams.toString())
    const dateStr = format(date, type === "monthly" ? "yyyy-MM" : "yyyy-MM-dd")
    params.set("date", dateStr)
    params.delete("startDate")
    params.delete("endDate")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleRangeChange = (key: "startDate" | "endDate", date: Date | undefined) => {
    if (!date) return
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, format(date, "yyyy-MM-dd"))
    params.delete("date")
    router.push(`${pathname}?${params.toString()}`)
  }

  // Determine initial values based on data.period.start/end
  const currentDate = React.useMemo(() => {
    if (!data?.period?.start) return new Date()
    return new Date(data.period.start)
  }, [data?.period?.start])

  const startDate = React.useMemo(() => {
    const dateStr = searchParams.get("startDate") || (data?.period?.start ? format(new Date(data.period.start), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
    return parseISO(dateStr)
  }, [searchParams, data?.period?.start])

  const endDate = React.useMemo(() => {
    const dateStr = searchParams.get("endDate") || (data?.period?.end ? format(new Date(data.period.end), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
    return parseISO(dateStr)
  }, [searchParams, data?.period?.end])

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
    
    // Period
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: ${data?.period?.label}`, 14, 28)
    
    // Summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan', 14, 40)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Pendapatan: ${formatCurrency(data?.summary?.totalRevenue || 0)}`, 14, 48)
    doc.text(`Total Transaksi: ${data?.summary?.totalTransactions || 0}`, 14, 55)
    doc.text(`Produk Terjual: ${data?.summary?.totalItemsSold || 0} pcs`, 14, 62)
    
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

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">{title}</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Periode: <span className="font-medium text-[#111827]">{data?.period?.label}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {type === "weekly" ? (
            <div className="flex items-center gap-2">
              <DatePicker
                date={startDate}
                onDateChange={(date) => handleRangeChange("startDate", date)}
                placeholder="Dari tanggal"
                className="h-10 border-[#e5e7eb]"
              />
              <span className="text-[#6b7280]">-</span>
              <DatePicker
                date={endDate}
                onDateChange={(date) => handleRangeChange("endDate", date)}
                placeholder="Sampai tanggal"
                className="h-10 border-[#e5e7eb]"
              />
            </div>
          ) : (
            <DatePicker
              date={currentDate}
              onDateChange={handleDateChange}
              placeholder={type === "monthly" ? "Pilih bulan" : "Pilih tanggal"}
              className="h-10 w-[200px] border-[#e5e7eb]"
            />
          )}
          
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            className="h-10 px-4 rounded-lg border-[#e5e7eb] hover:bg-[#f3f4f6] text-[#111827] font-medium transition-colors"
          >
            <Download size={16} className="mr-2" />
            PDF
          </Button>
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
                    <stop offset="5%" stopColor="#5E54F7" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#5E54F7" stopOpacity={0}/>
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
                  stroke="#5E54F7" 
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
                        <span className="font-semibold text-[#111827] text-sm">{t.invoiceNumber}</span>
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
      <Card className="rounded-xl border-none bg-[#5E54F7] text-white p-8 shadow-xl shadow-[#5E54F7]/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
           <div className="lg:col-span-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live from Database</span>
             </div>
             
             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/20">
               <CreditCard size={24} className="text-white" />
             </div>
             <h2 className="text-2xl font-semibold mb-3">Mekanisme Pembayaran</h2>
             <p className="text-white/70 text-sm leading-relaxed">Analisis metode pembayaran pelanggan untuk optimasi channel transaksi.</p>
           </div>
           
           <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.paymentMethods && Object.entries(data.paymentMethods).map(([method, amount]: [string, any]) => (
                <div key={method} className="bg-white/10 rounded-xl p-6 border border-white/10 transition-colors hover:bg-white/20 backdrop-blur-sm">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{method}</span>
                   </div>
                   <h4 className="text-xl font-semibold mb-1">{formatCurrency(amount)}</h4>
                   <p className="text-[10px] text-white/70 mb-4">{((amount / (data?.summary?.totalRevenue || 1)) * 100).toFixed(1)}% dari total</p>
                   <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(amount / (data?.summary?.totalRevenue || 1)) * 100}%` }}></div>
                   </div>
                </div>
              ))}
              {(!data?.paymentMethods || Object.keys(data.paymentMethods).length === 0) && (
                <div className="col-span-full py-16 text-center text-white/50 text-sm italic border border-dashed border-white/20 rounded-xl">
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
