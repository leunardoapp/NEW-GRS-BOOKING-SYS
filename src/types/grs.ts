// GRS API Type Definitions
// Based on GRS Agency API v1.17.0

// ==================== ENUMS ====================

export type ReserveDetailsStatus =
  | 'pending'
  | 'booking'
  | 'booked'
  | 'definite'
  | 'rejected'
  | 'canceled'
  | 'canceling'
  | 'modifying'
  | 'modified'
  | 'no_show'
  | 'checked_in'
  | 'checked_out'
  | 'expired'
  | 'failed'
  | 'cancel_pending'
  | 'modify_pending'
  | 'unknown';

export type ReserveDetailsState = 'online' | 'offline';

export type PaymentStatus = 'pending' | 'verified' | 'failed';

export type UserRole = 'user' | 'admin';

// ==================== BASE ENTITIES ====================

export interface City {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  province_id: number;
  province_name: string;
  country_id: number;
  country_name: string;
}

export interface Facility {
  id: number;
  name: string;
  name_en: string;
  icon: string | null;
}

export interface FacilityDetails extends Facility {
  category_id: number;
  category_name: string;
}

export interface GRSFile {
  id: number;
  url: string;
  thumbnail_url: string | null;
  alt: string | null;
  type: 'image' | 'video' | 'document';
  order: number;
}

// ==================== PROPERTY ====================

export interface Property {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  type: string;
  type_id: number;
  stars: number;
  city_id: number;
  city_name: string;
  province_name: string;
  country_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  policies: string | null;
  check_in_time: string;
  check_out_time: string;
  main_image: GRSFile | null;
  images: GRSFile[];
  facilities: Facility[];
  min_price: number | null;
  currency: string;
  is_available: boolean;
}

export interface PropertyDetails extends Property {
  phone: string | null;
  email: string | null;
  website: string | null;
  fax: string | null;
  facilities_details: FacilityDetails[];
  room_types: RoomType[];
}

// ==================== ROOM TYPE ====================

export interface RoomType {
  id: number;
  property_id: number;
  name: string;
  name_en: string;
  description: string | null;
  capacity: number;
  extra_bed_capacity: number;
  size: number | null;
  bed_type: string | null;
  view: string | null;
  images: GRSFile[];
  facilities: Facility[];
}

// ==================== RATE PLAN ====================

export interface RatePlan {
  id: number;
  room_type_id: number;
  name: string;
  name_en: string;
  description: string | null;
  meal_plan: string;
  cancellation_policy: string;
  is_refundable: boolean;
}

export interface RatePlanDetails extends RatePlan {
  rules: Rule[];
}

export interface RatePlanPrice {
  date: string;
  rack_price: number;
  sales_price: number;
  currency: string;
  available_rooms: number;
  closed: boolean;
}

export interface RoomRate {
  room_type: RoomType;
  rate_plan: RatePlan;
  prices: RatePlanPrice[];
  total_rack_price: number;
  total_sales_price: number;
  currency: string;
  available_rooms: number;
}

// ==================== SUGGESTION (اصلاح شده بر اساس خروجی واقعی API) ====================

// ساختار قیمت روزانه برای هر اتاق در پاسخ پیشنهادات
export interface SuggestionPrice {
  day: string;
  inventory: number;
  rack_rate: number;
  daily_rate: number;
  grs_rate: number;
  baby_cot_rack_rate: number | null;
  baby_cot_daily_rate: number | null;
  baby_cot_grs_rate: number;
  extend_bed_rack_rate: number;
  extend_bed_daily_rate: number;
  extend_bed_grs_rate: number;
  reservation_state: 'online' | 'offline';
  min_stay: number | null;
  max_stay: number | null;
  close_to_arrival: boolean;
  close_to_departure: boolean;
  closed: boolean;
}

// ساختار پلن قیمتی در پاسخ پیشنهادات
export interface SuggestionRatePlan {
  id: number;
  country_id: number | null;
  nationality: 'iranian' | 'foreign' | 'both';
  name: string;
  name_ar: string | null;
  name_en: string | null;
  meal_type_included: string;
  board_type: string;
  duration_hours: number | null;
  food_board_type: string | null;
  breakfast_rate: number;
  half_board_rate: number | null;
  full_board_rate: number | null;
  cancelable: number;
  sleeps: number | null;
  facilities: any[];
  prices: SuggestionPrice[];
  rack_rate: number;
  daily_rate: number;
  grs_rate: number;
  promotion: any | null;
}

