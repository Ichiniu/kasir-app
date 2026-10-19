"use server"

import { Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { createLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"

const route = "/stock-opname"

async function requireOutletUser(adminOnly = false) {
  const user = await getSessionUser()
  if (!user.outletId) throw new Error("Akun harus terhubung ke outlet untuk menjalankan operasional bahan baku")
  if (adminOnly && user.role !== "ADMIN" && user.role !== "SUPERADMIN") throw new Error("Akses ditolak: hanya Admin yang dapat mengelola master dan persetujuan")
  if (!adminOnly && user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "CASHIER") throw new Error("Akses ditolak")
  return user
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Tanggal tidak valid")
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Tanggal tidak valid")
  return date
}

function getTodayDateString() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

function parseAmount(value: string | number, label: string, allowZero = true) {
  const raw = String(value).trim()
  if (!/^\d+(?:\.\d{1,3})?$/.test(raw)) throw new Error(`${label} harus berupa angka maksimal 3 desimal dan tidak boleh negatif`)
  const amount = new Prisma.Decimal(raw)
  if ((!allowZero && amount.lte(0)) || amount.lt(0)) throw new Error(`${label} harus lebih dari 0`)
  return amount
}

type CountLineInput = { rawMaterialId: string; incoming?: string; outgoing?: string; physicalStock: string; notes?: string; extraValues?: Record<string, string> }
type RequestLineInput = { rawMaterialId: string; requestedAmount: string; notes?: string }

function sanitizeExtraValues(values: Record<string, string> | undefined, fields: { id: string; type: "TEXT" | "NUMBER" }[]) {
  const result: Record<string, string | null> = {}
  for (const field of fields) {
    const raw = values?.[field.id]?.trim() ?? ""
    if (field.type === "NUMBER" && raw && !/^\d+(?:\.\d{1,3})?$/.test(raw)) throw new Error("Nilai kolom tambahan harus angka maksimal 3 desimal")
    result[field.id] = raw || null
  }
  return result
}

export async function createRawMaterial(input: { name: string; unit: string; openingStock: string }) {
  const user = await requireOutletUser(true)
  const name = input.name.trim()
  const unit = input.unit.trim()
  if (!name || name.length > 100) throw new Error("Nama bahan wajib diisi (maksimal 100 karakter)")
  if (!unit || unit.length > 30) throw new Error("Satuan wajib diisi (maksimal 30 karakter)")
  const openingStock = parseAmount(input.openingStock, "Stok awal")

  const material = await prisma.rawMaterial.create({
    data: { outletId: user.outletId!, name, unit, currentStock: openingStock },
  })
  await createLog("CREATE_RAW_MATERIAL", "RAW_MATERIAL", material.id, `Menambah bahan baku ${material.name} (${material.currentStock.toString()} ${material.unit})`, null, material, user.outletId)
  revalidatePath(route)
  return { success: true }
}

export async function toggleRawMaterial(id: string, isActive: boolean) {
  const user = await requireOutletUser(true)
  const material = await prisma.rawMaterial.findFirst({ where: { id, outletId: user.outletId! } })
  if (!material) throw new Error("Bahan baku tidak ditemukan")
  await prisma.rawMaterial.update({ where: { id }, data: { isActive } })
  revalidatePath(route)
  return { success: true }
}

export async function createStocktakeField(input: { label: string; type: "TEXT" | "NUMBER" }) {
  const user = await requireOutletUser(true)
  const label = input.label.trim()
  if (!label || label.length > 50) throw new Error("Nama kolom wajib diisi (maksimal 50 karakter)")
  if (input.type !== "TEXT" && input.type !== "NUMBER") throw new Error("Tipe kolom tidak valid")
  const last = await prisma.stocktakeField.findFirst({ where: { outletId: user.outletId!, isActive: true }, orderBy: { position: "desc" } })
  const field = await prisma.stocktakeField.create({ data: { outletId: user.outletId!, key: `CUSTOM_${randomUUID()}`, label, type: input.type, position: (last?.position ?? -1) + 1 } })
  revalidatePath(route)
  return { success: true, id: field.id }
}

export async function updateStocktakeField(input: { id: string; label: string; type: "TEXT" | "NUMBER"; position: number }) {
  const user = await requireOutletUser(true)
  const label = input.label.trim()
  if (!label || label.length > 50) throw new Error("Nama kolom wajib diisi (maksimal 50 karakter)")
  if (input.type !== "TEXT" && input.type !== "NUMBER") throw new Error("Tipe kolom tidak valid")
  const field = await prisma.stocktakeField.findFirst({ where: { id: input.id, outletId: user.outletId!, isActive: true } })
  if (!field) throw new Error("Kolom tidak ditemukan")
  if (field.isCore && input.type !== field.type) throw new Error("Tipe kolom inti tidak dapat diubah agar rumus stok tetap konsisten")
  const position = Number.isInteger(input.position) ? Math.max(0, Math.min(50, input.position)) : field.position
  await prisma.stocktakeField.update({ where: { id: field.id }, data: { label, type: input.type, position } })
  revalidatePath(route)
  return { success: true }
}

export async function deleteStocktakeField(id: string) {
  const user = await requireOutletUser(true)
  const field = await prisma.stocktakeField.findFirst({ where: { id, outletId: user.outletId!, isActive: true } })
  if (!field) throw new Error("Kolom tidak ditemukan")
  // Arsip semua kolom supaya data historis dan nilai lama tetap utuh.
  await prisma.stocktakeField.update({ where: { id }, data: { isActive: false } })
  revalidatePath(route)
  return { success: true }
}

export async function restoreStocktakeField(id: string) {
  const user = await requireOutletUser(true)
  const field = await prisma.stocktakeField.findFirst({ where: { id, outletId: user.outletId!, isActive: false } })
  if (!field) throw new Error("Kolom arsip tidak ditemukan")
  const last = await prisma.stocktakeField.findFirst({ where: { outletId: user.outletId!, isActive: true }, orderBy: { position: "desc" } })
  await prisma.stocktakeField.update({ where: { id }, data: { isActive: true, position: (last?.position ?? -1) + 1 } })
  revalidatePath(route)
  return { success: true }
}

export async function submitStocktake(input: { date: string; shift: "MORNING" | "AFTERNOON"; notes?: string; lines: CountLineInput[] }) {
  const user = await requireOutletUser()
  if (input.shift !== "MORNING" && input.shift !== "AFTERNOON") throw new Error("Shift tidak valid")
  const todayStr = getTodayDateString()
  if (input.date < todayStr) {
    throw new Error("Tanggal opname minimal hari ini")
  }
  const date = parseDate(input.date)
  const materials = await prisma.rawMaterial.findMany({ where: { outletId: user.outletId!, isActive: true }, orderBy: { name: "asc" } })
  if (!materials.length) throw new Error("Tambahkan bahan baku aktif terlebih dahulu")
  if (input.lines.length !== materials.length || new Set(input.lines.map((line) => line.rawMaterialId)).size !== materials.length) {
    throw new Error("Hitung semua bahan baku aktif sebelum mengirim hasil opname")
  }
  const fields = await prisma.stocktakeField.findMany({ where: { outletId: user.outletId!, isActive: true }, orderBy: { position: "asc" } })
  const earlierWhere = input.shift === "AFTERNOON"
    ? { outletId: user.outletId!, status: "APPROVED" as const, OR: [{ date: { lt: date } }, { date, shift: "MORNING" as const }] }
    : { outletId: user.outletId!, status: "APPROVED" as const, date: { lt: date } }
  const previous = await prisma.inventoryStocktake.findFirst({ where: earlierWhere, include: { lines: true }, orderBy: [{ date: "desc" }, { submittedAt: "desc" }] })
  const previousByMaterial = new Map(previous?.lines.map((line) => [line.rawMaterialId, line.physicalStock]) ?? [])
  const inputById = new Map(input.lines.map((line) => [line.rawMaterialId, line]))
  const lineData = materials.map((material) => {
    const entry = inputById.get(material.id)
    if (!entry) throw new Error("Daftar bahan berubah. Muat ulang halaman lalu periksa kembali")
    const openingStock = previousByMaterial.get(material.id) ?? material.currentStock
    const incoming = fields.some((field) => field.key === "INCOMING")
      ? parseAmount(entry.incoming ?? "0", `Masuk ${material.name}`)
      : new Prisma.Decimal(0)
    const outgoing = fields.some((field) => field.key === "OUTGOING")
      ? parseAmount(entry.outgoing ?? "0", `Keluar ${material.name}`)
      : new Prisma.Decimal(0)
    if (outgoing.gt(openingStock.plus(incoming))) throw new Error(`Jumlah keluar ${material.name} melebihi stok awal + masuk`)
    const endingStock = openingStock.plus(incoming).minus(outgoing)
    const physicalStock = fields.some((field) => field.key === "PHYSICAL")
      ? parseAmount(entry.physicalStock, `Jumlah fisik ${material.name}`)
      : endingStock
    return {
      rawMaterialId: material.id,
      openingStock,
      incoming,
      outgoing,
      endingStock,
      physicalStock,
      notes: entry.notes?.trim() || null,
      extraValues: sanitizeExtraValues(entry.extraValues, fields),
    }
  })

  const key = { outletId: user.outletId!, date, shift: input.shift }
  const existing = await prisma.inventoryStocktake.findUnique({ where: { outletId_date_shift: key } })
  if (existing && existing.status !== "REJECTED") throw new Error("Opname untuk tanggal dan shift ini sudah dikirim")

  const saved = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.inventoryStocktakeLine.deleteMany({ where: { stocktakeId: existing.id } })
      return tx.inventoryStocktake.update({
        where: { id: existing.id },
        data: {
          status: "SUBMITTED",
          notes: input.notes?.trim() || null,
          reviewNotes: null,
          fieldsSnapshot: fields.map(({ id, label, type, position }) => ({ id, label, type, position })),
          reviewedById: null,
          reviewedAt: null,
          submittedAt: new Date(),
          lines: { create: lineData },
        },
      })
    }
    return tx.inventoryStocktake.create({
      data: {
        ...key,
        status: "SUBMITTED",
        notes: input.notes?.trim() || null,
        createdById: user.userId,
        fieldsSnapshot: fields.map(({ id, label, type, position }) => ({ id, label, type, position })),
        lines: { create: lineData },
      },
    })
  })

  await createLog("SUBMIT_STOCKTAKE", "INVENTORY_STOCKTAKE", saved.id, `Mengirim opname shift ${input.shift} untuk persetujuan`, null, { date: input.date, shift: input.shift }, user.outletId)
  revalidatePath(route)
  return { success: true }
}

