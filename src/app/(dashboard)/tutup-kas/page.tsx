import React from "react"
import { TutupKasForm } from "./TutupKasForm"
import { getActiveRegister } from "./actions"

export default async function TutupKasPage() {
  const activeRegister = await getActiveRegister()

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <TutupKasForm activeRegister={activeRegister} />
    </div>
  )
}
