import { requireAdmin } from '@/src/lib/admin-middleware'
import { db } from '@/src/db'
import { users, reservations } from '@/src/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)

    // Get booking counts per user
    const bookingCounts = await db
      .select({
        userId: reservations.userId,
        count: sql<number>`count(*)`,
      })
      .from(reservations)
      .groupBy(reservations.userId)

    const countMap = new Map<number, number>()
    bookingCounts.forEach((bc) => {
      if (bc.userId) countMap.set(bc.userId, Number(bc.count))
    })

    const usersWithCounts = allUsers.map((u) => ({
      ...u,
      name: `${u.firstName} ${u.lastName}`,
      bookingCount: countMap.get(u.id) || 0,
    }))

    return Response.json({ users: usersWithCounts })
  } catch (error) {
    console.log('[v0] Admin users error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
