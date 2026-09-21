import React from "react"
import { TutupKasForm } from "./TutupKasForm"
import { getActiveRegister } from "./actions"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function TutupKasPage() {
  let sessionUser;
  try {
    sessionUser = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const activeRegister = await getActiveRegister()
  const isReadOnly = sessionUser?.role === "ADMIN"

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <TutupKasForm activeRegister={activeRegister} isReadOnly={isReadOnly} />
    </div>
  )
}
