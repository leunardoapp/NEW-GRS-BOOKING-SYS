import { requireAdmin } from '@/src/lib/admin-middleware'
import { db } from '@/src/db'
import { systemConfig } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  grs_api_base_url: z.string().optional(),
  grs_client_token: z.string().optional(),
  zarinpal_merchant_id: z.string().optional(),
  zarinpal_sandbox: z.string().optional(),
  kavenegar_api_key: z.string().optional(),
  kavenegar_sender: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const configs = await db.select().from(systemConfig)
    const settings: Record<string, string> = {}
    configs.forEach((c) => {
      settings[c.key] = c.isEncrypted ? '****' : c.value
    })

    return Response.json({ settings })
  } catch (error) {
    console.log('[v0] Admin settings error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const validated = updateSettingsSchema.parse(body)

    for (const [key, value] of Object.entries(validated)) {
      if (value) {
        await db
          .insert(systemConfig)
          .values({ key, value, isEncrypted: false })
          .onConflictDoUpdate({
            target: systemConfig.key,
            set: { value, updatedAt: new Date() },
          })
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.log('[v0] Admin settings error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
