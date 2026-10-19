import React from "react"
import { getReportData } from "../actions"
import { ReportView } from "../ReportView"

export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const dateParam = typeof sp?.date === "string" ? sp.date : undefined
  const startDateParam = typeof sp?.startDate === "string" ? sp.startDate : undefined
  const endDateParam = typeof sp?.endDate === "string" ? sp.endDate : undefined
  
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date()
  
  let range: { start: Date; end: Date } | undefined = undefined
  if (startDateParam && endDateParam) {
    let s = new Date(`${startDateParam}T00:00:00`)
    let e = new Date(`${endDateParam}T23:59:59.999`)
    if (s > e) {
      const temp = s
      s = new Date(`${endDateParam}T00:00:00`)
      e = new Date(`${startDateParam}T23:59:59.999`)
    }
    range = { start: s, end: e }
  } else if (startDateParam) {
    const s = new Date(`${startDateParam}T00:00:00`)
    const e = new Date(s)
    e.setDate(e.getDate() + 6)
    e.setHours(23, 59, 59, 999)
    range = { start: s, end: e }
  }

  const outletParam = typeof sp?.outletId === "string" ? sp.outletId : undefined
  
  const data = await getReportData("weekly", date, range, outletParam)

  return (
    <React.Suspense fallback={<div className="p-10 text-center text-sm text-gray-500">Memuat laporan mingguan...</div>}>
      <ReportView title="Laporan Mingguan" data={data} type="weekly" />
    </React.Suspense>
  )
}
