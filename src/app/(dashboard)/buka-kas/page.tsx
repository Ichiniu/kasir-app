import React from "react"
import { BukaKasForm } from "./BukaKasForm"
import { checkCashRegister } from "./actions"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function BukaKasPage() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const { hasActiveRegister } = await checkCashRegister()
  const isReadOnly = sessionUser?.role === "ADMIN"

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <BukaKasForm hasActive={hasActiveRegister} isReadOnly={isReadOnly} />
    </div>
  )
}
