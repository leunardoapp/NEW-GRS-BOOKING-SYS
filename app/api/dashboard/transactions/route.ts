import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth'
import { db } from '@/src/db'
import { payments } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPayments = await db.query.payments.findMany({
      where: eq(payments.userId, parseInt(session.user.id)),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    })

    const transactions = userPayments.map((p) => ({
      id: String(p.id),
      amount: Number(p.amount),
      status: p.status,
      authority: p.authority,
      refId: p.refId,
      description: p.description,
      createdAt: p.createdAt?.toISOString() || '',
      verifiedAt: p.verifiedAt?.toISOString() || null,
    }))

    return Response.json({ transactions })
  } catch (error) {
    console.log('[v0] Error fetching transactions:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
