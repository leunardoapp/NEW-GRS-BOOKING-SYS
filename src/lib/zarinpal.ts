import 'server-only';

import { db } from '@/src/db';
import { systemConfig } from '@/src/db/schema';
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

async function getZarinPalConfig(): Promise<{
  merchantId: string;
  sandbox: boolean;
}> {
  const dbMerchantId = await getConfig('zarinpal_merchant_id');
  const dbSandbox = await getConfig('zarinpal_sandbox');

  const merchantId = dbMerchantId || process.env.ZARINPAL_MERCHANT_ID || '';
  const sandbox = dbSandbox === 'true' || process.env.ZARINPAL_SANDBOX === 'true';

  if (!merchantId) {
    throw new ZarinPalError('ZarinPal merchant ID is not configured');
  }

  return { merchantId, sandbox };
}

function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.zarinpal.com/pg/v4/payment'
    : 'https://api.zarinpal.com/pg/v4/payment';
}

function getGatewayUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.zarinpal.com/pg/StartPay'
    : 'https://www.zarinpal.com/pg/StartPay';
}

// ==================== ERROR CLASS ====================

export class ZarinPalError extends Error {
  constructor(
    message: string,
    public code?: number,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'ZarinPalError';
  }
}

// ==================== API TYPES ====================

interface PaymentRequestResponse {
  data: {
    code: number;
    message: string;
    authority: string;
    fee_type: string;
    fee: number;
  };
  errors: unknown[];
}

interface PaymentVerifyResponse {
  data: {
    code: number;
    message: string;
    card_hash: string;
    card_pan: string;
    ref_id: number;
    fee_type: string;
    fee: number;
  };
  errors: unknown[];
}

// ==================== API FUNCTIONS ====================

export interface PaymentRequestParams {
  amount: number; // In Rials
  description: string;
  email?: string;
  mobile?: string;
  callbackUrl: string;
}

export interface PaymentRequestResult {
  authority: string;
  paymentUrl: string;
  fee: number;
  feeType: string;
}

export async function requestPayment(
  params: PaymentRequestParams
): Promise<PaymentRequestResult> {
  const { merchantId, sandbox } = await getZarinPalConfig();
  const baseUrl = getBaseUrl(sandbox);
  const gatewayUrl = getGatewayUrl(sandbox);

  const body = {
    merchant_id: merchantId,
    amount: params.amount,
    callback_url: params.callbackUrl,
    description: params.description,
    metadata: {
      email: params.email,
      mobile: params.mobile,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[ZarinPal] Payment request:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(`${baseUrl}/request.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data: PaymentRequestResponse = await response.json();

  if (process.env.NODE_ENV === 'development') {
    console.log('[ZarinPal] Payment response:', JSON.stringify(data, null, 2));
  }

  if (data.data.code !== 100) {
    throw new ZarinPalError(
      data.data.message || 'Payment request failed',
      data.data.code,
      data.errors
    );
  }

  return {
    authority: data.data.authority,
    paymentUrl: `${gatewayUrl}/${data.data.authority}`,
    fee: data.data.fee,
    feeType: data.data.fee_type,
  };
}

export interface PaymentVerifyParams {
  authority: string;
  amount: number; // In Rials - must match the original request
}

export interface PaymentVerifyResult {
  code: number;
  refId: number;
  cardHash: string;
  cardPan: string;
  fee: number;
  feeType: string;
}

export async function verifyPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResult> {
  const { merchantId, sandbox } = await getZarinPalConfig();
  const baseUrl = getBaseUrl(sandbox);

  const body = {
    merchant_id: merchantId,
    amount: params.amount,
    authority: params.authority,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[ZarinPal] Verify request:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(`${baseUrl}/verify.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data: PaymentVerifyResponse = await response.json();

  if (process.env.NODE_ENV === 'development') {
    console.log('[ZarinPal] Verify response:', JSON.stringify(data, null, 2));
  }

  // Code 100 = success, 101 = already verified
  if (data.data.code !== 100 && data.data.code !== 101) {
    throw new ZarinPalError(
      data.data.message || 'Payment verification failed',
      data.data.code,
      data.errors
    );
  }

  return {
    code: data.data.code,
    refId: data.data.ref_id,
    cardHash: data.data.card_hash,
    cardPan: data.data.card_pan,
    fee: data.data.fee,
    feeType: data.data.fee_type,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get human-readable error message for ZarinPal error codes
 */
export function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    [-1]: 'اطلاعات ارسالی ناقص است',
    [-2]: 'IP یا مرچنت کد پذیرنده صحیح نیست',
    [-3]: 'با توجه به محدودیت‌های شاپرک امکان پرداخت با رقم درخواست شده میسر نیست',
    [-4]: 'سطح تایید پذیرنده پایین‌تر از سطح نقره‌ای است',
    [-11]: 'درخواست مورد نظر یافت نشد',
    [-12]: 'امکان ویرایش درخواست میسر نیست',
    [-21]: 'هیچ نوع عملیات مالی برای این تراکنش یافت نشد',
    [-22]: 'تراکنش ناموفق است',
    [-33]: 'رقم تراکنش با رقم پرداخت شده مطابقت ندارد',
    [-34]: 'سقف تقسیم تراکنش از رقم درخواستی بیشتر است',
    [-40]: 'اجازه دسترسی به متد مربوطه وجود ندارد',
    [-41]: 'اطلاعات ارسالی مربوط به AdditionalData غیرمعتبر است',
    [-42]: 'مدت زمان معتبر طول عمر شناسه پرداخت باید بین 30 دقیقه تا 45 روز باشد',
    [-54]: 'درخواست مورد نظر آرشیو شده است',
    [100]: 'عملیات موفق',
    [101]: 'تراکنش قبلا تایید شده است',
  };

  return messages[code] || 'خطای ناشناخته';
}
