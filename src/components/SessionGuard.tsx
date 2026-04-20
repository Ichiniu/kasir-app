"use client"

import { signIn, signOut, useSession } from "@/lib/auth-client"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const currentUserId = useRef<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Jika user sudah login, catat user ID saat ini
    if (session?.user?.id) {
      if (currentUserId.current && currentUserId.current !== session.user.id) {
        // Jika user ID berubah (misal login akun lain di tab sebelah), reload halaman
        window.location.reload()
      }
      currentUserId.current = session.user.id
    }

    // Jika user logout di tab sebelah, redirect ke login
    if (!isPending && !session && currentUserId.current !== null) {
      router.push("/login")
      currentUserId.current = null
    }
  }, [session, isPending, router])

  return <>{children}</>
}
