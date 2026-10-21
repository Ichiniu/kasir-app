import { getTabletCashier, tabletApiError } from "@/lib/tablet-api"

export async function GET() {
  try {
    const { user, outletId } = await getTabletCashier()
    return Response.json({ id: user.id, name: user.name, email: user.email, outletId })
  } catch (error) {
    return tabletApiError(error)
  }
}
