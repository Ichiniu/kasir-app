import { getSessionUser } from "@/lib/session"

export async function getTabletCashier() {
  const user = await getSessionUser()
  if (user.role !== "CASHIER" || !user.outletId) {
    throw new Error("Akun kasir yang terhubung ke outlet diperlukan")
  }
  return user
}

export function tabletApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Kesalahan server"
  const status = message.startsWith("Unauthorized") ? 401
    : message === "Akun kasir yang terhubung ke outlet diperlukan" ? 403
      : ["Kasir ini sudah memiliki sesi kas yang aktif", "Tidak ditemukan sesi kas aktif untuk ditutup", "Sesi kas sudah ditutup"].includes(message) ? 409 : 500
  return Response.json({ error: status === 500 ? "Kesalahan server" : message }, { status })
}
