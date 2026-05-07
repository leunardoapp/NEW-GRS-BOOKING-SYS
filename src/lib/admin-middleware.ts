import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from '@/src/db'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(session.user.id)),
  })

  if (!user || user.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return user
}
