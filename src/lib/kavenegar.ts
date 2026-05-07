import 'server-only';

import { db } from '@/src/db';
import { systemConfig, smsLogs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './encryption';

// ==================== CONFIG ====================

async function getConfig(key: string): Promise<string | null> {
  try {
    const config = await db.query.systemConfig.findFirst({
      where: eq(systemConfig.key, key),
    });

    if (!config) return null;

    if (config.isEncrypted) {
      return decrypt(config.value);
    }

    return config.value;
  } catch {
    return null;
  }
}

async function getKavenegarConfig(): Promise<{
  apiKey: string;
  sender: string;
}> {
  const dbApiKey = await getConfig('kavenegar_api_key');
  const dbSender = await getConfig('kavenegar_sender');

  const apiKey = dbApiKey || process.env.KAVENEGAR_API_KEY || '';
  const sender = dbSender || process.env.KAVENEGAR_SENDER || '';

  if (!apiKey) {
    throw new KavenegarError('Kavenegar API key is not configured');
  }

  return { apiKey, sender };
}

// ==================== ERROR CLASS ====================

export class KavenegarError extends Error {
  constructor(
    message: string,
    public code?: number
  ) {
    super(message);
    this.name = 'KavenegarError';
  }
}

// ==================== API TYPES ====================

interface KavenegarResponse {
  return: {
    status: number;
    message: string;
  };
  entries?: Array<{
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
  }>;
}

// ==================== MESSAGE TYPES ====================

export type SmsType =
  | 'booking_confirmed'
  | 'booking_canceled'
  | 'booking_pending'
  | 'payment_received'
  | 'otp'
  | 'general';

// ==================== SEND SMS ====================

export interface SendSmsParams {
  receptor: string;
  message: string;
  type: SmsType;
  userId?: number;
  reservationId?: number;
}

export interface SendSmsResult {
  messageId: string;
  status: number;
  statusText: string;
  cost: number;
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { apiKey, sender } = await getKavenegarConfig();

  const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;

  const body = new URLSearchParams({
    receptor: params.receptor,
    message: params.message,
    sender: sender,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Kavenegar] Sending SMS:', {
      receptor: params.receptor,
      message: params.message.substring(0, 50) + '...',
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data: KavenegarResponse = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Kavenegar] Response:', JSON.stringify(data, null, 2));
    }

    if (data.return.status !== 200) {
      // Log failed attempt
      await logSms({
        ...params,
        status: 'failed',
        statusText: data.return.message,
      });

      throw new KavenegarError(data.return.message, data.return.status);
    }

    const entry = data.entries?.[0];
    const result: SendSmsResult = {
      messageId: String(entry?.messageid || ''),
      status: entry?.status || 0,
      statusText: entry?.statustext || '',
      cost: entry?.cost || 0,
    };

    // Log successful send
    await logSms({
      ...params,
      kavenegarMessageId: result.messageId,
      status: 'sent',
      statusText: result.statusText,
      cost: result.cost,
    });

    return result;
  } catch (error) {
    if (error instanceof KavenegarError) {
      throw error;
    }

    // Log error
    await logSms({
      ...params,
      status: 'failed',
      statusText: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new KavenegarError('Failed to send SMS');
  }
}

// ==================== LOG SMS ====================

interface LogSmsParams {
  receptor: string;
  message: string;
  type: SmsType;
  userId?: number;
  reservationId?: number;
  kavenegarMessageId?: string;
  status: 'pending' | 'sent' | 'failed';
  statusText?: string;
  cost?: number;
}

async function logSms(params: LogSmsParams): Promise<void> {
  try {
    await db.insert(smsLogs).values({
      receptor: params.receptor,
      message: params.message,
      messageType: params.type,
      userId: params.userId,
      reservationId: params.reservationId,
      kavenegarMessageId: params.kavenegarMessageId,
      status: params.status,
      statusText: params.statusText,
      cost: params.cost,
      sentAt: params.status === 'sent' ? new Date() : null,
    });
  } catch (error) {
    console.error('[Kavenegar] Failed to log SMS:', error);
  }
}

// ==================== TEMPLATE HELPERS ====================

export async function getTemplate(type: SmsType): Promise<string | null> {
  const key = `sms_${type}_template`;
  return getConfig(key);
}

export function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// ==================== CONVENIENCE FUNCTIONS ====================

export async function sendBookingConfirmationSms(params: {
  receptor: string;
  confirmationCode: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  userId?: number;
  reservationId?: number;
}): Promise<SendSmsResult | null> {
  const template = await getTemplate('booking_confirmed');
  if (!template) {
    console.warn('[Kavenegar] No booking confirmation template configured');
    return null;
  }

  const message = fillTemplate(template, {
    code: params.confirmationCode,
    hotel: params.hotelName,
    checkin: params.checkIn,
    checkout: params.checkOut,
  });

  return sendSms({
    receptor: params.receptor,
    message,
    type: 'booking_confirmed',
    userId: params.userId,
    reservationId: params.reservationId,
  });
}

export async function sendBookingCanceledSms(params: {
  receptor: string;
  confirmationCode: string;
  userId?: number;
  reservationId?: number;
}): Promise<SendSmsResult | null> {
  const template = await getTemplate('booking_canceled');
  if (!template) {
    console.warn('[Kavenegar] No cancellation template configured');
    return null;
  }

  const message = fillTemplate(template, {
    code: params.confirmationCode,
  });

  return sendSms({
    receptor: params.receptor,
    message,
    type: 'booking_canceled',
    userId: params.userId,
    reservationId: params.reservationId,
  });
}

export async function sendOtpSms(params: {
  receptor: string;
  code: string;
  userId?: number;
}): Promise<SendSmsResult | null> {
  const template = await getTemplate('otp');
  if (!template) {
    // Use default OTP message
    return sendSms({
      receptor: params.receptor,
      message: `کد تایید شما: ${params.code}`,
      type: 'otp',
      userId: params.userId,
    });
  }

  const message = fillTemplate(template, {
    code: params.code,
  });

  return sendSms({
    receptor: params.receptor,
    message,
    type: 'otp',
    userId: params.userId,
  });
}
