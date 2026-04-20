"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { eachDayOfInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay, eachHourOfInterval, setHours, endOfHour, startOfHour } from "date-fns"
import { id as localeId } from "date-fns/locale"

export async function getReportData(
  type: "daily" | "weekly" | "monthly", 
  date: Date = new Date(),
  range?: { start: Date; end: Date }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/login")
  }

  let start: Date
  let end: Date

  if (range && range.start && range.end) {
    start = startOfDay(range.start)
    end = endOfDay(range.end)
  } else if (type === "daily") {
    start = startOfDay(date)
    end = endOfDay(date)
  } else if (type === "weekly") {
    start = startOfWeek(date, { weekStartsOn: 1 })
    end = endOfWeek(date, { weekStartsOn: 1 })
  } else {
    start = startOfMonth(date)
    end = endOfMonth(date)
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      user: { select: { name: true } },
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

  // Trend Data Aggregation
  let trendData = []
  if (type === "daily") {
    // Hourly trend for the day
    const hours = eachHourOfInterval({ start, end })
    trendData = hours.map(hour => {
      const hourStart = startOfHour(hour)
      const hourEnd = endOfHour(hour)
      const amount = transactions
        .filter((t: any) => t.createdAt >= hourStart && t.createdAt <= hourEnd)
        .reduce((sum: number, t: any) => sum + Number(t.finalAmount), 0)
      return {
        label: format(hour, "HH:mm"),
        amount
      }
    })
  } else {
    // Daily trend for weekly/monthly
    const days = eachDayOfInterval({ start, end })
    trendData = days.map(day => {
      const amount = transactions
        .filter((t: any) => isSameDay(t.createdAt, day))
        .reduce((sum: number, t: any) => sum + Number(t.finalAmount), 0)
      return {
        label: format(day, "dd MMM", { locale: localeId }),
        amount
      }
    })
  }

  return {
    transactions: transactions.map((t: any) => ({
      ...t,
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
      label: type === "daily" ? format(date, "dd MMMM yyyy", { locale: localeId }) : 
             type === "weekly" ? `${format(start, "dd MMM", { locale: localeId })} - ${format(end, "dd MMM yyyy", { locale: localeId })}` :
             format(date, "MMMM yyyy", { locale: localeId })
    }
  }
}
