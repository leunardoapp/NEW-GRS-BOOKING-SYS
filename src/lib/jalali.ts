import jalaali from 'jalaali-js';

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

// Persian day names
const PERSIAN_DAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

// Persian numerals
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert a number to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

/**
 * Convert Persian digits back to English
 */
export function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/**
 * Convert a Date or string to Jalali date object
 */
export function toJalaliObject(date: Date | string): { jy: number; jm: number; jd: number } {
  const d = typeof date === 'string' ? new Date(date) : date;
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Convert a Date or string to Jalali date string (YYYY/MM/DD)
 */
export function toJalali(date: Date | string): string {
  const { jy, jm, jd } = toJalaliObject(date);
  const month = String(jm).padStart(2, '0');
  const day = String(jd).padStart(2, '0');
  return `${jy}/${month}/${day}`;
}

/**
 * Convert a Date or string to Persian Jalali date string
 */
export function toJalaliPersian(date: Date | string): string {
  return toPersianDigits(toJalali(date));
}

/**
 * Convert Jalali date string (YYYY/MM/DD or YYYY-MM-DD) to Gregorian date string (YYYY-MM-DD)
 */
export function toGregorian(jalaliStr: string): string {
  const normalized = toEnglishDigits(jalaliStr).replace(/\//g, '-');
  const [jy, jm, jd] = normalized.split('-').map(Number);
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  const month = String(gm).padStart(2, '0');
  const day = String(gd).padStart(2, '0');
  return `${gy}-${month}-${day}`;
}

/**
 * Convert Jalali date string to Date object
 */
export function toGregorianDate(jalaliStr: string): Date {
  const gregorian = toGregorian(jalaliStr);
  return new Date(gregorian);
}

/**
 * Format a date for display (e.g., "۱۵ آذر ۱۴۰۳")
 */
export function formatJalaliDisplay(date: Date | string): string {
  const { jy, jm, jd } = toJalaliObject(date);
  const monthName = PERSIAN_MONTHS[jm - 1];
  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Format a date with day name (e.g., "جمعه ۱۵ آذر ۱۴۰۳")
 */
export function formatJalaliWithDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayName = PERSIAN_DAYS[d.getDay()];
  return `${dayName} ${formatJalaliDisplay(date)}`;
}

/**
 * Format a date range (e.g., "۱۵ تا ۱۸ آذر ۱۴۰۳" or "۱۵ آذر تا ۲ دی ۱۴۰۳")
 */
export function formatJalaliRange(checkIn: Date | string, checkOut: Date | string): string {
  const inObj = toJalaliObject(checkIn);
  const outObj = toJalaliObject(checkOut);

  if (inObj.jy === outObj.jy && inObj.jm === outObj.jm) {
    // Same month and year
    const monthName = PERSIAN_MONTHS[inObj.jm - 1];
    return `${toPersianDigits(inObj.jd)} تا ${toPersianDigits(outObj.jd)} ${monthName} ${toPersianDigits(inObj.jy)}`;
  } else if (inObj.jy === outObj.jy) {
    // Same year, different month
    return `${toPersianDigits(inObj.jd)} ${PERSIAN_MONTHS[inObj.jm - 1]} تا ${toPersianDigits(outObj.jd)} ${PERSIAN_MONTHS[outObj.jm - 1]} ${toPersianDigits(inObj.jy)}`;
  } else {
    // Different year
    return `${formatJalaliDisplay(checkIn)} تا ${formatJalaliDisplay(checkOut)}`;
  }
}

/**
 * Get the month name from a Jalali date
 */
export function getJalaliMonthName(date: Date | string): string {
  const { jm } = toJalaliObject(date);
  return PERSIAN_MONTHS[jm - 1];
}

/**
 * Get the current Jalali date
 */
export function getCurrentJalali(): { jy: number; jm: number; jd: number } {
  return toJalaliObject(new Date());
}

/**
 * Check if a Jalali date string is valid
 */
export function isValidJalali(jalaliStr: string): boolean {
  try {
    const normalized = toEnglishDigits(jalaliStr).replace(/\//g, '-');
    const [jy, jm, jd] = normalized.split('-').map(Number);
    return jalaali.isValidJalaaliDate(jy, jm, jd);
  } catch {
    return false;
  }
}

/**
 * Format price in Tomans with Persian numerals
 * Input is in Rials, output is in Tomans
 */
export function formatPrice(rials: number): string {
  const tomans = Math.floor(rials / 10);
  const formatted = tomans.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

/**
 * Format price in Tomans with Persian numerals, without currency label
 */
export function formatPriceNumber(rials: number): string {
  const tomans = Math.floor(rials / 10);
  return tomans.toLocaleString('fa-IR');
}

/**
 * Calculate nights between two dates
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const d1 = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const d2 = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format number of nights in Persian
 */
export function formatNights(checkIn: Date | string, checkOut: Date | string): string {
  const nights = calculateNights(checkIn, checkOut);
  return `${toPersianDigits(nights)} شب`;
}

/**
 * Get today's date in Jalali format (YYYY/MM/DD)
 */
export function getTodayJalali(): string {
  return toJalali(new Date());
}

/**
 * Add days to a Jalali date string
 */
export function addDaysToJalali(jalaliStr: string, days: number): string {
  const gregorianDate = toGregorianDate(jalaliStr);
  gregorianDate.setDate(gregorianDate.getDate() + days);
  return toJalali(gregorianDate);
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Format a timestamp to Persian datetime
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jalaliDate = formatJalaliDisplay(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${jalaliDate} - ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
}

/**
 * Format time only in Persian
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
}

/**
 * Get relative time in Persian (e.g., "۲ روز پیش", "۳ ساعت دیگر")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs > 0) {
    // Future
    if (diffMins < 60) return `${toPersianDigits(diffMins)} دقیقه دیگر`;
    if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت دیگر`;
    if (diffDays < 7) return `${toPersianDigits(diffDays)} روز دیگر`;
    return formatJalaliDisplay(d);
  } else {
    // Past
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    if (absMins < 60) return `${toPersianDigits(absMins)} دقیقه پیش`;
    if (absHours < 24) return `${toPersianDigits(absHours)} ساعت پیش`;
    if (absDays < 7) return `${toPersianDigits(absDays)} روز پیش`;
    return formatJalaliDisplay(d);
  }
}
