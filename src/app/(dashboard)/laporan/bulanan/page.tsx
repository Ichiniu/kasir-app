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
  const date = dateParam ? new Date(dateParam) : new Date()

  const data = await getReportData("monthly", date)

  return <ReportView title="Laporan Bulanan" data={data} type="monthly" />
}
