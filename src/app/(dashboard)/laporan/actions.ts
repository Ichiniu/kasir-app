"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

// Helper to get YYYY-MM-DD in Asia/Jakarta timezone
function getJakartaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
}

// Helper to get hour (0-23) in Asia/Jakarta timezone
function getJakartaHour(date: Date): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false
  }).format(date)
  return parseInt(hourStr, 10) % 24
}

// Converts a YYYY-MM-DD string to start of that day in Jakarta (as UTC Date for DB query)
function jakartaStartOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - WIB_OFFSET_MS)
}

// Converts a YYYY-MM-DD string to end of that day in Jakarta (as UTC Date for DB query)
function jakartaEndOfDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - WIB_OFFSET_MS)
}

export async function getReportData(
  type: "daily" | "weekly" | "monthly", 
  date: Date = new Date(),
  range?: { start: Date; end: Date },
  filterOutletId?: string
) {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { outletId, isSuperAdmin } = sessionUser

  let start: Date
  let end: Date
  let startKey: string
  let endKey: string
  let monthKey: string
  let periodLabel: string

  if (range && range.start && range.end) {
    startKey = getJakartaDateKey(range.start)
    endKey = getJakartaDateKey(range.end)
    monthKey = startKey.slice(0, 7)
    start = jakartaStartOfDay(startKey)
    end = jakartaEndOfDay(endKey)

    const [sY, sM, sD] = startKey.split("-").map(Number)
    const [eY, eM, eD] = endKey.split("-").map(Number)
    const sDate = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0))
    const eDate = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0))
    periodLabel = `${format(sDate, "dd MMM", { locale: localeId })} - ${format(eDate, "dd MMM yyyy", { locale: localeId })}`
  } else if (type === "daily") {
    startKey = getJakartaDateKey(date)
    endKey = startKey
    monthKey = startKey.slice(0, 7)
    start = jakartaStartOfDay(startKey)
    end = jakartaEndOfDay(endKey)

    const [y, m, d] = startKey.split("-").map(Number)
    const dDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    periodLabel = format(dDate, "dd MMMM yyyy", { locale: localeId })
  } else if (type === "weekly") {
    const targetKey = getJakartaDateKey(date)
    const [y, m, d] = targetKey.split("-").map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    const dayOfWeek = dt.getUTCDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const mon = new Date(dt.getTime() + diffToMonday * 24 * 3600 * 1000)
    const sun = new Date(mon.getTime() + 6 * 24 * 3600 * 1000)
    startKey = mon.toISOString().slice(0, 10)
    endKey = sun.toISOString().slice(0, 10)
    monthKey = startKey.slice(0, 7)
    start = jakartaStartOfDay(startKey)
    end = jakartaEndOfDay(endKey)

    const [sY, sM, sD] = startKey.split("-").map(Number)
    const [eY, eM, eD] = endKey.split("-").map(Number)
    const sDate = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0))
    const eDate = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0))
    periodLabel = `${format(sDate, "dd MMM", { locale: localeId })} - ${format(eDate, "dd MMM yyyy", { locale: localeId })}`
  } else {
    const targetKey = getJakartaDateKey(date)
    monthKey = targetKey.slice(0, 7)
    const [y, m] = monthKey.split("-").map(Number)
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
    startKey = `${monthKey}-01`
    endKey = `${monthKey}-${String(lastDay).padStart(2, "0")}`
    start = jakartaStartOfDay(startKey)
    end = jakartaEndOfDay(endKey)

    const [mY, mM] = monthKey.split("-").map(Number)
    const mDate = new Date(Date.UTC(mY, mM - 1, 1, 12, 0, 0))
    periodLabel = format(mDate, "MMMM yyyy", { locale: localeId })
  }

  // Determine effective outlet filter
  const targetOutlet = isSuperAdmin ? (filterOutletId || undefined) : outletId || undefined

  const outlets = isSuperAdmin
    ? await prisma.outlet.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } })
    : []

  const activeOutletObj = targetOutlet 
    ? (isSuperAdmin 
        ? outlets.find(o => o.id === targetOutlet) 
        : await prisma.outlet.findUnique({ where: { id: targetOutlet }, select: { id: true, nama: true } }))
    : null

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(targetOutlet ? { outletId: targetOutlet } : {}),
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      user: { select: { name: true } },
      outlet: { select: { nama: true } },
      transactionItems: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Summary stats
  const totalRevenue = transactions.reduce((sum: number, t: any) => sum + Number(t.finalAmount), 0)
  const totalTransactions = transactions.length
  const totalItemsSold = transactions.reduce((sum: number, t: any) => 
    sum + t.transactionItems.reduce((iSum: number, item: any) => iSum + item.quantity, 0), 0
  )

  // Payment methods breakdown
  const paymentMethods = transactions.reduce((acc: Record<string, number>, t: any) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.finalAmount)
    return acc
  }, {})

  // Best selling products
  const productSales = transactions.flatMap((t: any) => t.transactionItems).reduce((acc: Record<string, any>, item: any) => {
    if (!acc[item.productName]) {
      acc[item.productName] = { name: item.productName, qty: 0, total: 0 }
    }
    acc[item.productName].qty += item.quantity
    acc[item.productName].total += Number(item.subtotal)
    return acc
  }, {})

  const bestSellers = Object.values(productSales)
    .sort((a: any, b: any) => b.qty - a.qty)
    .slice(0, 5)

  // Top Customers
  const customerSpending = transactions.reduce((acc: Record<string, any>, t: any) => {
    const name = t.customerName || "Umum"
    if (!acc[name]) {
      acc[name] = { name, total: 0, transactions: 0 }
    }
    acc[name].total += Number(t.finalAmount)
    acc[name].transactions += 1
    return acc
  }, {})

  const topCustomers = Object.values(customerSpending)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5)

  // Trend Data Aggregation in Asia/Jakarta (WIB)
  let trendData = []
  if (type === "daily") {
    // 24 hours in Jakarta time (00:00 - 23:00 WIB)
    trendData = Array.from({ length: 24 }, (_, h) => {
      const amount = transactions
        .filter((t: any) => getJakartaHour(new Date(t.createdAt)) === h)
        .reduce((sum: number, t: any) => sum + Number(t.finalAmount), 0)
      return {
        label: `${String(h).padStart(2, "0")}:00`,
        amount
      }
    })
  } else {
    // Daily trend in Jakarta time
    const dayKeys: string[] = []
    let currDate = new Date(`${startKey}T12:00:00Z`)
    const finalDate = new Date(`${endKey}T12:00:00Z`)
    while (currDate <= finalDate) {
      dayKeys.push(currDate.toISOString().slice(0, 10))
      currDate = new Date(currDate.getTime() + 24 * 3600 * 1000)
    }

    trendData = dayKeys.map(dKey => {
      const [year, month, day] = dKey.split("-").map(Number)
      const dayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      const amount = transactions
        .filter((t: any) => getJakartaDateKey(new Date(t.createdAt)) === dKey)
        .reduce((sum: number, t: any) => sum + Number(t.finalAmount), 0)
      return {
        label: format(dayDate, "dd MMM", { locale: localeId }),
        amount
      }
    })
  }

  return {
    isSuperAdmin,
    currentOutletId: targetOutlet || "",
    currentOutletName: activeOutletObj?.nama || (isSuperAdmin ? "Semua Cabang" : "Cabang Utama"),
    outlets,
    transactions: transactions.map((t: any) => ({
      ...t,
      outletName: t.outlet?.nama || "-",
      totalAmount: Number(t.totalAmount),
      discountAmount: Number(t.discountAmount),
      taxAmount: Number(t.taxAmount),
      finalAmount: Number(t.finalAmount),
      cashReceived: t.cashReceived ? Number(t.cashReceived) : null,
      changeAmount: t.changeAmount ? Number(t.changeAmount) : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      transactionItems: t.transactionItems.map((item: any) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      }))
    })),
    summary: {
      totalRevenue,
      totalTransactions,
      totalItemsSold,
    },
    paymentMethods,
    bestSellers,
    topCustomers,
    trendData,
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      startDate: startKey,
      endDate: endKey,
      monthStr: monthKey,
      label: periodLabel
    }
  }
}