export async function reviewStocktake(input: { id: string; decision: "APPROVE" | "REJECT"; notes?: string }) {
  const user = await requireOutletUser(true)
  const notes = input.notes?.trim() || null
  if (input.decision === "REJECT" && !notes) throw new Error("Catatan penolakan wajib diisi")

  if (input.decision === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.inventoryStocktake.updateMany({
        where: { id: input.id, outletId: user.outletId!, status: "SUBMITTED" },
        data: { status: "APPROVED", reviewedById: user.userId, reviewedAt: new Date(), reviewNotes: notes },
      })
      if (claimed.count !== 1) throw new Error("Opname tidak ditemukan atau sudah ditinjau")
      const stocktake = await tx.inventoryStocktake.findUnique({ where: { id: input.id }, include: { lines: true } })
      if (!stocktake) throw new Error("Data opname tidak ditemukan")
      const newerApproved = await tx.inventoryStocktake.findFirst({
        where: {
          outletId: user.outletId!,
          status: "APPROVED",
          OR: [{ date: { gt: stocktake.date } }, ...(stocktake.shift === "MORNING" ? [{ date: stocktake.date, shift: "AFTERNOON" as const }] : [])],
        },
        select: { id: true },
      })
      if (newerApproved) return
      for (const line of stocktake.lines) {
        const result = await tx.rawMaterial.updateMany({
          where: { id: line.rawMaterialId, outletId: user.outletId! },
          data: { currentStock: line.physicalStock },
        })
        if (result.count !== 1) throw new Error("Bahan baku tidak ditemukan pada outlet ini")
      }
    })
  } else {
    const result = await prisma.inventoryStocktake.updateMany({
      where: { id: input.id, outletId: user.outletId!, status: "SUBMITTED" },
      data: { status: "REJECTED", reviewedById: user.userId, reviewedAt: new Date(), reviewNotes: notes },
    })
    if (result.count !== 1) throw new Error("Opname tidak ditemukan atau sudah ditinjau")
  }
  await createLog(input.decision === "APPROVE" ? "APPROVE_STOCKTAKE" : "REJECT_STOCKTAKE", "INVENTORY_STOCKTAKE", input.id, `Meninjau hasil opname: ${input.decision}`, null, { notes }, user.outletId)
  revalidatePath(route)
  return { success: true }
}

