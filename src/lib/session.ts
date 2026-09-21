import { headers } from "next/headers"
import { auth } from "./auth"
import { prisma } from "./prisma"

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !session.user) {
    throw new Error("Unauthorized: Harap login terlebih dahulu")
  }

  // Fetch langsung dari DB agar role & outletId selalu akurat
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      outletId: true,
      isActive: true,
    }
  })

  if (!dbUser) {
    throw new Error("Unauthorized: User tidak ditemukan")
  }

  if (!dbUser.isActive) {
    throw new Error("Unauthorized: Akun Anda tidak aktif")
  }

  const isSuperAdmin = dbUser.role === "SUPERADMIN"
  const outletId = dbUser.outletId || null

  return {
    session,
    user: dbUser,
    userId: dbUser.id,
    role: dbUser.role as string,
    outletId,
    isSuperAdmin,
  }
}
