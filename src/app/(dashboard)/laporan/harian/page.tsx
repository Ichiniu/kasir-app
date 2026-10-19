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
  const outletParam = typeof sp?.outletId === "string" ? sp.outletId : undefined
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date()

  const data = await getReportData("daily", date, undefined, outletParam)

  return (
    <React.Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Memuat laporan...</div>}>
      <ReportView title="Laporan Harian" data={data} type="daily" />
    </React.Suspense>
  )
}
