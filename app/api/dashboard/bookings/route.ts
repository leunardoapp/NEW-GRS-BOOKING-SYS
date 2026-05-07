import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth'
import { db } from '@/src/db'
import { reservations } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userBookings = await db.query.reservations.findMany({
      where: eq(reservations.userId, parseInt(session.user.id)),
      orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
    })

    const bookings = userBookings.map((r) => ({
      id: String(r.id),
      grsReserveId: r.confirmationCode,
      hotelId: String(r.propertyId),
      hotelName: r.propertyName,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      guestName: `${r.bookerFirstName} ${r.bookerLastName}`,
      totalPrice: Number(r.totalSalesPrice),
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt?.toISOString() || '',
    }))

    return Response.json({ bookings })
  } catch (error) {
    console.log('[v0] Error fetching bookings:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