// ساختار اتاق در پاسخ پیشنهادات
export interface SuggestionRoomType {
  room_type_id: number;
  room_type: string;
  room_type_name: string;
  room_type_name_ar: string | null;
  room_type_name_en: string | null;
  room_type_capacity: number;
  room_type_extra_capacity: number;
  rate_plans: SuggestionRatePlan[];
}

// ساختار اصلی پیشنهاد (Suggestion) بر اساس لاگ API
export interface Suggestion {
  property_id: number;
  property_name: string;
  property_name_ar: string | null;
  property_name_en: string | null;
  promotion: any | null;
  rooms: SuggestionRoomType[]; // در API فیلد rooms این ساختار را دارد
}

// توجه: اینترفیس‌های قدیمی SuggestionRoom و SuggestionRoom را حذف یا کامنت کنید تا تداخل نداشته باشند.
// اگر در جای دیگر استفاده شده، باید آن‌ها را نیز با SuggestionRoomType جایگزین کنید.
// ==================== RESERVE ====================

export interface ReserveRoom {
  room_type_id: number;
  rate_plan_id: number;
  guests: ReserveGuest[];
}

export interface ReserveGuest {
  guest_first_name: string;
  guest_last_name: string;
  guest_first_name_en: string;
  guest_last_name_en: string;
  guest_national_code: string;
  guest_birth_date: string;
  guest_gender: 'male' | 'female';
  guest_is_child: boolean;
}

export interface ReserveRequest {
  property_id: number;
  check_in: string;
  check_out: string;
  booker_first_name: string;
  booker_last_name: string;
  booker_email: string;
  booker_phone: string;
  booker_national_code: string;
  rooms: ReserveRoom[];
  special_requests?: string;
}

export interface Reserve {
  confirmation_code: string;
  property_id: number;
  property_name: string;
  check_in: string;
  check_out: string;
  status: ReserveDetailsStatus;
  state: ReserveDetailsState;
  total_rack_price: number;
  total_sales_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  reject_reason: string | null;
}

export interface ReserveRoomDetails {
  id: number;
  room_type_id: number;
  room_type_name: string;
  rate_plan_id: number;
  rate_plan_name: string;
  meal_plan: string;
  guests: ReserveGuest[];
  prices: RatePlanPrice[];
  total_rack_price: number;
  total_sales_price: number;
  currency: string;
}

export interface ReserveDetails extends Reserve {
  booker_first_name: string;
  booker_last_name: string;
  booker_email: string;
  booker_phone: string;
  booker_national_code: string;
  special_requests: string | null;
  rooms: ReserveRoomDetails[];
  property: Property;
  activities: ReserveActivity[];
}

export interface ReserveActivity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  user_name: string | null;
}

// ==================== ACCOUNTING ====================

export interface AccountTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface Transactions {
  items: AccountTransaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Receipt {
  id: number;
  number: string;
  type: 'invoice' | 'credit_note';
  amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
}

// ==================== WEBHOOK ====================

export interface WebHookPayload {
  method: string;
  value: Record<string, unknown>;
}

export interface WebHookConfig {
  url: string;
  is_active: boolean;
}

// ==================== RULES ====================

export interface Rule {
  id: number;
  name: string;
  description: string;
  type: string;
  value: string | number | boolean;
}

// ==================== USER ====================

export interface GRSUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// ==================== API RESPONSE ====================

export interface GRSResponse<T> {
  code: number;
  message: string;
  errors: Record<string, string[]> | null;
  value: T;
}

export interface GRSPaginatedResponse<T> {
  code: number;
  message: string;
  errors: Record<string, string[]> | null;
  value: {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// ==================== AVAILABLE ROOMS REQUEST ====================

export interface AvailableRoomsRequest {
  property_id: number;
  check_in: string;
  check_out: string;
  adults?: number;
  children_ages?: number[];
}

// ==================== SUGGESTION REQUEST ====================

export interface SuggestionRequest {
  city_id?: number;
  city_slug?: string;
  check_in: string;
  check_out: string;
  adults?: number;
  children_ages?: number[];
  stars?: number[];
  min_price?: number;
  max_price?: number;
  facilities?: number[];
  property_types?: number[];
  sort_by?: 'price' | 'stars' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ==================== CANCEL/MODIFY ====================

export interface CancelRequest {
  confirmation_code: string;
  reason?: string;
}

export interface ModifyRequest {
  confirmation_code: string;
  check_in?: string;
  check_out?: string;
  rooms?: ReserveRoom[];
}

export interface AcceptCancelRequest {
  confirmation_code: string;
}

export interface AcceptModifyRequest {
  confirmation_code: string;
}

export interface ExtendExpiryRequest {
  confirmation_code: string;
  minutes?: number;
}
