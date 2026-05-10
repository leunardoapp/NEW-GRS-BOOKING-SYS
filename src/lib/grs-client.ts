import 'server-only';

import { db } from '@/src/db';
import { systemConfig } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './encryption';
import type { GRSResponse } from '@/src/types/grs';

// ==================== ERROR CLASSES ====================

export class GRSError extends Error {
  constructor(
    public code: number,
    message: string,
    public errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = 'GRSError';
  }
}

export class GRSValidationError extends GRSError {
  constructor(errors: Record<string, string[]>) {
    super(422, 'Validation failed', errors);
    this.name = 'GRSValidationError';
  }
}

export class GRSAuthError extends GRSError {
  constructor() {
    super(401, 'Authentication failed');
    this.name = 'GRSAuthError';
  }
}

// ==================== CONFIG HELPERS ====================

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

async function getGRSConfig(): Promise<{ baseUrl: string; token: string }> {
  // Try to get from database first, fallback to env vars
  const dbBaseUrl = await getConfig('grs_api_base_url');
  const dbToken = await getConfig('grs_client_token');

  const baseUrl = dbBaseUrl || process.env.GRS_API_BASE_URL || 'https://api.grs.ir';
  const token = dbToken || process.env.GRS_CLIENT_TOKEN || '';

  // If token is still missing, provide a clear error message to help debugging
  if (!token) {
    console.error('[GRS] Missing GRS client token. Ensure that either:');
    console.error('- The `grs_client_token` entry exists in the `systemConfig` table, or');
    console.error('- The environment variable `GRS_CLIENT_TOKEN` is set.');
    console.error('The request cannot be sent without a valid token, which results in "Failed to connect to GRS API".');
    throw new GRSAuthError();
  }

  return { baseUrl, token };
}

// ==================== REQUEST FUNCTION ====================

export interface GRSRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export async function grsRequest<T>(
  path: string,
  options: GRSRequestOptions = {}
): Promise<GRSResponse<T>> {
  const { baseUrl, token } = await getGRSConfig();
  const { method = 'GET', body, params, headers: additionalHeaders } = options;

  // Build URL with query params
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Client-Token': token,
    ...additionalHeaders,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GRS] ${method} ${url.toString()}`);
    if (body) {
      console.log('[GRS] Body:', JSON.stringify(body, null, 2));
    }
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.json() as GRSResponse<T>;

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GRS] Response ${response.status}:`, JSON.stringify(data, null, 2));
    }

    // Handle error responses
    if (!response.ok || data.code >= 400) {
      if (response.status === 401 || data.code === 401) {
        throw new GRSAuthError();
      }

      if (response.status === 422 || data.code === 422) {
        throw new GRSValidationError(data.errors || {});
      }

      throw new GRSError(data.code, data.message, data.errors);
    }

    return data;
  } catch (error) {
    if (error instanceof GRSError) {
      throw error;
    }

    // Network or parsing errors
    console.error('[GRS] Request failed:', error);
    throw new GRSError(500, 'Failed to connect to GRS API');
  }
}

// ==================== TYPED API METHODS ====================

import type {
  City,
  Property,
  PropertyDetails,
  Suggestion,
  SuggestionRequest,
  AvailableRoomsRequest,
  RoomRate,
  ReserveRequest,
  Reserve,
  ReserveDetails,
  ReserveActivity,
  AccountTransaction,
  Receipt,
  WebHookConfig,
  GRSUser,
  CancelRequest,
  ModifyRequest,
  AcceptCancelRequest,
  AcceptModifyRequest,
  ExtendExpiryRequest,
  GRSPaginatedResponse,
} from '@/src/types/grs';

// Cities
export async function getCities(): Promise<City[]> {
  const response = await grsRequest<City[]>('/v1/cities');
  return response.value || [];
}

export async function getCity(idOrSlug: string | number): Promise<City> {
  const response = await grsRequest<City>(`/v1/cities/${idOrSlug}`);
  return response.value;
}

// Properties
export async function getProperties(params?: Record<string, string | number | boolean>): Promise<Property[]> {
  const response = await grsRequest<Property[]>('/v1/properties', { params });
  return response.value || [];
}

