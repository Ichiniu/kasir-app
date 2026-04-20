"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { User as UserIcon, Activity, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AuditDetailModal } from "./AuditDetailModal"
import { Button } from "@/components/ui/button"

interface AuditTableProps {
  logs: any[]
}

export function AuditTable({ logs }: AuditTableProps) {
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) return "text-emerald-600 bg-emerald-50 border-emerald-100"
    if (action.includes("DELETE")) return "text-red-600 bg-red-50 border-red-100"
    if (action.includes("UPDATE")) return "text-blue-600 bg-blue-50 border-blue-100"
    if (action.includes("LOGIN")) return "text-purple-600 bg-purple-50 border-purple-100"
    if (action.includes("CLOSE")) return "text-orange-600 bg-orange-50 border-orange-100"
    return "text-[#6b7280] bg-[#f9fafb] border-[#e5e7eb]"
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f9fafb]">
          <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
            <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4">Waktu Aktivitas</TableHead>
            <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4">Pengguna</TableHead>
            <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4">Aksi</TableHead>
            <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4">Entitas</TableHead>
            <TableHead className="font-semibold text-[#6b7280] h-12 text-[11px] uppercase tracking-wider px-4">Detail Kegiatan</TableHead>
            <TableHead className="font-semibold text-[#6b7280] h-12 text-center text-[11px] uppercase tracking-wider px-4">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-[#9ca3af] text-sm italic">
                Belum ada rekaman aktivitas audit.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log: any) => (
              <TableRow key={log.id} className="hover:bg-[#f9fafb] transition-colors border-b-[#e5e7eb]">
                <TableCell className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-[#111827] font-semibold text-xs">{format(new Date(log.createdAt), "dd MMM yyyy", { locale: id })}</span>
                    <span className="text-[10px] text-[#6b7280]">{format(new Date(log.createdAt), "HH:mm:ss", { locale: id })}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#111827] text-sm">{log.user?.name || "System"}</span>
                    <span className="text-[10px] font-medium text-[#6b7280] uppercase tracking-tighter">{log.user?.role || "SYSTEM"}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-semibold border-none rounded whitespace-nowrap", getActionBadgeColor(log.action))}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-1.5 font-medium text-[#111827] text-xs">
                    <Activity size={12} className="text-[#9ca3af]" />
                    {log.entity || "-"}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 max-w-[300px]">
                  <p className="text-xs text-[#6b7280] leading-relaxed truncate" title={log.details}>
                    {log.details || "Tidak ada detail tambahan"}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-4 text-center">
                  {(log.oldValue || log.newValue) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-8 w-8 p-0 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]"
                    >
                      <Eye size={16} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedLog && (
        <AuditDetailModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}
