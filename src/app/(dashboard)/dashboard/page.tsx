import React, { Suspense } from "react"
import { getReportData } from "../laporan/actions"
import { ReportView } from "../laporan/ReportView"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const dateStr = typeof sp?.date === "string" ? sp.date : null
  const date = dateStr ? new Date(dateStr) : new Date()

  const data = await getReportData("daily", date)

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Memuat data dashboard...</div>}>
        <ReportView title="Dashboard Analytics" data={data} type="daily" />
      </Suspense>
    </div>
  )
}