export async function getProperty(id: number): Promise<PropertyDetails> {
  const response = await grsRequest<PropertyDetails>(`/v1/properties/${id}`);
  return response.value;
}

// Suggestions (Search)
export async function getSuggestions(params: SuggestionRequest): Promise<Suggestion[]> {
  const response = await grsRequest<Suggestion[]>('/v1/suggestion', {
    params: params as unknown as Record<string, string | number | boolean>,
  });
  return response.value;
}

// Available Rooms
export async function getAvailableRooms(params: AvailableRoomsRequest): Promise<RoomRate[]> {
  const childrenAges = params.children_ages?.join(',');
  const response = await grsRequest<RoomRate[]>('/v1/available-rooms', {
    params: {
      property_id: params.property_id,
      check_in: params.check_in,
      check_out: params.check_out,
      adults: params.adults,
      children_ages: childrenAges,
    },
  });
  return response.value;
}

// Reserve
export async function createReservation(data: ReserveRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/reserve', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

export async function getReservationDetails(confirmationCode: string): Promise<ReserveDetails> {
  const response = await grsRequest<ReserveDetails>('/v1/reserve-details', {
    params: { confirmation_code: confirmationCode },
  });
  return response.value;
}

export async function getReservationActivities(confirmationCode: string): Promise<ReserveActivity[]> {
  const response = await grsRequest<ReserveActivity[]>(`/v1/reserves/${confirmationCode}/activities`);
  return response.value;
}

// Book (after payment)
export async function bookReservation(confirmationCode: string): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/book', {
    method: 'POST',
    body: { confirmation_code: confirmationCode },
  });
  return response.value;
}

// Cancel
export async function cancelReservation(data: CancelRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/cancel-booking', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

export async function acceptCancel(data: AcceptCancelRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/accept-cancel', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

// Modify
export async function modifyReservation(data: ModifyRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/modify-booking', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

export async function acceptModify(data: AcceptModifyRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/accept-modify', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

// Extend Expiry
export async function extendExpiry(data: ExtendExpiryRequest): Promise<Reserve> {
  const response = await grsRequest<Reserve>('/v1/extend-expiry', {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
  return response.value;
}

// Accounting (Admin)
export async function getAccountTransactions(params?: {
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}): Promise<GRSPaginatedResponse<AccountTransaction>['value']> {
  const response = await grsRequest<GRSPaginatedResponse<AccountTransaction>['value']>(
    '/v1/accounting-transactions',
    { params: params as Record<string, string | number | boolean> }
  );
  return response.value;
}

// Receipts (Admin)
export async function getReceipts(params?: {
  page?: number;
  per_page?: number;
}): Promise<GRSPaginatedResponse<Receipt>['value']> {
  const response = await grsRequest<GRSPaginatedResponse<Receipt>['value']>(
    '/v1/receipts',
    { params: params as Record<string, string | number | boolean> }
  );
  return response.value;
}

export async function getReceipt(id: number): Promise<Receipt> {
  const response = await grsRequest<Receipt>(`/v1/receipts/${id}`);
  return response.value;
}

// Webhook Config (Admin)
export async function getWebhookConfig(): Promise<WebHookConfig> {
  const response = await grsRequest<WebHookConfig>('/v1/web-hook');
  return response.value;
}

export async function setWebhookConfig(url: string): Promise<WebHookConfig> {
  const response = await grsRequest<WebHookConfig>('/v1/web-hook', {
    method: 'POST',
    body: { url },
  });
  return response.value;
}

// Users (Admin)
export async function getGRSUsers(): Promise<GRSUser[]> {
  const response = await grsRequest<GRSUser[]>('/v1/users');
  return response.value;
}

export async function createGRSUser(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: number;
}): Promise<GRSUser> {
  const response = await grsRequest<GRSUser>('/v1/users/create', {
    method: 'POST',
    body: data,
  });
  return response.value;
}

// Test Connection
export async function testConnection(): Promise<boolean> {
  try {
    await getCities();
    return true;
  } catch {
    return false;
  }
}
