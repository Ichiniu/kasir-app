"use client"

import React, { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { format, addDays, subDays } from "date-fns"
import { id } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DatePickerInput } from "@/components/ui/date-picker"
import { 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  User, 
  Users, 
  Search, 
  ShoppingCart, 
  Eye, 
  Receipt
} from "lucide-react"
import { cn } from "@/lib/utils"

type Transaction = {
  id: string
  invoiceNumber: string
  customerName: string
  totalAmount: number
  discountAmount: number
  taxAmount: number
  finalAmount: number
  paymentMethod: string
  cashReceived: number | null
  changeAmount: number | null
  createdAt: string
  updatedAt: string
  userId: string
  cashRegisterId: string
  user: {
    name: string
    email: string
  }
  cashRegister: {
    id: string
    openingBalance: number
    closingBalance: number | null
    totalSales: number
    actualCash: number | null
    openedAt: string
    closedAt: string | null
    status: string
    openingNotes: string | null
    closingNotes: string | null
  } | null
  transactionItems: Array<{
    id: string
    transactionId: string
    productId: string
    productName: string
    quantity: number
    price: number
    subtotal: number
    createdAt: string
  }>
}

export function TransactionList({ 
  initialTransactions,
  currentDate = format(new Date(), "yyyy-MM-dd")
}: { 
  initialTransactions: Transaction[]
  currentDate?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [cashierFilter, setCashierFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  
  // Accordion state per sesi kasir (default semua terbuka)
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({})

  const activeDateObj = useMemo(() => {
    try {
      const [y, m, d] = currentDate.split("-").map(Number)
      return new Date(y, m - 1, d)
    } catch {
      return new Date()
    }
  }, [currentDate])

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date())
  }, [])

  const isToday = currentDate === todayStr

  const handlePrevDay = () => {
    const prev = subDays(activeDateObj, 1)
    router.push(`${pathname}?date=${format(prev, "yyyy-MM-dd")}`)
  }

  const handleToday = () => {
    router.push(pathname)
  }

  const handleNextDay = () => {
    const next = addDays(activeDateObj, 1)
    router.push(`${pathname}?date=${format(next, "yyyy-MM-dd")}`)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    router.push(`${pathname}?date=${format(selectedDate, "yyyy-MM-dd")}`)
  }

  const toggleSession = (sessionKey: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionKey]: prev[sessionKey] === undefined ? false : !prev[sessionKey]
    }))
  }

  // Truncate invoice: INV-20261019-7F02A...
  const formatShortInvoice = (inv: string) => {
    if (!inv) return ""
    if (inv.length > 20) {
      return `${inv.slice(0, 19)}...`
    }
    return inv
  }

  const cashiers = useMemo(() => {
    const uniqueCashiers = new Map()
    initialTransactions.forEach(t => {
      if (!uniqueCashiers.has(t.userId)) {
        uniqueCashiers.set(t.userId, {
          id: t.userId,
          name: t.user.name
        })
      }
    })
    return Array.from(uniqueCashiers.values())
  }, [initialTransactions])

  const filteredTransactions = useMemo(() => {
    let filtered = initialTransactions
    
    if (cashierFilter !== "all") {
      filtered = filtered.filter(t => t.userId === cashierFilter)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.invoiceNumber.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [initialTransactions, cashierFilter, searchQuery])

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(transaction => {
      const key = `${transaction.userId}-${transaction.cashRegisterId}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(transaction)
    })
    
    return Object.entries(groups).map(([key, transactions]) => {
      const totalAmount = transactions.reduce((acc, t) => acc + t.finalAmount, 0)
      return {
        key,
        cashierName: transactions[0].user.name,
        cashRegister: transactions[0].cashRegister,
        totalAmount,
        transactions: transactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    })
  }, [filteredTransactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Riwayat Penjualan</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {isToday 
                ? "Menampilkan transaksi penjualan hari ini berdasarkan sesi kasir." 
                : `Menampilkan transaksi penjualan tanggal ${format(activeDateObj, "dd MMMM yyyy", { locale: id })}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DatePickerInput
              date={activeDateObj}
              onDateChange={handleDateSelect}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10 px-4 rounded-lg border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#111827] transition-all cursor-pointer"
                >
                  <User size={16} className="text-[#6b7280] mr-2" />
                  <span className="text-sm font-medium">
                    {cashierFilter === "all" ? "Semua Kasir" : cashiers.find(c => c.id === cashierFilter)?.name}
                  </span>
                  <ChevronDown size={14} className="ml-2 text-[#6b7280]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-[#e5e7eb] shadow-xl">
                <DropdownMenuItem 
                  onClick={() => setCashierFilter("all")}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    cashierFilter === "all" && "bg-[#111827] text-white focus:bg-[#111827] focus:text-white"
                  )}
                >
                  <Users size={14} className="mr-2" />
                  Semua Kasir
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                {cashiers.map(c => (
                  <DropdownMenuItem 
                    key={c.id}
                    onClick={() => setCashierFilter(c.id)}
                    className={cn(
                      "text-sm font-medium cursor-pointer",
                      cashierFilter === c.id && "bg-[#111827] text-white focus:bg-[#111827] focus:text-white"
                    )}
                  >
                    <User size={14} className="mr-2" />
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          <Input
            placeholder="Cari invoice atau pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg bg-white border-[#e5e7eb] focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-sm font-medium transition-all"
          />
        </div>
      </div>

      <div className="space-y-6">
        {groupedTransactions.map((group) => {
          const isSessionOpen = expandedSessions[group.key] ?? true

          return (
            <div key={group.key} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-2xs">
              <div 
                onClick={() => toggleSession(group.key)}
                className="px-5 py-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex items-center justify-between cursor-pointer hover:bg-[#f3f4f6] transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center text-[#111827] shadow-2xs">
                    <User size={18} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827]">{group.cashierName}</h3>
                      <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter">Personel Kasir</p>
                    </div>
                    {group.cashRegister && (
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Tanggal</p>
                          <p className="text-xs font-semibold text-[#111827]">
                            {format(new Date(group.cashRegister.openedAt), "dd MMM yyyy", { locale: id })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Buka Kas</p>
                          <p className="text-xs font-semibold text-[#111827]">
                            {format(new Date(group.cashRegister.openedAt), "HH:mm", { locale: id })}
                          </p>
                        </div>
                        {group.cashRegister.closedAt && (
                          <div>
                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Tutup Kas</p>
                            <p className="text-xs font-semibold text-[#111827]">
                              {format(new Date(group.cashRegister.closedAt), "HH:mm", { locale: id })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-[11px] font-semibold text-[#111827]">
                      {group.transactions.length} Penjualan
                    </span>
                    <span className="text-[11px] text-[#6b7280]">
                      {formatCurrency(group.totalAmount)}
                    </span>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] font-bold py-0.5 px-2 border-none rounded uppercase",
                      group.cashRegister?.status === "ACTIVE" 
                        ? "bg-[#FFB800]/20 text-[#111827]" 
                        : "bg-gray-200/70 text-[#4b5563]"
                    )}
                  >
                    {group.cashRegister?.status === "ACTIVE" ? "Sesi Aktif" : "Sesi Selesai"}
                  </Badge>

                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[#6b7280] hover:text-[#111827]">
                    <ChevronDown 
                      size={16} 
                      className={cn("transition-transform duration-200", isSessionOpen && "rotate-180")} 
                    />
                  </div>
                </div>
              </div>

              {isSessionOpen && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-[#e5e7eb] bg-[#fdfdfd]">
                        <TableHead className="font-medium text-[#6b7280] h-10 text-[11px] uppercase tracking-wider px-5">Waktu</TableHead>
                        <TableHead className="font-medium text-[#6b7280] h-10 text-[11px] uppercase tracking-wider px-5">No. Invoice</TableHead>
                        <TableHead className="font-medium text-[#6b7280] h-10 text-[11px] uppercase tracking-wider px-5">Pelanggan</TableHead>
                        <TableHead className="font-medium text-[#6b7280] h-10 text-[11px] uppercase tracking-wider px-5">Metode</TableHead>
                        <TableHead className="font-medium text-[#6b7280] h-10 text-right text-[11px] uppercase tracking-wider px-5">Total Bayar</TableHead>
                        <TableHead className="font-medium text-[#6b7280] h-10 text-center text-[11px] uppercase tracking-wider px-5 w-[70px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.transactions.map((transaction) => (
                        <TableRow 
                          key={transaction.id} 
                          className="hover:bg-[#f9fafb]/60 border-b-[#e5e7eb] last:border-0 transition-colors"
                        >
                          <TableCell className="px-5 py-3.5 text-xs font-normal text-[#6b7280]">
                            {format(new Date(transaction.createdAt), "HH:mm", { locale: id })}
                          </TableCell>

                          <TableCell className="px-5 py-3.5">
                            <span 
                              className="text-xs font-normal text-[#4b5563] font-mono hover:text-[#111827] transition-colors"
                              title={transaction.invoiceNumber}
                            >
                              {formatShortInvoice(transaction.invoiceNumber)}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-3.5">
                            <span className="text-sm font-medium text-[#111827]">
                              {transaction.customerName || "Pelanggan Umum"}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-3.5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 border-none rounded uppercase",
                                transaction.paymentMethod === "CASH" 
                                  ? "bg-emerald-50 text-emerald-700" 
                                  : "bg-orange-50 text-orange-700"
                              )}
                            >
                              {transaction.paymentMethod}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-5 py-3.5 text-right">
                            <span className="text-sm font-semibold text-[#111827]">
                              {formatCurrency(transaction.finalAmount)}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(transaction)}
                              title="Lihat Detail Transaksi Lengkap"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#e5e7eb] bg-white hover:bg-[#111827] text-[#374151] hover:text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )
        })}

        {groupedTransactions.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-16 text-center shadow-2xs">
            <ShoppingCart size={40} className="text-[#e2e8f0] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[#111827]">
              {isToday 
                ? "Belum ada transaksi penjualan hari ini" 
                : `Tidak ada data transaksi pada tanggal ${format(activeDateObj, "dd MMMM yyyy", { locale: id })}`}
            </p>
            <p className="text-xs text-[#6b7280] mt-1">
              Gunakan pemilih tanggal di atas untuk melihat riwayat penjualan pada hari lainnya.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[480px] p-6 overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-xl">
          {selectedTransaction && (
            <div className="flex flex-col max-h-[85vh] overflow-y-auto pr-0.5">
              <div className="flex items-center gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 shadow-2xs">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#F59E0B]"
                  >
                    <path
                      d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V9.5C18.8954 9.5 18 10.3954 18 11.5C18 12.6046 18.8954 13.5 20 13.5V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V13.5C5.10457 13.5 6 12.6046 6 11.5C6 10.3954 5.10457 9.5 4 9.5V6Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 7.5V16.5M14 9.5C14 8.67157 13.1046 8 12 8C10.8954 8 10 8.67157 10 9.5C10 10.3284 10.8954 11 12 11C13.1046 11 14 11.6716 14 12.5C14 13.3284 13.1046 14 12 14C10.8954 14 10 13.3284 10 12.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold text-[#111827] tracking-tight">
                    Detail Transaksi
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#64748b] font-mono mt-1 tracking-wider break-all">
                    {selectedTransaction.invoiceNumber}
                  </DialogDescription>
                </div>
              </div>

              <div className="my-5 border-t border-[#f1f5f9]" />

              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="text-xs text-[#64748b] block mb-1">Waktu Transaksi</span>
                  <span className="text-sm font-medium text-[#111827]">
                    {format(new Date(selectedTransaction.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#64748b] block mb-1">Kasir</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#111827]">
                      {selectedTransaction.user?.name || "Kasir Utama"}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-md border tracking-wide",
                        selectedTransaction.paymentMethod === "CASH"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]"
                      )}
                    >
                      {selectedTransaction.paymentMethod}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[#64748b] block mb-1">Pelanggan</span>
                  <span className="text-sm font-medium text-[#111827]">
                    {selectedTransaction.customerName || "Pelanggan Umum"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#64748b] block mb-1">Status</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    Selesai
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-[#f1f5f9]" />

              <div>
                <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">
                  PRODUK DIBELI ({selectedTransaction.transactionItems.length})
                </h4>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-0.5">
                  {selectedTransaction.transactionItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{item.productName}</p>
                        <p className="text-xs text-[#64748b] mt-1">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#111827]">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                  {selectedTransaction.transactionItems.length === 0 && (
                    <div className="p-4 rounded-xl border border-[#e2e8f0] text-center text-xs text-[#9ca3af] italic">
                      Tidak ada rincian item
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0] space-y-3 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sm text-[#64748b]">Subtotal</span>
                  <span className="text-sm font-medium text-[#111827]">
                    {formatCurrency(selectedTransaction.totalAmount)}
                  </span>
                </div>

                {selectedTransaction.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-red-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(selectedTransaction.discountAmount)}</span>
                  </div>
                )}

                {selectedTransaction.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-[#64748b]">
                    <span>Pajak</span>
                    <span>+{formatCurrency(selectedTransaction.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-base text-[#111827]">Total Bayar</span>
                  <span className="font-bold text-base text-[#111827]">
                    {formatCurrency(selectedTransaction.finalAmount)}
                  </span>
                </div>

                {selectedTransaction.paymentMethod === "CASH" && selectedTransaction.cashReceived !== null && (
                  <div className="pt-2 border-t border-[#e2e8f0] space-y-1.5 text-xs text-[#64748b]">
                    <div className="flex justify-between">
                      <span>Uang Diterima</span>
                      <span className="font-medium text-[#111827]">
                        {formatCurrency(selectedTransaction.cashReceived)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(selectedTransaction.changeAmount || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="h-9 px-6 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
