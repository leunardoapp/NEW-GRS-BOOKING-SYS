import { requireAdmin } from '@/src/lib/admin-middleware'
import { db } from '@/src/db'
import { reservations, users } from '@/src/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const allBookings = await db
      .select({
        id: reservations.id,
        grsReserveId: reservations.confirmationCode,
        userEmail: users.email,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        hotelId: reservations.propertyId,
        hotelName: reservations.propertyName,
        checkIn: reservations.checkIn,
        checkOut: reservations.checkOut,
        totalPrice: reservations.totalSalesPrice,
        currency: reservations.currency,
        status: reservations.status,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .leftJoin(users, sql`${reservations.userId} = ${users.id}`)
      .orderBy(sql`${reservations.createdAt} DESC`)

    return Response.json({ bookings: allBookings })
  } catch (error) {
    console.log('[v0] Admin bookings error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
