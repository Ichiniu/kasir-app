'use client'


import { SessionGuard } from './SessionGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionGuard>
        {children}
      </SessionGuard>
    </>
  )
}
