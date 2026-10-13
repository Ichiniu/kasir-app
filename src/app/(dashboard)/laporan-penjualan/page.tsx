import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { SalesReportFilters } from "./SalesReportFilters"
import { SalesReportView } from "./SalesReportView"

export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>
type PeriodMode = "day" | "range" | "month"

export default async function SalesReportPage({ searchParams }: { searchParams: SearchParams }) {
  let sessionUser
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }
  if (sessionUser.role !== "SUPERADMIN") redirect("/dashboard")

  const params = await searchParams
  const outlets = await prisma.outlet.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } })
  const requestedOutletId = typeof params.outletId === "string" ? params.outletId : ""
  const outletId = outlets.some((outlet) => outlet.id === requestedOutletId) ? requestedOutletId : ""
  const mode = (typeof params.mode === "string" && ["day", "range", "month"].includes(params.mode) ? params.mode : "day") as PeriodMode
  const today = jakartaToday()
  const selectedDate = validDateKey(typeof params.date === "string" ? params.date : "") ?? today
  const startDate = validDateKey(typeof params.startDate === "string" ? params.startDate : "") ?? selectedDate
  const endDate = validDateKey(typeof params.endDate === "string" ? params.endDate : "") ?? startDate
  const selectedMonth = validMonthKey(typeof params.month === "string" ? params.month : "") ?? today.slice(0, 7)

  let startKey: string
  let endExclusiveKey: string
  if (mode === "range") {
    startKey = startDate
    const finalDate = endDate < startDate ? startDate : endDate
    endExclusiveKey = addDays(finalDate, 1)
  } else if (mode === "month") {
    startKey = `${selectedMonth}-01`
    const [year, month] = selectedMonth.split("-").map(Number)
    const nextMonth = new Date(Date.UTC(year, month, 1))
    endExclusiveKey = dateKey(nextMonth)
  } else {
    startKey = selectedDate
    endExclusiveKey = addDays(selectedDate, 1)
  }

  const start = jakartaStart(startKey)
  const endExclusive = jakartaStart(endExclusiveKey)
  const outletFilter = outletId ? { outletId } : {}
  const [registers, transactions] = await Promise.all([
    prisma.cashRegister.findMany({
      where: {
        ...outletFilter,
        openedAt: { lt: endExclusive },
        OR: [{ closedAt: null }, { closedAt: { gte: start } }],
      },
      include: {
        outlet: { select: { nama: true } },
        user: { select: { name: true } },
      },
      orderBy: { openedAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        ...outletFilter,
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lt: endExclusive },
      },
      select: {
        id: true,
        invoiceNumber: true,
        finalAmount: true,
        paymentMethod: true,
        createdAt: true,
        cashRegisterId: true,
        outletId: true,
        outlet: { select: { nama: true } },
        transactionItems: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const sessionTotals = new Map<string, { sales: number; transactions: number; items: number }>()
  const totals = { sales: 0, transactions: 0, items: 0 }
  const paymentTotals: Record<string, number> = {}
  const sessionIds = new Set(registers.map((register) => register.id))
  const unassigned = { sales: 0, transactions: 0, items: 0 }

  for (const transaction of transactions) {
    const amount = Number(transaction.finalAmount)
    const itemCount = transaction.transactionItems.reduce((sum, item) => sum + item.quantity, 0)
    totals.sales += amount
    totals.transactions += 1
    totals.items += itemCount
    paymentTotals[transaction.paymentMethod] = (paymentTotals[transaction.paymentMethod] ?? 0) + amount

    if (transaction.cashRegisterId && sessionIds.has(transaction.cashRegisterId)) {
      const group = sessionTotals.get(transaction.cashRegisterId) ?? { sales: 0, transactions: 0, items: 0 }
      group.sales += amount
      group.transactions += 1
      group.items += itemCount
      sessionTotals.set(transaction.cashRegisterId, group)
    } else {
      unassigned.sales += amount
      unassigned.transactions += 1
      unassigned.items += itemCount
    }
  }

  const sessions = registers.map((register) => ({
    id: register.id,
    outletName: register.outlet.nama,
    cashierName: register.user.name,
    openedAt: register.openedAt.toISOString(),
    closedAt: register.closedAt?.toISOString() ?? null,
    status: register.status,
    openingBalance: Number(register.openingBalance),
    actualCash: register.actualCash === null ? null : Number(register.actualCash),
    ...(sessionTotals.get(register.id) ?? { sales: 0, transactions: 0, items: 0 }),
  }))

  return (
    <main className="min-h-screen space-y-6 bg-[#f8fafc] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Superadmin</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#111827]">Laporan Penjualan</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Ringkasan penjualan outlet dan rincian tiap sesi buka/tutup kas.</p>
        </header>
        <SalesReportFilters outlets={outlets} outletId={outletId} mode={mode} date={selectedDate} startDate={startDate} endDate={endDate} month={selectedMonth} />
        <SalesReportView
          periodLabel={periodLabel(mode, startKey, endExclusiveKey)}
          summary={totals}
          paymentTotals={paymentTotals}
          sessions={sessions}
          unassigned={unassigned.transactions > 0 ? unassigned : null}
        />
      </div>
    </main>
  )
}

function validDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return dateKey(calendarDate(value)) === value ? value : null
}

function validMonthKey(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  return value
}

function calendarDate(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(key: string, days: number) {
  const date = calendarDate(key)
  date.setUTCDate(date.getUTCDate() + days)
  return dateKey(date)
}

function jakartaStart(key: string) {
  return new Date(calendarDate(key).getTime() - 7 * 60 * 60 * 1000)
}

function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function periodLabel(mode: PeriodMode, start: string, endExclusive: string) {
  const end = addDays(endExclusive, -1)
  const fmt = (key: string) => {
    const date = calendarDate(key)
    date.setUTCHours(12)
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date)
  }
  if (mode === "day") return fmt(start)
  if (mode === "month") return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${start}T12:00:00Z`))
  return `${fmt(start)} – ${fmt(end)}`
}
