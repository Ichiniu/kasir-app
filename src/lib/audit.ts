import { prisma } from "./prisma"
import { headers } from "next/headers"
import { auth } from "./auth"

export async function createLog(
  action: string, 
  entity?: string, 
  entityId?: string, 
  details?: string,
  oldValue?: any,
  newValue?: any
) {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList
    })
    if (!session?.user?.id) return

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        entity,
        entityId,
        details,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

