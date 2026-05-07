import { requireAdmin } from '@/src/lib/admin-middleware'
import { db } from '@/src/db'
import { reservations, payments, users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const allReservations = await db.select().from(reservations)
    const totalBookings = allReservations.length

    const allUsers = await db.select().from(users)
    const totalUsers = allUsers.length

    const completedPayments = await db.query.payments.findMany({
      where: eq(payments.status, 'verified'),
    })
    const totalRevenue = completedPayments.reduce((sum: number, p) => sum + Number(p.amount), 0)

    const pendingWebhooks = 0

    return Response.json({
      totalBookings,
      totalUsers,
      totalRevenue,
      pendingWebhooks,
    })
  } catch (error) {
    console.log('[v0] Admin stats error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
