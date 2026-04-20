"use client"

import React, { useState, useMemo } from "react"
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createTransaction } from "./actions"

export function Cashier({ 
  initialProducts, 
  userId, 
  cashRegisterId 
}: { 
  initialProducts: any[], 
  userId: string,
  cashRegisterId: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cashReceived, setCashReceived] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH")

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, initialProducts])

  const addToCart = (product: any) => {
    if (product.stock <= 0) return
    
    setCart(current => {
      const existing = current.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return current
        return current.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * Number(item.price) } : item
        )
      }
      return [...current, { 
        id: product.id, 
        name: product.name, 
        sku: product.sku,
        price: Number(product.price), 
        quantity: 1, 
        subtotal: Number(product.price),
        stock: product.stock
      }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(current => current.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta)
        if (newQty > item.stock) return item
        return { ...item, quantity: newQty, subtotal: newQty * item.price }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = subtotal * 0 // Skip tax for now or add if needed
  const total = subtotal + tax
  const sanitizedCashValue = cashReceived ? Number(cashReceived.replace(/[^0-9]/g, "")) : 0
  const change = sanitizedCashValue - total

  const handleCheckout = () => {
    if (cart.length === 0) return
    
    if (!customerName.trim()) {
      setError("Nama Pelanggan wajib diisi!")
      return
    }

    const sanitizedCashValue = Number(cashReceived.replace(/[^0-9]/g, ""))
    
    if (paymentMethod === "CASH") {
      if (!cashReceived || sanitizedCashValue < total) {
        setError("Pembayaran tunai kurang!")
        return
      }
    }

    setError("")
    setShowConfirm(true)
  }

  const processTransaction = async () => {
    setLoading(true)
    setShowConfirm(false) // Close confirm modal
    setError("")

    // Sanitize cash received string to number
    const sanitizedCash = Number(cashReceived.replace(/[^0-9]/g, ""))

    const result = await createTransaction({
      items: cart,
      totalAmount: subtotal,
      finalAmount: total,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === "CASH" ? sanitizedCash : total,
      changeAmount: paymentMethod === "CASH" ? sanitizedCash - total : 0,
      userId: userId,
      customerName: customerName || "Umum",
      cashRegisterId: cashRegisterId
    })

    if (result.success) {
      setCart([])
      setCashReceived("")
      setCustomerName("")
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } else {
      setError(result.error || "Gagal memproses transaksi.")
    }
    setLoading(false)
  }

  const formatRupiahInput = (value: string) => {
    const numberString = value.replace(/[^0-9]/g, "")
    if (!numberString) return ""
    return new Intl.NumberFormat("id-ID").format(Number(numberString))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col xl:flex-row h-full gap-6 p-6 bg-white overflow-hidden font-sans">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
        <div className="flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Kasir</h1>
            <div className="flex items-center bg-[#f9fafb] p-1 rounded-lg border border-[#e5e7eb]">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "grid" ? "bg-white text-[#111827] shadow-sm border border-[#e5e7eb]" : "text-[#9ca3af] hover:text-[#111827]"
                )}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "list" ? "bg-white text-[#111827] shadow-sm border border-[#e5e7eb]" : "text-[#9ca3af] hover:text-[#111827]"
                )}
              >
                <List size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={18} />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-lg bg-white border-[#e5e7eb] focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-sm font-medium transition-all"
            />
          </div>
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar",
          viewMode === "grid" 
            ? "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 content-start" 
            : "flex flex-col gap-3"
        )}>
          {filteredProducts.map((p) => (
            viewMode === "grid" ? (
              <div 
                key={p.id}
                onClick={() => addToCart(p)}
                className={cn(
                  "group p-3 flex flex-col h-[145px] cursor-pointer transition-all border border-[#e5e7eb] bg-white rounded-xl hover:border-[#111827] hover:shadow-sm",
                  p.stock <= 0 && "opacity-40 cursor-not-allowed grayscale"
                )}
              >
                <div className="flex flex-col h-full justify-between gap-2 min-w-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#111827] line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                      <span className="shrink-0 text-[10px] font-mono font-bold text-[#5E54F7] bg-[#5E54F7]/5 px-1.5 py-0.5 rounded border border-[#5E54F7]/10 uppercase tracking-tighter">
                        {p.sku}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#9ca3af] truncate">{p.category?.name || "Uncategorized"}</span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-auto pt-4">
                    <span className="font-bold text-base text-[#111827] mb-1">
                      {formatCurrency(Number(p.price))}
                    </span>
                    <div className="flex flex-col items-end gap-2">
                       <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm",
                          p.stock <= 5 
                            ? "bg-red-50 text-red-600 border-red-100" 
                            : "bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]"
                       )}>
                         Stok: {p.stock}
                       </span>
                       <div className="w-8 h-8 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-center text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-all shadow-sm">
                         <Plus size={16} />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={p.id}
                onClick={() => addToCart(p)}
                className={cn(
                  "group flex items-center gap-3 p-3 bg-white border border-[#e5e7eb] rounded-xl cursor-pointer transition-all hover:border-[#111827] hover:shadow-sm",
                  p.stock <= 0 && "opacity-40 cursor-not-allowed grayscale"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827] truncate">
                      {p.name}
                    </h3>
                    <span className={cn(
                      "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm",
                      p.stock <= 5 
                        ? "bg-red-500 text-white border-red-600" 
                        : p.stock <= 20
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-emerald-500 text-white border-emerald-600"
                    )}>
                      Stok: {p.stock}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono font-bold text-[#5E54F7] bg-[#5E54F7]/5 px-1.5 py-0.5 rounded border border-[#5E54F7]/10">{p.sku}</span>
                    <span className="text-[10px] text-[#9ca3af]">{p.category?.name || "Uncategorized"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-[#111827]">{formatCurrency(Number(p.price))}</span>
                  <div className="w-8 h-8 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-center text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-all shadow-sm">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full xl:w-[400px] xl:flex-shrink-0 flex flex-col xl:h-screen xl:max-h-screen overflow-hidden">
        <div className="flex flex-col border border-[#e5e7eb] overflow-hidden rounded-2xl bg-white shadow-sm h-full max-h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-[#f9fafb]">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#111827]" />
              <h2 className="font-semibold text-[#111827] text-sm tracking-tight">Pesanan</h2>
            </div>
            <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5 rounded-full">
              {cart.length} Pesanan
            </span>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Identitas Pelanggan</Label>
              <Input
                placeholder="NAMA PELANGGAN"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                className="h-10 rounded-lg border-[#e5e7eb] bg-white focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] text-sm font-bold tracking-tight text-[#111827] placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar border-y border-[#e5e7eb] min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                <ShoppingCart size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium mt-2">Belum ada item dipilih</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e5e7eb] bg-white transition-all group">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#111827] block truncate">{item.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#6b7280] font-medium">{formatCurrency(item.price)}</span>
                      <span className="text-[10px] font-bold text-[#111827]">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#f9fafb] p-1 rounded-lg border border-[#e5e7eb]">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded border border-[#e5e7eb] text-[#6b7280] hover:text-[#ef4444] shadow-sm transition-all"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="min-w-[20px] text-center text-[11px] font-bold text-[#111827]">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] shadow-sm transition-all"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Card */}
          <div className="bg-[#f9fafb]">
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-semibold text-[#6b7280] uppercase">
                <span>Total Item</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} Pcs</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-medium text-[#111827]">Grand Total</span>
                <span className="text-xl font-bold text-[#111827]">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#e5e7eb] space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f3f4f6] rounded-lg border border-[#e5e7eb]">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "h-8 rounded-md text-[11px] font-bold uppercase transition-all",
                    paymentMethod === "CASH" ? "bg-white text-[#111827] shadow-sm" : "text-[#9ca3af] hover:text-[#111827]"
                  )}
                >
                  Tunai
                </button>
                <button
                  onClick={() => setPaymentMethod("QRIS")}
                  className={cn(
                    "h-8 rounded-md text-[11px] font-bold uppercase transition-all",
                    paymentMethod === "QRIS" ? "bg-white text-[#111827] shadow-sm" : "text-[#9ca3af] hover:text-[#111827]"
                  )}
                >
                  QRIS
                </button>
              </div>

              {paymentMethod === "CASH" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af]">Rp</span>
                    <Input
                      type="text"
                      value={formatRupiahInput(cashReceived)}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="pl-10 h-11 text-base font-bold bg-[#f9fafb] border-[#e5e7eb] focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 rounded-lg transition-all"
                      placeholder="0"
                    />
                  </div>
                  {sanitizedCashValue >= total && total > 0 && (
                    <div className="flex justify-between items-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Kembalian</span>
                      <span className="text-sm font-bold text-emerald-700">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                  <div className="w-8 h-8 bg-[#111827] rounded flex items-center justify-center text-white font-bold text-[10px]">QR</div>
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-[#111827]">QRIS dynamic</p>
                    <p className="text-[10px] text-[#6b7280]">Konfirmasi setelah pembayaran</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-[11px] font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button 
                disabled={loading || cart.length === 0}
                onClick={handleCheckout}
                className="w-full h-12 text-sm font-bold rounded-xl bg-[#111827] hover:bg-black text-white hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
              >
                {loading ? "PROSES..." : "KONFIRMASI PEMBAYARAN"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-[#e5e7eb] m-4">
            <div className="p-6 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <h2 className="text-lg font-bold text-[#111827] tracking-tight">Cek Ulang Pesanan</h2>
              <p className="text-xs text-[#6b7280] mt-1 italic">Pastikan rincian pesanan sudah sesuai</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Pelanggan</span>
                <p className="font-bold text-sm text-[#111827]">{customerName || "UMUM"}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Item ({cart.length})</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto px-1 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs font-medium">
                      <span className="text-[#111827] flex-1 mr-4">{item.quantity}x {item.name}</span>
                      <span className="text-[#111827] shrink-0 font-semibold">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[#e5e7eb] space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#6b7280]">GRAND TOTAL</span>
                  <span className="text-xl text-[#111827]">{formatCurrency(total)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#6b7280]">METODE</span>
                  <span className="font-bold text-[#111827] uppercase tracking-wider">
                    {paymentMethod === "CASH" ? "TUNAI" : "QRIS"}
                  </span>
                </div>

                {paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#f3f4f6]">
                      <span className="text-[#6b7280] font-medium">Dibayar</span>
                      <span className="font-bold text-[#111827]">{formatCurrency(sanitizedCashValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6b7280] font-medium">Kembalian</span>
                      <span className="font-bold text-[#111827]">{formatCurrency(change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="h-10 rounded-lg border-[#e5e7eb] bg-white text-xs font-bold hover:bg-gray-50"
                disabled={loading}
              >
                KEMBALI
              </Button>
              <Button 
                onClick={processTransaction}
                className="h-10 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? "PROSES..." : "FINALISASI"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-300 px-4">
          <div className="p-10 flex flex-col items-center gap-6 bg-white rounded-3xl border border-[#e5e7eb] shadow-2xl animate-in zoom-in duration-300 max-w-sm w-full">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
               <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <CheckCircle2 size={24} />
               </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#111827] tracking-tighter">Transaksi Berhasil</h2>
              <p className="text-sm text-[#6b7280] mt-1 font-medium">Stok inventori telah diperbarui</p>
            </div>
            <Button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-[#111827] hover:bg-black text-white font-bold h-11 rounded-xl transition-all active:scale-[0.95]"
            >
              SELESAI
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

