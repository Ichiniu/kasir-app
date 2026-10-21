import { createTransaction } from "@/app/(dashboard)/kasir/actions"
import { getTabletCashier, tabletApiError } from "@/lib/tablet-api"

export async function POST(request: Request) {
  try {
    await getTabletCashier()
    const result = await createTransaction(await request.json())
    return Response.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    return tabletApiError(error)
  }
}
