import React from "react"
import { getReportData } from "../actions"
import { ReportView } from "../ReportView"

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const dateParam = typeof sp?.date === "string" ? sp.date : undefined
  const outletParam = typeof sp?.outletId === "string" ? sp.outletId : undefined
  const date = dateParam
    ? (dateParam.length === 7 ? new Date(`${dateParam}-01T00:00:00`) : new Date(`${dateParam}T00:00:00`))
    : new Date()

  const data = await getReportData("monthly", date, undefined, outletParam)

  return (
    <React.Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Memuat laporan bulanan...</div>}>
      <ReportView title="Laporan Bulanan" data={data} type="monthly" />
    </React.Suspense>
  )
}
