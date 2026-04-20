import React from "react"
import { BukaKasForm } from "./BukaKasForm"
import { checkCashRegister } from "./actions"

export default async function BukaKasPage() {
  const { hasActiveRegister } = await checkCashRegister()

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <BukaKasForm hasActive={hasActiveRegister} />
    </div>
  )
}
