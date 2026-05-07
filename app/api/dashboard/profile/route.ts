import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth'
import { db } from '@/src/db'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  nationalCode: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
      columns: {
        passwordHash: false,
      },
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalCode: user.nationalCode,
        role: user.role,
        createdAt: user.createdAt?.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      },
    })
  } catch (error) {
    console.log('[v0] Error fetching profile:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateProfileSchema.parse(body)

    const updateData: Record<string, string | null> = {
      updatedAt: new Date().toISOString(),
    }
    if (validated.firstName) updateData.firstName = validated.firstName
    if (validated.lastName) updateData.lastName = validated.lastName
    if (validated.phone) updateData.phone = validated.phone
    if (validated.nationalCode !== undefined) updateData.nationalCode = validated.nationalCode || null

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(session.user.id)))

    return Response.json({ success: true })
  } catch (error) {
    console.log('[v0] Error updating profile:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
