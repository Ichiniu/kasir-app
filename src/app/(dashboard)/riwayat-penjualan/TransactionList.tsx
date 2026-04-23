"use client"

import React, { useState, useMemo } from "react"
import { format } from "date-fns"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronDown, User, Users, Search, ShoppingCart } from "lucide-react"
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

export function TransactionList({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [cashierFilter, setCashierFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Get unique cashiers
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

  // Filter transactions by cashier and search
  const filteredTransactions = useMemo(() => {
    let filtered = initialTransactions
    
    // Filter by cashier
    if (cashierFilter !== "all") {
      filtered = filtered.filter(t => t.userId === cashierFilter)
    }
    
    // Filter by search query (invoice or customer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.invoiceNumber.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [initialTransactions, cashierFilter, searchQuery])

  // Group by cashier and session
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(transaction => {
      const key = `${transaction.userId}-${transaction.cashRegisterId}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(transaction)
    })
    
    return Object.entries(groups).map(([key, transactions]) => ({
      key,
      cashierName: transactions[0].user.name,
      cashRegister: transactions[0].cashRegister,
      transactions: transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }))
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Riwayat Penjualan</h1>
            <p className="text-sm text-[#6b7280] mt-1">Lihat semua transaksi penjualan berdasarkan sesi kasir.</p>
          </div>

          {/* Cashier Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="h-10 px-4 rounded-lg border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#111827] transition-all"
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

        {/* Search Input */}
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

      {/* Transactions by Session */}
      <div className="space-y-8">
        {groupedTransactions.map((group) => (
          <div key={group.key} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            {/* Session Header */}
            <div className="px-5 py-4 bg-[#f9fafb] border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center text-[#111827]">
                    <User size={18} />
                  </div>
                  <div className="flex items-center gap-8">
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827]">{group.cashierName}</h3>
                      <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter">Personel Kasir</p>
                    </div>
                    {group.cashRegister && (
                      <>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter/wider">Tanggal</p>
                            <p className="text-xs font-semibold text-[#111827]">
                              {format(new Date(group.cashRegister.openedAt), "dd MMM yyyy", { locale: id })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter/wider">Buka Kas</p>
                            <p className="text-xs font-semibold text-[#3b82f6]">
                              {format(new Date(group.cashRegister.openedAt), "HH:mm", { locale: id })}
                            </p>
                          </div>
                          {group.cashRegister.closedAt && (
                            <div>
                              <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter/wider">Tutup Kas</p>
                              <p className="text-xs font-semibold text-[#6b7280]">
                                {format(new Date(group.cashRegister.closedAt), "HH:mm", { locale: id })}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] font-bold py-0.5 px-2 border-none rounded uppercase",
                    group.cashRegister?.status === "ACTIVE" 
                      ? "bg-blue-50 text-[#3b82f6]" 
                      : "bg-gray-100 text-[#6b7280]"
                  )}
                >
                  {group.cashRegister?.status === "ACTIVE" ? "Sesi Aktif" : "Sesi Selesai"}
                </Badge>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-[#e5e7eb]">
                    <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-5">Waktu</TableHead>
                    <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-5">No. Invoice</TableHead>
                    <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-5">Pelanggan</TableHead>
                    <TableHead className="font-semibold text-[#6b7280] h-11 text-[11px] uppercase tracking-wider px-5">Metode</TableHead>
                    <TableHead className="font-semibold text-[#6b7280] h-11 text-right text-[11px] uppercase tracking-wider px-5">Total Bayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-[#f9fafb]/50 border-b-[#e5e7eb] last:border-0 transition-colors">
                      <TableCell className="px-5 py-4 text-xs font-medium text-[#6b7280]">
                        {format(new Date(transaction.createdAt), "HH:mm", { locale: id })}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <span className="text-xs font-bold text-[#111827]">{transaction.invoiceNumber}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <span className="text-sm font-medium text-[#111827]">{transaction.customerName}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0 border-none rounded uppercase",
                            transaction.paymentMethod === "CASH" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-orange-50 text-orange-600"
                          )}
                        >
                          {transaction.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-[#111827]">{formatCurrency(transaction.finalAmount)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        {groupedTransactions.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-20 text-center">
            <ShoppingCart size={40} className="text-[#e2e8f0] mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[#6b7280]">Tidak ada data transaksi yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
