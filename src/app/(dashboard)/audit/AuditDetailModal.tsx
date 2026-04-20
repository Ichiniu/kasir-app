"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { FileText, ArrowRight } from "lucide-react"

interface AuditDetailModalProps {
  log: any
  isOpen: boolean
  onClose: () => void
}

export function AuditDetailModal({ log, isOpen, onClose }: AuditDetailModalProps) {
  let oldData = null
  let newData = null

  try {
    oldData = log.oldValue ? JSON.parse(log.oldValue) : null
    newData = log.newValue ? JSON.parse(log.newValue) : null
  } catch (e) {
    console.error("Failed to parse audit data:", e)
  }

  const getChangedFields = () => {
    if (!oldData || !newData) return []
    
    const changes: any[] = []
    const fieldNames: any = {
      name: 'Nama Produk',
      sku: 'SKU',
      description: 'Deskripsi',
      price: 'Harga Jual',
      cost: 'Harga Modal',
      stock: 'Stok',
      minStock: 'Stok Minimum',
      unit: 'Satuan',
      categoryId: 'Kategori',
      isActive: 'Status Aktif'
    }

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key] && fieldNames[key]) {
        changes.push({
          field: fieldNames[key],
          oldValue: formatValue(key, oldData[key]),
          newValue: formatValue(key, newData[key])
        })
      }
    })

    return changes
  }

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'Tidak ada'
    if (key === 'price' || key === 'cost') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(Number(value))
    }
    if (key === 'isActive') return value ? 'Aktif' : 'Tidak Aktif'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const changes = getChangedFields()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white p-0">
        <div className="p-6 border-b border-[#e5e7eb]">
          <DialogTitle className="text-xl font-semibold text-[#111827] tracking-tight">
            Detail Aktivitas
          </DialogTitle>
          <p className="text-sm text-[#6b7280] mt-1">Detail perubahan data pada log audit.</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Waktu</p>
              <p className="text-sm font-medium text-[#111827]">
                {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: id })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Pengguna</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#111827]">{log.user?.name || 'System'}</span>
                {log.user?.role && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 font-medium bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]">
                    {log.user.role}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Aksi</p>
              <Badge className="bg-[#111827] text-white hover:bg-black text-[10px] py-0 px-2 font-medium border-none">
                {log.action.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Entitas</p>
              <p className="text-sm font-medium text-[#111827]">{log.entity || '-'}</p>
            </div>
          </div>

          {/* Details Section */}
          {log.details && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Deskripsi Kegiatan</p>
              <div className="p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                <p className="text-sm text-[#374151] leading-relaxed italic">{log.details}</p>
              </div>
            </div>
          )}

          {/* Changes Section */}
          {changes.length > 0 && (
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Perubahan Data ({changes.length})</p>
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div key={index} className="rounded-lg border border-[#e5e7eb] overflow-hidden">
                    <div className="px-4 py-2 bg-[#f9fafb] border-b border-[#e5e7eb]">
                      <span className="text-xs font-semibold text-[#111827]">{change.field}</span>
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center p-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-[#ef4444] uppercase tracking-tighter">Sebelum</span>
                        <p className="text-sm text-[#4b5563] font-medium line-through decoration-[#ef4444]/30">{change.oldValue}</p>
                      </div>
                      <ArrowRight size={16} className="text-[#9ca3af]" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium text-[#10b981] uppercase tracking-tighter">Sesudah</span>
                        <p className="text-sm text-[#111827] font-semibold">{change.newValue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Info Section */}
          {(oldData || newData) && (
            <details className="group">
              <summary className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest cursor-pointer list-none flex items-center gap-1.5 hover:text-[#6b7280] transition-colors">
                <span className="group-open:rotate-90 transition-transform">▸</span>
                Informasi Teknis (Raw Data)
              </summary>
              <div className="mt-4 space-y-4">
                {oldData && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-[#9ca3af]">STATE LAMA:</p>
                    <pre className="text-[11px] bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb] overflow-x-auto text-[#6b7280] font-mono">
                      {JSON.stringify(oldData, null, 2)}
                    </pre>
                  </div>
                )}
                {newData && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-[#9ca3af]">STATE BARU:</p>
                    <pre className="text-[11px] bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb] overflow-x-auto text-[#6b7280] font-mono">
                      {JSON.stringify(newData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
