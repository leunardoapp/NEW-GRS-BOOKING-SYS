import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  bigint,
  jsonb,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'verified', 'failed']);

// ==================== USERS TABLE ====================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  nationalCode: varchar('national_code', { length: 20 }),
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  phoneVerified: timestamp('phone_verified', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// ==================== RESERVATIONS TABLE ====================

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  
  // GRS Data
  confirmationCode: varchar('confirmation_code', { length: 50 }).notNull().unique(),
  propertyId: integer('property_id').notNull(),
  propertyName: varchar('property_name', { length: 255 }).notNull(),
  checkIn: date('check_in').notNull(),
  checkOut: date('check_out').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  state: varchar('state', { length: 20 }).notNull().default('online'),
  
  // Pricing (stored in Rials)
  totalRackPrice: bigint('total_rack_price', { mode: 'number' }).notNull(),
  totalSalesPrice: bigint('total_sales_price', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('IRR'),
  
  // Booker Info
  bookerFirstName: varchar('booker_first_name', { length: 100 }).notNull(),
  bookerLastName: varchar('booker_last_name', { length: 100 }).notNull(),
  bookerEmail: varchar('booker_email', { length: 255 }).notNull(),
  bookerPhone: varchar('booker_phone', { length: 20 }).notNull(),
  bookerNationalCode: varchar('booker_national_code', { length: 20 }),
  specialRequests: text('special_requests'),
  
  // Room Details (JSON)
  roomsData: jsonb('rooms_data').$type<Record<string, unknown>[]>(),
  
  // Relations
  userId: integer('user_id').references(() => users.id),
  
  // GRS Metadata
  rejectReason: text('reject_reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  grsCreatedAt: timestamp('grs_created_at', { withTimezone: true }),
  grsUpdatedAt: timestamp('grs_updated_at', { withTimezone: true }),
  
  // Local Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== PAYMENTS TABLE ====================

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  
  // ZarinPal Data
  authority: varchar('authority', { length: 100 }).notNull().unique(),
  refId: varchar('ref_id', { length: 100 }),
  
  // Amount (in Rials)
  amount: bigint('amount', { mode: 'number' }).notNull(),
  
  // Status
  status: paymentStatusEnum('status').notNull().default('pending'),
  
  // Relations
  reservationId: integer('reservation_id').references(() => reservations.id),
  userId: integer('user_id').references(() => users.id),
  
  // Metadata
  description: text('description'),
  cardNumber: varchar('card_number', { length: 20 }),
  cardHash: varchar('card_hash', { length: 100 }),
  feeType: varchar('fee_type', { length: 50 }),
  fee: integer('fee'),
  
  // Gateway Response
  gatewayResponse: jsonb('gateway_response').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
});

// ==================== SYSTEM CONFIG TABLE ====================

export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  isEncrypted: boolean('is_encrypted').notNull().default(false),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== SMS LOGS TABLE ====================

export const smsLogs = pgTable('sms_logs', {
  id: serial('id').primaryKey(),
  
  // Recipient
  receptor: varchar('receptor', { length: 20 }).notNull(),
  
  // Message
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(),
  
  // Template (if using Kavenegar lookup)
  template: varchar('template', { length: 100 }),
  
  // Relations
  userId: integer('user_id').references(() => users.id),
  reservationId: integer('reservation_id').references(() => reservations.id),
  
  // Kavenegar Response
  kavenegarMessageId: varchar('kavenegar_message_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  statusText: varchar('status_text', { length: 255 }),
  cost: integer('cost'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

// ==================== WEBHOOK LOGS TABLE ====================

export const webhookLogs = pgTable('webhook_logs', {
  id: serial('id').primaryKey(),
  
  // Webhook Data
  method: varchar('method', { length: 100 }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  
  // Processing
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processingError: text('processing_error'),
  
  // Relations
  reservationId: integer('reservation_id').references(() => reservations.id),
  
  // Source IP
  sourceIp: varchar('source_ip', { length: 50 }),
  
  // Timestamps
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== TYPE EXPORTS ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;

export type SmsLog = typeof smsLogs.$inferSelect;
export type NewSmsLog = typeof smsLogs.$inferInsert;

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;
