"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Check, ClipboardCheck, ClipboardList, Edit2, Filter, History, PackagePlus, Plus, RotateCcw, Save, ShieldCheck, ShoppingBasket, Trash2, X } from "lucide-react"
import {
  createRawMaterial,
  createStocktakeField,
  deleteStocktakeField,
  reviewMaterialRequest,
  reviewStocktake,
  restoreStocktakeField,
  saveMaterialRequest,
  submitStocktake,
  toggleRawMaterial,
  updateStocktakeField,
} from "./actions"

type Material = { id: string; name: string; unit: string; currentStock: string; isActive: boolean }
type Field = { id: string; key: string; label: string; type: "TEXT" | "NUMBER"; position: number; isCore: boolean; isActive: boolean }
type CountEntry = { incoming: string; outgoing: string; physicalStock: string; notes: string; extraValues: Record<string, string> }
type CountLine = { rawMaterialId: string; name: string; unit: string; openingStock: string; incoming: string; outgoing: string; endingStock: string; physicalStock: string; notes: string | null; extraValues: Record<string, string> }
type Stocktake = { id: string; date: string; shift: "MORNING" | "AFTERNOON"; status: string; notes: string | null; reviewNotes: string | null; createdByName: string; reviewedByName: string | null; submittedAt: string; reviewedAt: string | null; fields: unknown; lines: CountLine[] }
type RequestLine = { rawMaterialId: string; name: string; unit: string; requestedAmount: string; notes: string | null }
type MaterialRequest = { id: string; forDate: string; status: string; notes: string | null; reviewNotes: string | null; createdByName: string; reviewedByName: string | null; submittedAt: string | null; reviewedAt: string | null; lines: RequestLine[] }
type View = "opname" | "permintaan" | "master" | "riwayat"
type Shift = "MORNING" | "AFTERNOON"

const statusLabel: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Menunggu Admin", APPROVED: "Disetujui", REJECTED: "Perlu diperbaiki" }