export async function saveMaterialRequest(input: { forDate: string; notes?: string; submit: boolean; lines: RequestLineInput[] }) {
  const user = await requireOutletUser()
  const forDate = parseDate(input.forDate)
  const [year, month, day] = getTodayDateString().split("-").map(Number)
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1))
  if (forDate.getTime() < tomorrow.getTime()) {
    throw new Error("Permintaan harus ditujukan untuk besok atau tanggal setelahnya")
  }
  const lines = input.lines
    .map((line) => ({ ...line, requestedAmount: String(line.requestedAmount).trim() }))
    .filter((line) => line.requestedAmount !== "" && line.requestedAmount !== "0" && line.requestedAmount !== "0.000")
  if (!lines.length) throw new Error("Isi jumlah setidaknya satu bahan yang dibutuhkan")
  if (new Set(lines.map((line) => line.rawMaterialId)).size !== lines.length) throw new Error("Bahan yang sama tidak boleh diduplikasi")
  const amountById = new Map(lines.map((line) => [line.rawMaterialId, {
    requestedAmount: parseAmount(line.requestedAmount, "Jumlah permintaan", false),
    notes: line.notes?.trim() || null,
  }]))
  const materials = await prisma.rawMaterial.findMany({ where: { outletId: user.outletId!, isActive: true, id: { in: [...amountById.keys()] } } })
  if (materials.length !== amountById.size) throw new Error("Salah satu bahan tidak aktif atau bukan milik outlet ini")
  const lineData = materials.map((material) => ({ rawMaterialId: material.id, ...amountById.get(material.id)! }))
  const key = { outletId: user.outletId!, forDate }
  const existing = await prisma.materialRequest.findUnique({ where: { outletId_forDate: key } })
  if (existing && existing.status !== "DRAFT" && existing.status !== "REJECTED") throw new Error("Permintaan tanggal ini sudah dikirim dan tidak dapat diubah")

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.materialRequestLine.deleteMany({ where: { requestId: existing.id } })
      await tx.materialRequest.update({
        where: { id: existing.id },
        data: {
          status: input.submit ? "SUBMITTED" : "DRAFT",
          notes: input.notes?.trim() || null,
          reviewNotes: null,
          reviewedById: null,
          reviewedAt: null,
          submittedAt: input.submit ? new Date() : null,
          lines: { create: lineData },
        },
      })
    } else {
      await tx.materialRequest.create({
        data: {
          ...key,
          status: input.submit ? "SUBMITTED" : "DRAFT",
          notes: input.notes?.trim() || null,
          createdById: user.userId,
          submittedAt: input.submit ? new Date() : null,
          lines: { create: lineData },
        },
      })
    }
  })
  revalidatePath(route)
  return { success: true }
}

export async function reviewMaterialRequest(input: { id: string; decision: "APPROVE" | "REJECT"; notes?: string }) {
  const user = await requireOutletUser(true)
  const notes = input.notes?.trim() || null
  if (input.decision === "REJECT" && !notes) throw new Error("Catatan penolakan wajib diisi")
  const result = await prisma.materialRequest.updateMany({
    where: { id: input.id, outletId: user.outletId!, status: "SUBMITTED" },
    data: {
      status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedById: user.userId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  })
  if (result.count !== 1) throw new Error("Permintaan tidak ditemukan atau sudah ditinjau")
  await createLog(input.decision === "APPROVE" ? "APPROVE_MATERIAL_REQUEST" : "REJECT_MATERIAL_REQUEST", "MATERIAL_REQUEST", input.id, `Meninjau permintaan bahan: ${input.decision}`, null, { notes }, user.outletId)
  revalidatePath(route)
  return { success: true }
}
