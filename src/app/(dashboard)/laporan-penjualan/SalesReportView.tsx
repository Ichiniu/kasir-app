import type { ReactNode } from "react"
import { Banknote, ClipboardList, Package, Store, Wallet } from "lucide-react"

type Summary = { sales: number; transactions: number; items: number }
type Session = {
  id: string
  outletName: string
  cashierName: string
  openedAt: string
  closedAt: string | null
  status: "OPEN" | "CLOSED"
  openingBalance: number
  actualCash: number | null
  sales: number
  transactions: number
  items: number
}

const paymentLabels: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  DEBIT_CARD: "Kartu debit",
  CREDIT_CARD: "Kartu kredit",
  E_WALLET: "E-wallet",
  BANK_TRANSFER: "Transfer bank",
}

export function SalesReportView({ periodLabel, summary, paymentTotals, sessions, unassigned }: {
  periodLabel: string
  summary: Summary
  paymentTotals: Record<string, number>
  sessions: Session[]
  unassigned: Summary | null
}) {
  const paymentEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1])
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Periode laporan</p><h2 className="mt-1 text-lg font-semibold text-[#111827]">{periodLabel}</h2></div><p className="text-xs text-[#6b7280]">Hanya transaksi selesai yang dihitung.</p></div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Banknote size={17} />} label="Total penjualan" value={currency(summary.sales)} />
      <Metric icon={<ClipboardList size={17} />} label="Transaksi" value={count(summary.transactions)} />
      <Metric icon={<Package size={17} />} label="Item terjual" value={count(summary.items)} />
      <Metric icon={<Store size={17} />} label="Sesi kasir" value={count(sessions.length)} />
    </section>

    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <h3 className="font-semibold text-[#111827]">Penjualan per metode pembayaran</h3>
      {paymentEntries.length ? <div className="mt-3 flex flex-wrap gap-2">{paymentEntries.map(([method, amount]) => <div key={method} className="min-w-40 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2"><p className="text-xs text-[#6b7280]">{paymentLabels[method] ?? method}</p><p className="mt-1 text-sm font-bold text-[#111827]">{currency(amount)}</p></div>)}</div> : <p className="mt-3 text-sm text-[#9ca3af]">Belum ada transaksi di periode ini.</p>}
    </section>

    {unassigned && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Ada {count(unassigned.transactions)} transaksi ({currency(unassigned.sales)}) yang tidak terhubung ke sesi buka/tutup kas.</div>}

    <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
      <div className="border-b border-[#e5e7eb] px-4 py-4"><h3 className="font-semibold text-[#111827]">Penjualan per sesi kasir</h3><p className="mt-1 text-xs text-[#6b7280]">Setiap sesi adalah satu kali buka kas sampai tutup kas. Angka penjualan hanya menghitung transaksi dalam periode yang dipilih.</p></div>
      {sessions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-[#f9fafb] text-[10px] uppercase tracking-wider text-[#6b7280]"><tr><th className="px-4 py-3">Outlet</th><th className="px-4 py-3">Kasir & sesi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Transaksi</th><th className="px-4 py-3 text-right">Item</th><th className="px-4 py-3 text-right">Penjualan</th></tr></thead>
        <tbody>{sessions.map((session) => <tr key={session.id} className="border-t border-[#f0f1f3]">
          <td className="px-4 py-3 font-medium text-[#111827]">{session.outletName}</td>
          <td className="px-4 py-3"><p className="font-semibold text-[#111827]">{session.cashierName}</p><p className="mt-1 text-xs text-[#6b7280]">Buka {dateTime(session.openedAt)}</p><p className="text-xs text-[#6b7280]">{session.closedAt ? `Tutup ${dateTime(session.closedAt)}` : "Belum ditutup"}</p></td>
          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${session.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>{session.status === "OPEN" ? "Terbuka" : "Ditutup"}</span></td>
          <td className="px-4 py-3 text-right tabular-nums">{count(session.transactions)}</td>
          <td className="px-4 py-3 text-right tabular-nums">{count(session.items)}</td>
          <td className="px-4 py-3 text-right font-bold tabular-nums text-[#111827]">{currency(session.sales)}</td>
        </tr>)}</tbody>
      </table></div> : <div className="px-5 py-12 text-center"><Wallet className="mx-auto text-[#9ca3af]" size={26} /><p className="mt-3 text-sm font-semibold text-[#111827]">Belum ada sesi kas di periode ini</p><p className="mt-1 text-xs text-[#6b7280]">Coba pilih tanggal atau outlet yang berbeda.</p></div>}
    </section>
  </div>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4"><div className="flex items-center gap-2 text-[#6b7280]">{icon}<span className="text-xs font-semibold">{label}</span></div><p className="mt-3 text-xl font-bold text-[#111827]">{value}</p></div>
}

function currency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)
}

function count(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value))
}
