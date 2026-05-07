import { db } from '@/src/db'
import { reservations, webhookLogs } from '@/src/db/schema'
import { sendSms } from '@/src/lib/kavenegar'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return hash === signature
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-grs-signature')
  const body = await req.text()

  const logEntry = await db.insert(webhookLogs).values({
    method: 'status_update',
    payload: JSON.parse(body || '{}'),
    processed: false,
    sourceIp: req.headers.get('x-forwarded-for') || 'unknown',
  }).returning()

  try {
    const secret = process.env.GRS_WEBHOOK_SECRET || ''
    if (secret && !verifyWebhookSignature(body, signature || '', secret)) {
      await db.update(webhookLogs)
        .set({ processed: true, processingError: 'Invalid signature', processedAt: new Date() })
        .where(eq(webhookLogs.id, logEntry[0].id))

      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)
    const { confirmation_code, status: reserveStatus } = data

    if (confirmation_code && reserveStatus) {
      const reservation = await db.query.reservations.findFirst({
        where: eq(reservations.confirmationCode, confirmation_code),
      })

      if (reservation) {
        await db.update(reservations)
          .set({ status: reserveStatus, updatedAt: new Date() })
          .where(eq(reservations.id, reservation.id))

        try {
          await sendSms({
            receptor: reservation.bookerPhone,
            message: `وضعیت رزرو هتل شما: ${getStatusPersian(reserveStatus)}. کد رزرو: ${confirmation_code}`,
            type: 'general',
          })
        } catch {
          console.log('[v0] SMS notification failed')
        }
      }

      await db.update(webhookLogs)
        .set({ processed: true, processedAt: new Date(), reservationId: reservation?.id })
        .where(eq(webhookLogs.id, logEntry[0].id))
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.log('[v0] Webhook processing error:', error)

    await db.update(webhookLogs)
      .set({ processed: true, processingError: String(error), processedAt: new Date() })
      .where(eq(webhookLogs.id, logEntry[0].id))

    return Response.json({ ok: true })
  }
}

function getStatusPersian(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'در انتظار تأیید',
    booked: 'رزرو شده',
    definite: 'قطعی',
    canceled: 'لغو شده',
    modified: 'ویرایش شده',
  }
  return statusMap[status] || status
}
