import React from "react"
import { getReportData } from "../actions"
import { ReportView } from "../ReportView"

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const dateParam = typeof sp?.date === "string" ? sp.date : undefined
  const date = dateParam ? new Date(dateParam) : new Date()

  const data = await getReportData("daily", date)

  return (
    <React.Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Memuat laporan...</div>}>
      <ReportView title="Laporan Harian" data={data} type="daily" />
    </React.Suspense>
  )
}