export function StockOpnameWorkspace({
  materials,
  fields,
  stocktakes,
  requests,
  today,
  role,
  outletRequired,
}: {
  materials: Material[]
  fields: Field[]
  stocktakes: Stocktake[]
  requests: MaterialRequest[]
  today: string
  role: string
  outletRequired: boolean
}) {
  const router = useRouter()
  const [view, setView] = useState<View>("opname")
  const [shift, setShift] = useState<Shift>("MORNING")
  const [stocktakeDate, setStocktakeDate] = useState(today)
  const [requestDate, setRequestDate] = useState(nextDate(today))
  const [countEntries, setCountEntries] = useState<Record<string, CountEntry>>({})
  const [requestEntries, setRequestEntries] = useState<Record<string, { amount: string; notes: string }>>({})
  const [stocktakeNotes, setStocktakeNotes] = useState("")
  const [requestNotes, setRequestNotes] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: "", unit: "Kg", openingStock: "0" })
  const [newField, setNewField] = useState({ label: "", type: "TEXT" as "TEXT" | "NUMBER" })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldDraft, setFieldDraft] = useState({ label: "", type: "TEXT" as "TEXT" | "NUMBER", position: 0 })

  const canManage = role === "ADMIN" || role === "SUPERADMIN"
  const activeMaterials = useMemo(() => materials.filter((material) => material.isActive), [materials])
  const allFields = useMemo(() => [...fields].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.position - b.position), [fields])
  const orderedFields = useMemo(() => allFields.filter((field) => field.isActive), [allFields])
  const currentStocktake = stocktakes.find((item) => item.date === stocktakeDate && item.shift === shift)
  const editableStocktake = !currentStocktake || currentStocktake.status === "REJECTED"
  const currentRequest = requests.find((item) => item.forDate === requestDate)
  const editableRequest = !currentRequest || currentRequest.status === "DRAFT" || currentRequest.status === "REJECTED"

  const [stocktakeColumnFilters, setStocktakeColumnFilters] = useState<Record<string, string>>({})
  const [requestColumnFilters, setRequestColumnFilters] = useState<Record<string, string>>({})

  const previousApprovedLines = useMemo(() => {
    const latest = [...stocktakes]
      .filter((item) => item.status === "APPROVED" && (item.date < stocktakeDate || (shift === "AFTERNOON" && item.date === stocktakeDate && item.shift === "MORNING")))
      .sort((a, b) => b.date.localeCompare(a.date) || b.submittedAt.localeCompare(a.submittedAt))[0]
    return new Map(latest?.lines.map((line) => [line.rawMaterialId, line]) ?? [])
  }, [stocktakes, stocktakeDate, shift])

  const hasActiveStocktakeFilter = useMemo(() => {
    return Object.values(stocktakeColumnFilters).some((val) => val.trim() !== "")
  }, [stocktakeColumnFilters])

  const filteredStocktakeMaterials = useMemo(() => {
    if (!hasActiveStocktakeFilter) return activeMaterials

    return activeMaterials.filter((material, originalIndex) => {
      const entry = countEntries[material.id] ?? { incoming: "0", outgoing: "0", physicalStock: "", notes: "", extraValues: {} }
      const currentStocktakeLine = currentStocktake?.lines.find((line) => line.rawMaterialId === material.id)
      const prevLine = previousApprovedLines.get(material.id)
      const opening = currentStocktake?.status !== "REJECTED" && currentStocktakeLine
        ? currentStocktakeLine.openingStock
        : prevLine?.physicalStock ?? material.currentStock
      const ending = number(opening) + number(entry.incoming) - number(entry.outgoing)

      const noFilter = stocktakeColumnFilters["_no"]?.trim().toLowerCase()
      if (noFilter) {
        const matchNo = String(originalIndex + 1).includes(noFilter)
        const matchName = material.name.toLowerCase().includes(noFilter)
        if (!matchNo && !matchName) return false
      }

      for (const field of orderedFields) {
        const filterVal = stocktakeColumnFilters[field.id]?.trim().toLowerCase()
        if (!filterVal) continue

        let cellValue = ""
        if (field.key === "ITEM") {
          cellValue = `${material.name} ${material.unit}`
        } else if (field.key === "OPENING") {
          cellValue = formatQuantity(number(opening))
        } else if (field.key === "INCOMING") {
          cellValue = entry.incoming ?? "0"
        } else if (field.key === "OUTGOING") {
          cellValue = entry.outgoing ?? "0"
        } else if (field.key === "ENDING") {
          cellValue = formatQuantity(ending)
        } else if (field.key === "PHYSICAL") {
          cellValue = entry.physicalStock ?? ""
        } else if (field.key === "NOTES") {
          cellValue = entry.notes ?? ""
        } else {
          cellValue = entry.extraValues[field.id] ?? ""
        }

        if (!cellValue.toLowerCase().includes(filterVal)) {
          return false
        }
      }

      return true
    })
  }, [activeMaterials, countEntries, currentStocktake, hasActiveStocktakeFilter, orderedFields, previousApprovedLines, stocktakeColumnFilters])

  const hasActiveRequestFilter = useMemo(() => {
    return Object.values(requestColumnFilters).some((val) => val.trim() !== "")
  }, [requestColumnFilters])

  const filteredRequestMaterials = useMemo(() => {
    if (!hasActiveRequestFilter) return activeMaterials

    return activeMaterials.filter((material) => {
      const entry = requestEntries[material.id] ?? { amount: "", notes: "" }
      
      const itemFilter = requestColumnFilters["item"]?.trim().toLowerCase()
      if (itemFilter && !`${material.name} ${material.unit}`.toLowerCase().includes(itemFilter)) {
        return false
      }

      const stockFilter = requestColumnFilters["stock"]?.trim().toLowerCase()
      if (stockFilter && !`${formatQuantity(number(material.currentStock))} ${material.unit}`.toLowerCase().includes(stockFilter)) {
        return false
      }

      const amountFilter = requestColumnFilters["amount"]?.trim().toLowerCase()
      if (amountFilter && !(entry.amount ?? "").toLowerCase().includes(amountFilter)) {
        return false
      }

      const notesFilter = requestColumnFilters["notes"]?.trim().toLowerCase()
      if (notesFilter && !(entry.notes ?? "").toLowerCase().includes(notesFilter)) {
        return false
      }

      return true
    })
  }, [activeMaterials, hasActiveRequestFilter, requestColumnFilters, requestEntries])


  useEffect(() => {
    const existingLines = new Map(currentStocktake?.lines.map((line) => [line.rawMaterialId, line]) ?? [])
    const initial: Record<string, CountEntry> = {}
    for (const material of activeMaterials) {
      const line = existingLines.get(material.id)
      const extraValues = Object.fromEntries(orderedFields.filter((field) => !field.isCore).map((field) => [field.id, String(line?.extraValues?.[field.id] ?? "")]))
      initial[material.id] = {
        incoming: line?.incoming ?? "0",
        outgoing: line?.outgoing ?? "0",
        physicalStock: line?.physicalStock ?? "",
        notes: line?.notes ?? "",
        extraValues,
      }
    }
    setCountEntries(initial)
    setStocktakeNotes(currentStocktake?.notes ?? "")
  }, [activeMaterials, currentStocktake, orderedFields, shift, stocktakeDate, stocktakes])

  useEffect(() => {
    const existing = new Map(currentRequest?.lines.map((line) => [line.rawMaterialId, line]) ?? [])
    const initial: Record<string, { amount: string; notes: string }> = {}
    for (const material of activeMaterials) {
      const line = existing.get(material.id)
      initial[material.id] = { amount: line?.requestedAmount ?? "", notes: line?.notes ?? "" }
    }
    setRequestEntries(initial)
    setRequestNotes(currentRequest?.notes ?? "")
  }, [activeMaterials, currentRequest, requestDate])

  const updateCount = (id: string, key: keyof CountEntry, value: string, fieldId?: string) => {
    setCountEntries((previous) => {
      const current = previous[id] ?? { incoming: "0", outgoing: "0", physicalStock: "", notes: "", extraValues: {} }
      if (key === "extraValues" && fieldId) return { ...previous, [id]: { ...current, extraValues: { ...current.extraValues, [fieldId]: value } } }
      return { ...previous, [id]: { ...current, [key]: value } }
    })
  }

  const changeStocktake = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (stocktakeDate < today) {
      setError("Tanggal opname minimal hari ini.")
      return
    }
    if (orderedFields.some((field) => field.key === "PHYSICAL") && activeMaterials.some((item) => !countEntries[item.id]?.physicalStock.trim())) {
      setError("Isi hitung fisik untuk setiap bahan aktif, termasuk yang stoknya nol.")
      return
    }
    setBusy(true)
    try {
      await submitStocktake({
        date: stocktakeDate,
        shift,
        notes: stocktakeNotes,
        lines: activeMaterials.map((item) => ({ rawMaterialId: item.id, ...countEntries[item.id] })),
      })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal mengirim opname"))
    } finally {
      setBusy(false)
    }
  }

  const persistRequest = async (submit: boolean) => {
    setError("")
    setBusy(true)
    try {
      await saveMaterialRequest({
        forDate: requestDate,
        submit,
        notes: requestNotes,
        lines: activeMaterials.map((item) => ({ rawMaterialId: item.id, requestedAmount: requestEntries[item.id]?.amount ?? "", notes: requestEntries[item.id]?.notes ?? "" })),
      })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal menyimpan permintaan"))
    } finally {
      setBusy(false)
    }
  }

  const reviewTake = async (item: Stocktake, decision: "APPROVE" | "REJECT") => {
    const notes = decision === "REJECT" ? window.prompt("Alasan penolakan (wajib diisi):")?.trim() : undefined
    if (notes === null || (decision === "REJECT" && !notes)) return
    setError("")
    setBusy(true)
    try {
      await reviewStocktake({ id: item.id, decision, notes })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal meninjau hasil opname"))
    } finally {
      setBusy(false)
    }
  }

  const reviewRequest = async (item: MaterialRequest, decision: "APPROVE" | "REJECT") => {
    const notes = decision === "REJECT" ? window.prompt("Alasan penolakan (wajib diisi):")?.trim() : undefined
    if (notes === null || (decision === "REJECT" && !notes)) return
    setError("")
    setBusy(true)
    try {
      await reviewMaterialRequest({ id: item.id, decision, notes })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal meninjau permintaan"))
    } finally {
      setBusy(false)
    }
  }

  const addMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      await createRawMaterial(newMaterial)
      setNewMaterial({ name: "", unit: "Kg", openingStock: "0" })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal menambahkan bahan"))
    } finally {
      setBusy(false)
    }
  }

  const addField = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      await createStocktakeField(newField)
      setNewField({ label: "", type: "TEXT" })
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal menambahkan kolom"))
    } finally {
      setBusy(false)
    }
  }

  const saveField = async (field: Field) => {
    setError("")
    setBusy(true)
    try {
      await updateStocktakeField({ id: field.id, ...fieldDraft })
      setEditingField(null)
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal memperbarui kolom"))
    } finally {
      setBusy(false)
    }
  }

  const removeField = async (field: Field) => {
    if (!confirm(`Hapus kolom “${field.label}” dari lembar aktif? Data historis tetap disimpan dan kolom dapat dipulihkan.`)) return
    setError("")
    setBusy(true)
    try {
      await deleteStocktakeField(field.id)
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal menghapus kolom"))
    } finally {
      setBusy(false)
    }
  }

  const restoreField = async (field: Field) => {
    setError("")
    setBusy(true)
    try {
      await restoreStocktakeField(field.id)
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal memulihkan kolom"))
    } finally {
      setBusy(false)
    }
  }

  const setMaterialActive = async (material: Material) => {
    setError("")
    setBusy(true)
    try {
      await toggleRawMaterial(material.id, !material.isActive)
      router.refresh()
    } catch (cause) {
      setError(messageOf(cause, "Gagal memperbarui bahan"))
    } finally {
      setBusy(false)
    }
  }

  const pendingStocktakes = stocktakes.filter((item) => item.status === "SUBMITTED")
  const pendingRequests = requests.filter((item) => item.status === "SUBMITTED")

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 font-sans">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Operasional Dapur</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">Stock Opname Bahan Baku</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">Saldo bergerak dari stok awal + masuk − keluar. Petugas juga mencatat hitung fisik; Admin menyetujui koreksi saldo.</p>
        </div>
        <div className="flex gap-2">
          <Metric label="Bahan aktif" value={String(activeMaterials.length)} />
          <Metric label="Opname menunggu" value={String(pendingStocktakes.length)} />
          <Metric label="Permintaan menunggu" value={String(pendingRequests.length)} />
        </div>
      </header>

      {!outletRequired ? null : <Notice tone="amber">Akun ini belum terhubung ke outlet. Pilih akun operasional/outlet untuk mencatat stok.</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      <nav aria-label="Modul stok dapur" className="flex gap-1 overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white p-1.5">
        <NavButton active={view === "opname"} onClick={() => setView("opname")}><ClipboardCheck size={16} /> Opname Shift</NavButton>
        <NavButton active={view === "permintaan"} onClick={() => setView("permintaan")}><ShoppingBasket size={16} /> Permintaan Besok</NavButton>
        <NavButton active={view === "master"} onClick={() => setView("master")}><PackagePlus size={16} /> Item & Kolom</NavButton>
        <NavButton active={view === "riwayat"} onClick={() => setView("riwayat")}><History size={16} /> Riwayat Stock Opname</NavButton>
      </nav>

      {view === "opname" && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">
                Tanggal
                <input
                  type="date"
                  min={today}
                  value={stocktakeDate}
                  onChange={(event) => {
                    const val = event.target.value
                    setStocktakeDate(val)
                    if (val && val < today) {
                      setError("Tanggal opname minimal hari ini.")
                    } else if (error === "Tanggal opname minimal hari ini.") {
                      setError("")
                    }
                  }}
                  disabled={outletRequired}
                  className="h-10 rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111827]"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Shift<select value={shift} onChange={(event) => setShift(event.target.value as Shift)} disabled={outletRequired} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827]"><option value="MORNING">Pagi</option><option value="AFTERNOON">Sore</option></select></label>
            </div>
            {currentStocktake && <StatusBadge status={currentStocktake.status} />}
          </div>

          {activeMaterials.length === 0 ? (
            <Empty title="Belum ada item bahan baku" body="Admin dapat menambahkan bahan dan satuannya melalui tab Item & Kolom." />
          ) : (
            <form onSubmit={changeStocktake} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
              {currentStocktake?.status === "REJECTED" && <Notice tone="amber">Opname sebelumnya ditolak: {currentStocktake.reviewNotes}. Perbarui hitungan lalu kirim ulang.</Notice>}
              {currentStocktake?.status === "APPROVED" && <Notice tone="green">Disetujui oleh {currentStocktake.reviewedByName || "Admin"}. Stok bahan sudah diperbarui.</Notice>}
              {currentStocktake?.status === "SUBMITTED" && <Notice tone="blue">Menunggu persetujuan Admin. Stok master belum berubah.</Notice>}
              {hasActiveStocktakeFilter && (
                <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-amber-50/70 px-4 py-2 text-xs text-amber-900">
                  <span>
                    Menampilkan <strong>{filteredStocktakeMaterials.length}</strong> dari <strong>{activeMaterials.length}</strong> item bahan
                  </span>
                  <button
                    type="button"
                    onClick={() => setStocktakeColumnFilters({})}
                    className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline text-xs"
                  >
                    <X size={13} /> Reset Filter Kolom
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
                  <thead className="bg-[#f9fafb] text-[10px] uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="w-12 border-b px-3 py-3 text-center">{orderedFields.some((field) => field.key === "ITEM") ? "No" : "No / Item"}</th>
                      {orderedFields.map((field) => <th key={field.id} className="border-b px-3 py-3">{field.label}{field.isCore && <span className="ml-1 text-[#9ca3af]">•</span>}</th>)}
                    </tr>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="px-2 py-2 text-center align-middle">
                        {!orderedFields.some((field) => field.key === "ITEM") ? (
                          <input
                            type="text"
                            placeholder="Filter item..."
                            value={stocktakeColumnFilters["_no"] ?? ""}
                            onChange={(event) =>
                              setStocktakeColumnFilters((prev) => ({
                                ...prev,
                                _no: event.target.value,
                              }))
                            }
                            className="h-8 w-full min-w-28 rounded-md border border-[#e5e7eb] bg-white px-2 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
                          />
                        ) : hasActiveStocktakeFilter ? (
                          <button
                            type="button"
                            onClick={() => setStocktakeColumnFilters({})}
                            title="Reset semua filter kolom"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        ) : (
                          <Filter size={13} className="mx-auto text-[#9ca3af]" />
                        )}
                      </th>
                      {orderedFields.map((field) => (
                        <th key={field.id} className="min-w-32 px-3 py-2 font-normal">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={
                                field.key === "ITEM"
                                  ? "Filter item..."
                                  : field.key === "OPENING"
                                  ? "Filter stok..."
                                  : field.key === "INCOMING"
                                  ? "Filter masuk..."
                                  : field.key === "OUTGOING"
                                  ? "Filter keluar..."
                                  : field.key === "ENDING"
                                  ? "Filter akhir..."
                                  : field.key === "PHYSICAL"
                                  ? "Filter fisik..."
                                  : field.key === "NOTES"
                                  ? "Filter catatan..."
                                  : `Filter ${field.label}...`
                              }
                              value={stocktakeColumnFilters[field.id] ?? ""}
                              onChange={(event) =>
                                setStocktakeColumnFilters((prev) => ({
                                  ...prev,
                                  [field.id]: event.target.value,
                                }))
                              }
                              className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 pr-6 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
                            />
                            {stocktakeColumnFilters[field.id] && (
                              <button
                                type="button"
                                onClick={() =>
                                  setStocktakeColumnFilters((prev) => {
                                    const next = { ...prev }
                                    delete next[field.id]
                                    return next
                                  })
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocktakeMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={orderedFields.length + 1} className="px-4 py-8 text-center text-xs text-[#9ca3af]">
                          Tidak ada item bahan yang sesuai filter.
                          {hasActiveStocktakeFilter && (
                            <button
                              type="button"
                              onClick={() => setStocktakeColumnFilters({})}
                              className="ml-2 font-semibold text-[#FFB800] hover:underline"
                            >
                              Reset Filter
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredStocktakeMaterials.map((material, index) => {
                        const entry = countEntries[material.id] ?? { incoming: "0", outgoing: "0", physicalStock: "", notes: "", extraValues: {} }
                        const currentStocktakeLine = currentStocktake?.lines.find((line) => line.rawMaterialId === material.id)
                        const prevLine = previousApprovedLines.get(material.id)
                        const opening = currentStocktake?.status !== "REJECTED" && currentStocktakeLine
                          ? currentStocktakeLine.openingStock
                          : prevLine?.physicalStock ?? material.currentStock
                        const ending = number(opening) + number(entry.incoming) - number(entry.outgoing)
                        return <tr key={material.id} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="px-3 py-3 text-center text-[#9ca3af]">{orderedFields.some((field) => field.key === "ITEM") ? index + 1 : <><span>{index + 1}</span><span className="mt-1 block font-semibold text-[#111827]">{material.name}</span></>}</td>
                          {orderedFields.map((field) => <td key={field.id} className="min-w-32 px-3 py-2.5">
                            {field.key === "ITEM" ? <div><p className="font-semibold text-[#111827]">{material.name}</p><p className="mt-0.5 text-[10px] text-[#9ca3af]">Satuan: {material.unit}</p></div>
                              : field.key === "OPENING" ? <Quantity>{formatQuantity(number(opening))}</Quantity>
                              : field.key === "INCOMING" ? <input aria-label={`${field.label} ${material.name}`} type="number" min="0" step="0.001" value={entry.incoming} disabled={!editableStocktake || outletRequired} onChange={(event) => updateCount(material.id, "incoming", event.target.value)} className="h-9 w-28 rounded-md border border-[#e5e7eb] px-2 text-right disabled:bg-gray-50" />
                              : field.key === "OUTGOING" ? <input aria-label={`${field.label} ${material.name}`} type="number" min="0" step="0.001" value={entry.outgoing} disabled={!editableStocktake || outletRequired} onChange={(event) => updateCount(material.id, "outgoing", event.target.value)} className="h-9 w-28 rounded-md border border-[#e5e7eb] px-2 text-right disabled:bg-gray-50" />
                              : field.key === "ENDING" ? <Quantity strong>{formatQuantity(ending)}</Quantity>
                              : field.key === "PHYSICAL" ? <input aria-label={`${field.label} ${material.name}`} type="number" min="0" step="0.001" value={entry.physicalStock} disabled={!editableStocktake || outletRequired} onChange={(event) => updateCount(material.id, "physicalStock", event.target.value)} placeholder="Hitung fisik" className="h-9 w-28 rounded-md border border-[#e5e7eb] px-2 text-right disabled:bg-gray-50" />
                              : field.key === "NOTES" ? <input aria-label={`${field.label} ${material.name}`} value={entry.notes} disabled={!editableStocktake || outletRequired} onChange={(event) => updateCount(material.id, "notes", event.target.value)} placeholder="Catatan" className="h-9 w-36 rounded-md border border-[#e5e7eb] px-2 disabled:bg-gray-50" />
                              : <input aria-label={`${field.label} ${material.name}`} type={field.type === "NUMBER" ? "number" : "text"} step={field.type === "NUMBER" ? "0.001" : undefined} value={entry.extraValues[field.id] ?? ""} disabled={!editableStocktake || outletRequired} onChange={(event) => updateCount(material.id, "extraValues", event.target.value, field.id)} className="h-9 w-32 rounded-md border border-[#e5e7eb] px-2 disabled:bg-gray-50" />}
                          </td>)}
                        </tr>
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t bg-[#f9fafb] p-4 sm:flex-row sm:items-end sm:justify-between">
                <label className="grid w-full max-w-xl gap-1 text-xs font-semibold text-[#6b7280]">Catatan shift<textarea value={stocktakeNotes} onChange={(event) => setStocktakeNotes(event.target.value)} disabled={!editableStocktake || outletRequired} rows={2} className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-sm font-normal text-[#111827]" placeholder="Kondisi umum, bahan rusak, atau informasi serah-terima" /></label>
                <button disabled={busy || outletRequired || !editableStocktake} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-40"><ShieldCheck size={16} />{busy ? "Mengirim..." : "Kirim untuk persetujuan"}</button>
              </div>
              <p className="px-4 pb-4 text-[11px] text-[#6b7280]">Stock Akhir = Stock Awal + Masuk − Keluar. Hitung Fisik dipakai untuk menghitung selisih; setelah Admin menyetujui, saldo master mengikuti hitung fisik.</p>
              {!orderedFields.some((field) => field.key === "PHYSICAL") && <p className="px-4 pb-4 text-xs text-amber-800">Kolom Hitung Fisik sedang dihapus. Saat Admin menyetujui, stok akan mengikuti Stock Akhir hasil rumus.</p>}
            </form>
          )}
          <HistoryPanel stocktakes={stocktakes} requests={requests} canReview={canManage} busy={busy} onReviewTake={reviewTake} onReviewRequest={reviewRequest} />
        </section>
      )}

      {view === "permintaan" && (
        <section className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-semibold">Permintaan bukan stok masuk</p><p className="mt-1 text-xs leading-5 text-blue-800">Shift sore dapat menyimpan draft atau mengirim kebutuhan ke Admin. Persetujuan tidak menambah saldo stok; barang yang benar-benar diterima perlu dicatat terpisah.</p></div>
          <form onSubmit={(event) => { event.preventDefault(); void persistRequest(true) }} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="font-semibold text-[#111827]">Kebutuhan bahan untuk hari berikutnya</h2><p className="mt-1 text-xs text-[#6b7280]">Isi hanya item yang memang perlu disediakan.</p></div>
              <label className="grid gap-1 text-xs font-semibold text-[#6b7280]">Tanggal dibutuhkan<input type="date" min={nextDate(today)} value={requestDate} onChange={(event) => setRequestDate(event.target.value)} disabled={outletRequired} className="h-10 rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111827]" /></label>
            </div>
            {currentRequest && <div className="px-4 pt-4"><StatusBadge status={currentRequest.status} />{currentRequest.reviewNotes && <p className="mt-2 text-xs text-amber-800">Catatan Admin: {currentRequest.reviewNotes}</p>}</div>}
            {activeMaterials.length === 0 ? <div className="p-5"><Empty title="Master item masih kosong" body="Tambahkan bahan baku pada tab Item & Kolom sebelum membuat permintaan." /></div> : <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[#f9fafb] text-[10px] uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Saldo tersedia</th>
                      <th className="px-4 py-3">Jumlah diminta</th>
                      <th className="px-4 py-3">Catatan</th>
                    </tr>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filter item..."
                          value={requestColumnFilters["item"] ?? ""}
                          onChange={(e) => setRequestColumnFilters((p) => ({ ...p, item: e.target.value }))}
                          className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none"
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filter saldo..."
                          value={requestColumnFilters["stock"] ?? ""}
                          onChange={(e) => setRequestColumnFilters((p) => ({ ...p, stock: e.target.value }))}
                          className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none"
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filter diminta..."
                          value={requestColumnFilters["amount"] ?? ""}
                          onChange={(e) => setRequestColumnFilters((p) => ({ ...p, amount: e.target.value }))}
                          className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none"
                        />
                      </th>
                      <th className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Filter catatan..."
                          value={requestColumnFilters["notes"] ?? ""}
                          onChange={(e) => setRequestColumnFilters((p) => ({ ...p, notes: e.target.value }))}
                          className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs font-normal normal-case text-[#111827] placeholder:text-[#9ca3af] focus:border-[#FFB800] focus:outline-none"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequestMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#9ca3af]">
                          Tidak ada item bahan yang sesuai filter.
                          {hasActiveRequestFilter && (
                            <button
                              type="button"
                              onClick={() => setRequestColumnFilters({})}
                              className="ml-2 font-semibold text-[#FFB800] hover:underline"
                            >
                              Reset Filter
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredRequestMaterials.map((material) => (
                        <tr key={material.id} className="border-t hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-[#111827]">
                            {material.name}
                            <span className="ml-1 text-xs font-normal text-[#9ca3af]">({material.unit})</span>
                          </td>
                          <td className="px-4 py-3 text-[#6b7280]">
                            {formatQuantity(number(material.currentStock))} {material.unit}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={requestEntries[material.id]?.amount ?? ""}
                              disabled={!editableRequest || outletRequired}
                              onChange={(event) =>
                                setRequestEntries((old) => ({
                                  ...old,
                                  [material.id]: { ...(old[material.id] ?? { amount: "", notes: "" }), amount: event.target.value },
                                }))
                              }
                              className="h-9 w-32 rounded-md border border-[#e5e7eb] px-2 disabled:bg-gray-50"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={requestEntries[material.id]?.notes ?? ""}
                              disabled={!editableRequest || outletRequired}
                              onChange={(event) =>
                                setRequestEntries((old) => ({
                                  ...old,
                                  [material.id]: { ...(old[material.id] ?? { amount: "", notes: "" }), notes: event.target.value },
                                }))
                              }
                              className="h-9 w-full min-w-44 rounded-md border border-[#e5e7eb] px-2 disabled:bg-gray-50"
                              placeholder="Opsional"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t bg-[#f9fafb] p-4 sm:flex-row sm:items-end sm:justify-between"><label className="grid w-full max-w-xl gap-1 text-xs font-semibold text-[#6b7280]">Catatan permintaan<textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} disabled={!editableRequest || outletRequired} rows={2} className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-sm font-normal text-[#111827]" placeholder="Alasan atau kebutuhan khusus" /></label><div className="flex gap-2"><button type="button" onClick={() => void persistRequest(false)} disabled={busy || outletRequired || !editableRequest} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 text-sm font-semibold text-[#374151] disabled:opacity-40"><Save size={15} />Simpan Draft</button><button type="submit" disabled={busy || outletRequired || !editableRequest} className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-40">Kirim ke Admin</button></div></div>
            </>}
          </form>
          <HistoryPanel stocktakes={[]} requests={requests} canReview={canManage} busy={busy} onReviewTake={reviewTake} onReviewRequest={reviewRequest} />
        </section>
      )}

      {view === "master" && <section className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div><h2 className="font-semibold text-[#111827]">Master bahan baku</h2><p className="mt-1 text-xs text-[#6b7280]">Terpisah dari produk yang dijual di POS. Item yang sudah dipakai cukup dinonaktifkan agar riwayat tetap utuh.</p></div>
          {canManage && <form onSubmit={addMaterial} className="grid gap-2 sm:grid-cols-2"><input value={newMaterial.name} onChange={(event) => setNewMaterial({ ...newMaterial, name: event.target.value })} required maxLength={100} placeholder="Nama bahan, mis. Daging kambing" className="h-10 rounded-lg border px-3 text-sm" /><input value={newMaterial.unit} onChange={(event) => setNewMaterial({ ...newMaterial, unit: event.target.value })} required maxLength={30} placeholder="Satuan" className="h-10 rounded-lg border px-3 text-sm" /><input type="number" min="0" step="0.001" value={newMaterial.openingStock} onChange={(event) => setNewMaterial({ ...newMaterial, openingStock: event.target.value })} required aria-label="Stok awal bahan" className="h-10 rounded-lg border px-3 text-sm" /><button disabled={busy || outletRequired} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FFB800] px-3 text-sm font-semibold text-slate-950 disabled:opacity-40"><Plus size={16} />Tambah Item</button></form>}
          <div className="divide-y rounded-xl border">{materials.map((material) => <div key={material.id} className="flex items-center justify-between gap-3 px-3 py-3"><div><p className={`text-sm font-semibold ${material.isActive ? "text-[#111827]" : "text-[#9ca3af] line-through"}`}>{material.name}</p><p className="mt-0.5 text-xs text-[#6b7280]">Saldo {formatQuantity(number(material.currentStock))} {material.unit} · {material.isActive ? "Aktif" : "Nonaktif"}</p></div>{canManage && <button onClick={() => void setMaterialActive(material)} disabled={busy || outletRequired} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40">{material.isActive ? "Nonaktifkan" : "Aktifkan"}</button>}</div>)}{materials.length === 0 && <p className="p-6 text-center text-sm text-[#9ca3af]">Belum ada item bahan.</p>}</div>
          {!canManage && <p className="text-xs text-[#6b7280]">Hanya Admin yang dapat mengubah master item.</p>}
        </div>
        <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div><h2 className="font-semibold text-[#111827]">Kolom lembar opname</h2><p className="mt-1 text-xs text-[#6b7280]">Kolom bisa diganti nama, diurutkan, dan dihapus dari lembar aktif. Data lama tetap tersimpan; kolom terhapus dapat dipulihkan.</p></div>
          {canManage && <form onSubmit={addField} className="grid gap-2 sm:grid-cols-[1fr_130px_auto]"><input value={newField.label} onChange={(event) => setNewField({ ...newField, label: event.target.value })} required maxLength={50} placeholder="Nama kolom tambahan" className="h-10 rounded-lg border px-3 text-sm" /><select value={newField.type} onChange={(event) => setNewField({ ...newField, type: event.target.value as "TEXT" | "NUMBER" })} className="h-10 rounded-lg border bg-white px-2 text-sm"><option value="TEXT">Teks</option><option value="NUMBER">Angka</option></select><button disabled={busy || outletRequired} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#111827] px-3 text-sm font-semibold text-white disabled:opacity-40"><Plus size={15} />Tambah</button></form>}
          <div className="space-y-2">{allFields.map((field) => <div key={field.id} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${field.isActive ? "" : "bg-gray-50 opacity-70"}`}>
            {editingField === field.id ? <><input value={fieldDraft.label} onChange={(event) => setFieldDraft({ ...fieldDraft, label: event.target.value })} className="h-9 min-w-32 flex-1 rounded-md border px-2 text-sm" /><select value={fieldDraft.type} disabled={field.isCore} onChange={(event) => setFieldDraft({ ...fieldDraft, type: event.target.value as "TEXT" | "NUMBER" })} className="h-9 rounded-md border bg-white px-2 text-sm disabled:bg-gray-100"><option value="TEXT">Teks</option><option value="NUMBER">Angka</option></select><input aria-label="Urutan kolom" type="number" min="0" max="50" value={fieldDraft.position} onChange={(event) => setFieldDraft({ ...fieldDraft, position: Number(event.target.value) })} className="h-9 w-16 rounded-md border px-2 text-sm" /><button onClick={() => void saveField(field)} disabled={busy} className="rounded-md bg-emerald-600 p-2 text-white"><Check size={15} /></button><button onClick={() => setEditingField(null)} className="rounded-md border p-2"><X size={15} /></button></>
              : <><span className="w-8 text-center text-xs text-[#9ca3af]">{field.position + 1}</span><span className="min-w-32 flex-1 text-sm font-semibold text-[#111827]">{field.label}</span><span className="rounded bg-gray-100 px-2 py-1 text-[10px] uppercase text-[#6b7280]">{!field.isActive ? "Dihapus" : field.isCore ? "Inti" : field.type === "NUMBER" ? "Angka" : "Teks"}</span>{canManage && (field.isActive ? <><button title="Edit nama/urutan" onClick={() => { setEditingField(field.id); setFieldDraft({ label: field.label, type: field.type, position: field.position }) }} disabled={outletRequired} className="rounded-md border p-2 text-[#6b7280]"><Edit2 size={14} /></button><button title="Hapus kolom" onClick={() => void removeField(field)} disabled={busy || outletRequired} className="rounded-md border p-2 text-red-600"><Trash2 size={14} /></button></> : <button title="Pulihkan kolom" onClick={() => void restoreField(field)} disabled={busy || outletRequired} className="rounded-md border p-2 text-emerald-700"><RotateCcw size={14} /></button>)}</>}
          </div>)}</div>
        </div>
      </section>}

      {view === "riwayat" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <h2 className="font-semibold text-[#111827]">Riwayat Stock Opname</h2>
            <p className="mt-1 text-xs text-[#6b7280]">
              Daftar seluruh riwayat opname shift dan status persetujuannya. Klik rincian untuk melihat hitungan stok per bahan.
            </p>
          </div>
          {stocktakes.length === 0 ? (
            <Empty
              title="Belum ada riwayat stock opname"
              body="Laporan opname yang dikirim oleh shift kasir/dapur akan tercatat dan dapat ditinjau di sini."
            />
          ) : (
            <HistoryPanel
              stocktakes={stocktakes}
              requests={requests}
              canReview={canManage}
              busy={busy}
              onReviewTake={reviewTake}
              onReviewRequest={reviewRequest}
            />
          )}
        </section>
      )}

      <aside className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><p className="font-semibold">Catatan alur stok</p><p className="mt-1">Permintaan yang disetujui belum menambah stok. Stok baru berubah melalui persetujuan opname berdasarkan hitung fisik. Pencatatan penerimaan barang dari pembelian belum termasuk modul ini.</p></aside>
    </div>
  )
}

function HistoryPanel({ stocktakes, requests, canReview, busy, onReviewTake, onReviewRequest }: { stocktakes: Stocktake[]; requests: MaterialRequest[]; canReview: boolean; busy: boolean; onReviewTake: (item: Stocktake, decision: "APPROVE" | "REJECT") => void; onReviewRequest: (item: MaterialRequest, decision: "APPROVE" | "REJECT") => void }) {
  return <section className="space-y-4">
    {stocktakes.length > 0 && <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white"><div className="border-b px-4 py-3 font-semibold text-[#111827]">Riwayat stock opname</div>{stocktakes.map((item) => <div key={item.id} className="border-b px-4 py-3 last:border-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[#111827]">{formatDate(item.date)} · Shift {item.shift === "MORNING" ? "Pagi" : "Sore"}</span><StatusBadge status={item.status} /></div><p className="mt-1 text-xs text-[#6b7280]">{item.lines.length} item · dikirim oleh {item.createdByName}{item.reviewedByName ? ` · ditinjau ${item.reviewedByName}` : ""}</p>{item.reviewNotes && <p className="mt-1 text-xs text-amber-800">Catatan Admin: {item.reviewNotes}</p>}</div>{canReview && item.status === "SUBMITTED" && <ReviewButtons busy={busy} onApprove={() => onReviewTake(item, "APPROVE")} onReject={() => onReviewTake(item, "REJECT")} />}</div>
      <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-[#4b5563]">Lihat rincian stok dan catatan</summary><div className="mt-2 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-[#f9fafb] text-[#6b7280]"><tr><th className="px-2 py-2">Bahan</th><th className="px-2 py-2">Awal</th><th className="px-2 py-2">Masuk</th><th className="px-2 py-2">Keluar</th><th className="px-2 py-2">Stock Akhir</th><th className="px-2 py-2">Fisik</th><th className="px-2 py-2">Catatan</th></tr></thead><tbody>{item.lines.map((line) => <tr key={line.rawMaterialId} className="border-t"><td className="px-2 py-2 font-medium">{line.name}</td><td className="px-2 py-2">{formatQuantity(number(line.openingStock))} {line.unit}</td><td className="px-2 py-2">{formatQuantity(number(line.incoming))}</td><td className="px-2 py-2">{formatQuantity(number(line.outgoing))}</td><td className="px-2 py-2 font-semibold">{formatQuantity(number(line.endingStock))}</td><td className="px-2 py-2">{formatQuantity(number(line.physicalStock))}</td><td className="px-2 py-2">{line.notes || "—"}</td></tr>)}</tbody></table></div></details>
    </div>)}</div>}
    {requests.length > 0 && <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white"><div className="border-b px-4 py-3 font-semibold text-[#111827]">Riwayat permintaan bahan</div>{requests.map((item) => <div key={item.id} className="flex flex-col gap-3 border-b px-4 py-3 last:border-0 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[#111827]">Kebutuhan {formatDate(item.forDate)}</span><StatusBadge status={item.status} /></div><p className="mt-1 text-xs text-[#6b7280]">{item.lines.map((line) => `${line.name}: ${formatQuantity(number(line.requestedAmount))} ${line.unit}`).join(" · ")}</p><p className="mt-1 text-[11px] text-[#9ca3af]">Dibuat oleh {item.createdByName}{item.reviewedByName ? ` · ditinjau ${item.reviewedByName}` : ""}</p>{item.reviewNotes && <p className="mt-1 text-xs text-amber-800">Catatan: {item.reviewNotes}</p>}</div>{canReview && item.status === "SUBMITTED" && <ReviewButtons busy={busy} onApprove={() => onReviewRequest(item, "APPROVE")} onReject={() => onReviewRequest(item, "REJECT")} />}</div>)}</div>}
  </section>
}

function ReviewButtons({ busy, onApprove, onReject }: { busy: boolean; onApprove: () => void; onReject: () => void }) {
  return <div className="flex gap-2"><button onClick={onApprove} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Check size={14} />Setujui</button><button onClick={onReject} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"><X size={14} />Tolak</button></div>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", SUBMITTED: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-800" }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] ?? styles.DRAFT}`}>{statusLabel[status] ?? status}</span>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-28 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2"><p className="text-[10px] font-semibold text-[#9ca3af]">{label}</p><p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p></div>
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${active ? "bg-[#FFB800] text-slate-950" : "text-[#6b7280] hover:bg-[#f9fafb]"}`}>{children}</button>
}

function Notice({ tone, children }: { tone: "amber" | "red" | "green" | "blue"; children: ReactNode }) {
  const styles = { amber: "border-amber-200 bg-amber-50 text-amber-900", red: "border-red-200 bg-red-50 text-red-800", green: "border-emerald-200 bg-emerald-50 text-emerald-800", blue: "border-blue-200 bg-blue-50 text-blue-900" }
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-dashed border-[#d1d5db] bg-white px-5 py-10 text-center"><ClipboardList className="mx-auto text-[#9ca3af]" size={26} /><p className="mt-3 text-sm font-semibold text-[#111827]">{title}</p><p className="mt-1 text-xs text-[#6b7280]">{body}</p></div>
}

function Quantity({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <span className={`inline-flex min-w-24 justify-end rounded-md px-2 py-2 ${strong ? "bg-[#f3f4f6] text-sm font-bold text-[#111827]" : "text-[#6b7280]"}`}>{children}</span>
}

function nextDate(date: string) {
  const next = new Date(`${date}T00:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

function number(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0 }
function formatQuantity(value: number) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(value) }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`)) }
function messageOf(cause: unknown, fallback: string) { return cause instanceof Error ? cause.message : fallback }
