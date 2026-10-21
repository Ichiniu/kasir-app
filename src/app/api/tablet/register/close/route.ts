import { closeCashRegister } from "@/app/(dashboard)/tutup-kas/actions"
import { getTabletCashier, tabletApiError } from "@/lib/tablet-api"
import { z } from "zod"

const input = z.object({ actualCash: z.number().finite().nonnegative(), notes: z.string().max(1000).optional() })

export async function POST(request: Request) {
  try {
    await getTabletCashier()
    const parsed = input.safeParse(await request.json())
    if (!parsed.success) return Response.json({ error: "Data tutup kas tidak valid" }, { status: 400 })
    const { actualCash, notes } = parsed.data
    return Response.json(await closeCashRegister(actualCash, notes))
  } catch (error) {
    return tabletApiError(error)
  }
}
