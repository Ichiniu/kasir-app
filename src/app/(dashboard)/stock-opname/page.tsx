import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { StockOpnameWorkspace } from "./StockOpnameWorkspace"

export const dynamic = "force-dynamic"

export default async function StockOpnamePage() {
  let user
  try {
    user = await getSessionUser()
  } catch {
    redirect("/login")
  }

  const canOperate = Boolean(user.outletId)
  const outletWhere = user.outletId ? { outletId: user.outletId } : undefined
  const [materials, fields, stocktakes, requests] = canOperate
    ? await Promise.all([
        prisma.rawMaterial.findMany({ where: outletWhere, orderBy: { name: "asc" } }),
        prisma.stocktakeField.findMany({ where: outletWhere, orderBy: [{ isActive: "desc" }, { position: "asc" }] }),
        prisma.inventoryStocktake.findMany({
          where: outletWhere,
          include: {
            createdBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
            lines: { include: { rawMaterial: { select: { id: true, name: true, unit: true } } } },
          },
          orderBy: [{ date: "desc" }, { shift: "asc" }],
          take: 40,
        }),
        prisma.materialRequest.findMany({
          where: outletWhere,
          include: {
            createdBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
            lines: { include: { rawMaterial: { select: { id: true, name: true, unit: true } } } },
          },
          orderBy: { forDate: "desc" },
          take: 40,
        }),
      ])
    : [[], [], [], []]

  const todayParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date()).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  )
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`
  const serializedMaterials = materials.map((material) => ({
    id: material.id,
    name: material.name,
    unit: material.unit,
    currentStock: material.currentStock.toString(),
    isActive: material.isActive,
  }))
  const serializedFields = fields.map((field) => ({
    id: field.id,
    key: field.key,
    label: field.label,
    type: field.type,
    position: field.position,
    isCore: field.isCore,
    isActive: field.isActive,
  }))
  const serializedStocktakes = stocktakes.map((stocktake) => ({
    id: stocktake.id,
    date: stocktake.date.toISOString().slice(0, 10),
    shift: stocktake.shift,
    status: stocktake.status,
    notes: stocktake.notes,
    reviewNotes: stocktake.reviewNotes,
    fields: Array.isArray(stocktake.fieldsSnapshot) ? stocktake.fieldsSnapshot : [],
    createdByName: stocktake.createdBy.name,
    reviewedByName: stocktake.reviewedBy?.name ?? null,
    submittedAt: stocktake.submittedAt.toISOString(),
    reviewedAt: stocktake.reviewedAt?.toISOString() ?? null,
    lines: stocktake.lines.map((line) => ({
      rawMaterialId: line.rawMaterialId,
      name: line.rawMaterial.name,
      unit: line.rawMaterial.unit,
      openingStock: line.openingStock.toString(),
      incoming: line.incoming.toString(),
      outgoing: line.outgoing.toString(),
      endingStock: line.endingStock.toString(),
      physicalStock: line.physicalStock.toString(),
      notes: line.notes,
      extraValues: line.extraValues && typeof line.extraValues === "object" && !Array.isArray(line.extraValues)
        ? Object.fromEntries(Object.entries(line.extraValues).map(([key, value]) => [key, value == null ? "" : String(value)]))
        : {},
    })),
  }))
  const serializedRequests = requests.map((request) => ({
    id: request.id,
    forDate: request.forDate.toISOString().slice(0, 10),
    status: request.status,
    notes: request.notes,
    reviewNotes: request.reviewNotes,
    createdByName: request.createdBy.name,
    reviewedByName: request.reviewedBy?.name ?? null,
    submittedAt: request.submittedAt?.toISOString() ?? null,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    lines: request.lines.map((line) => ({
      rawMaterialId: line.rawMaterialId,
      name: line.rawMaterial.name,
      unit: line.rawMaterial.unit,
      requestedAmount: line.requestedAmount.toString(),
      notes: line.notes,
    })),
  }))

  return (
    <div className="min-h-screen bg-[#f8fafc] p-5 md:p-8">
      <StockOpnameWorkspace
        materials={serializedMaterials}
        fields={serializedFields}
        stocktakes={serializedStocktakes}
        requests={serializedRequests}
        today={today}
        role={user.role}
        outletRequired={!canOperate}
      />
    </div>
  )
}
