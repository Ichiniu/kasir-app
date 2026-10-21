import { getActiveRegister } from "@/app/(dashboard)/tutup-kas/actions"
import { openCashRegister } from "@/app/(dashboard)/buka-kas/actions"
import { getTabletCashier, tabletApiError } from "@/lib/tablet-api"
import { z } from "zod"

const input = z.object({ openingBalance: z.number().finite().nonnegative(), notes: z.string().max(1000).optional() })

export async function GET() {
  try {
    await getTabletCashier()
    return Response.json(await getActiveRegister())
  } catch (error) {
    return tabletApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await getTabletCashier()
    const parsed = input.safeParse(await request.json())
    if (!parsed.success) return Response.json({ error: "Data buka kas tidak valid" }, { status: 400 })
    const { openingBalance, notes } = parsed.data
    return Response.json(await openCashRegister(openingBalance, notes))
  } catch (error) {
    return tabletApiError(error)
  }
}
