import { prisma } from "@/lib/prisma"
import { getTabletCashier, tabletApiError } from "@/lib/tablet-api"

export async function GET() {
  try {
    const { outletId } = await getTabletCashier()
    const products = await prisma.product.findMany({
      where: { outletId: outletId!, isActive: true },
      select: { id: true, name: true, sku: true, price: true, stock: true, unit: true },
      orderBy: { name: "asc" },
    })
    return Response.json(products.map(product => ({ ...product, price: Number(product.price) })))
  } catch (error) {
    return tabletApiError(error)
  }
}
