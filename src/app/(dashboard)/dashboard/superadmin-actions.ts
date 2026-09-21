"use server"

import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"

export type TimeRange = "today" | "7d" | "month" | "all"

export interface OutletPerformance {
  id: string
  nama: string
  alamat: string | null
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
  cashRevenue: number
  qrisRevenue: number
  activeCashiersCount: number
  totalStaffCount: number
  totalProductsCount: number
  revenueSharePercentage: number
}

export interface MultiOutletDashboardData {
  timeRange: TimeRange
  overall: {
    totalRevenue: number
    totalTransactions: number
    averageRevenuePerOutlet: number
    topPerformingOutlet: {
      id: string
      nama: string
      revenue: number
    } | null
    totalOutlets: number
    totalActiveRegisters: number
  }
  outlets: OutletPerformance[]
}

export async function getMultiOutletDashboardData(
  timeRange: TimeRange = "today"
): Promise<MultiOutletDashboardData> {
  const sessionUser = await getSessionUser()
  if (sessionUser.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Hanya Superadmin yang dapat mengakses data ini.")
  }

  // Tentukan rentang waktu
  const now = new Date()
  let startDate: Date | undefined

  if (timeRange === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  } else if (timeRange === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  } else if (timeRange === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  } else {
    startDate = undefined
  }

  // 1. Ambil semua outlet
  const rawOutlets = await prisma.outlet.findMany({
    select: {
      id: true,
      nama: true,
      alamat: true,
      _count: {
        select: {
          users: true,
          products: true,
        },
      },
    },
    orderBy: {
      nama: "asc",
    },
  })

  // 2. Ambil transaksi sesuai rentang waktu
  const transactions = await prisma.transaction.findMany({
    where: {
      paymentStatus: "COMPLETED",
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    },
    select: {
      outletId: true,
      finalAmount: true,
      paymentMethod: true,
    },
  })

  // 3. Ambil sesi kasir yang sedang aktif (OPEN)
  const openRegisters = await prisma.cashRegister.findMany({
    where: {
      status: "OPEN",
    },
    select: {
      outletId: true,
    },
  })

  const openRegistersMap = new Map<string, number>()
  for (const reg of openRegisters) {
    openRegistersMap.set(reg.outletId, (openRegistersMap.get(reg.outletId) || 0) + 1)
  }

  // 4. Hitung agregasi per outlet
  const outletStatsMap = new Map<
    string,
    {
      revenue: number
      count: number
      cash: number
      qris: number
    }
  >()

  for (const t of transactions) {
    const existing = outletStatsMap.get(t.outletId) || {
      revenue: 0,
      count: 0,
      cash: 0,
      qris: 0,
    }

    const amount = Number(t.finalAmount)
    existing.revenue += amount
    existing.count += 1

    if (t.paymentMethod === "CASH") {
      existing.cash += amount
    } else if (t.paymentMethod === "QRIS") {
      existing.qris += amount
    }

    outletStatsMap.set(t.outletId, existing)
  }

  let totalSystemRevenue = 0
  let totalSystemTransactions = 0

  for (const stats of outletStatsMap.values()) {
    totalSystemRevenue += stats.revenue
    totalSystemTransactions += stats.count
  }

  // 5. Buat list performa outlet
  const outletPerformances: OutletPerformance[] = rawOutlets.map((outlet) => {
    const stats = outletStatsMap.get(outlet.id) || {
      revenue: 0,
      count: 0,
      cash: 0,
      qris: 0,
    }

    const aov = stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0
    const share = totalSystemRevenue > 0 ? (stats.revenue / totalSystemRevenue) * 100 : 0

    return {
      id: outlet.id,
      nama: outlet.nama,
      alamat: outlet.alamat,
      totalRevenue: stats.revenue,
      totalTransactions: stats.count,
      averageOrderValue: aov,
      cashRevenue: stats.cash,
      qrisRevenue: stats.qris,
      activeCashiersCount: openRegistersMap.get(outlet.id) || 0,
      totalStaffCount: outlet._count.users,
      totalProductsCount: outlet._count.products,
      revenueSharePercentage: Math.round(share * 10) / 10,
    }
  })

  // Sort dari omzet tertinggi
  outletPerformances.sort((a, b) => b.totalRevenue - a.totalRevenue)

  const topOutlet = outletPerformances.length > 0 && outletPerformances[0].totalRevenue > 0
    ? {
        id: outletPerformances[0].id,
        nama: outletPerformances[0].nama,
        revenue: outletPerformances[0].totalRevenue,
      }
    : null

  const avgRev = rawOutlets.length > 0 ? Math.round(totalSystemRevenue / rawOutlets.length) : 0

  return {
    timeRange,
    overall: {
      totalRevenue: totalSystemRevenue,
      totalTransactions: totalSystemTransactions,
      averageRevenuePerOutlet: avgRev,
      topPerformingOutlet: topOutlet,
      totalOutlets: rawOutlets.length,
      totalActiveRegisters: openRegisters.length,
    },
    outlets: outletPerformances,
  }
}
