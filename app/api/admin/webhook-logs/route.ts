import { requireAdmin } from '@/src/lib/admin-middleware'
import { db } from '@/src/db'
import { webhookLogs } from '@/src/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const logs = await db
      .select()
      .from(webhookLogs)
      .orderBy(sql`${webhookLogs.receivedAt} DESC`)
      .limit(100)

    return Response.json({ logs })
  } catch (error) {
    console.log('[v0] Admin webhook logs error:', error)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
