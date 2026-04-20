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
  
  const date = dateParam ? new Date(dateParam) : new Date()
  
  // If custom range is provided, use it
  const range = (startDateParam && endDateParam) ? {
    start: new Date(startDateParam),
    end: new Date(endDateParam)
  } : undefined

  const data = await getReportData("weekly", date, range)

  return <ReportView title="Laporan Mingguan" data={data} type="weekly" />
}
