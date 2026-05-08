"use client"

import { useState, useCallback } from "react"
import jalaali from "jalaali-js"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Constants ───────────────────────────────────────────────────────────────

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر",     "مرداد",    "شهریور",
  "مهر",     "آبان",     "آذر",
  "دی",      "بهمن",     "اسفند",
]

// Week days starting Saturday (Iran standard)
const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

const PERSIAN_DAY_NAMES = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنج‌شنبه", "جمعه",
]

// ─── Utility helpers ──────────────────────────────────────────────────────────

function toPersianDigits(n: number): string {
  return n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d])
}

function gregorianToJalali(date: Date) {
  return jalaali.toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
}

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

function daysInJalaliMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm)
}

/**
 * Returns 0–6 where 0 = Saturday, 6 = Friday (Iran week order).
 */
function jalaliWeekday(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd)
  // JS Sunday=0…Saturday=6  →  Iran Saturday=0…Friday=6
  return (g.getDay() + 1) % 7
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isDateBefore(a: Date, b: Date) {
  return a < b && !isSameDay(a, b)
}

/**
 * Format a Gregorian Date as a full Persian string.
 * e.g. "پنج‌شنبه ۱۷ اردیبهشت ۱۴۰۵"
 */
export function formatJalaliDate(date: Date): string {
  const { jy, jm, jd } = gregorianToJalali(date)
  const g = date
  // weekday index in Iran order (0=Sat)
  const wIdx = (g.getDay() + 1) % 7
  return `${PERSIAN_DAY_NAMES[wIdx]} ${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface JalaliMonthViewProps {
  jYear: number
  jMonth: number // 1-based
  selected: { from?: Date; to?: Date }
  hovered?: Date | null
  today: { jy: number; jm: number; jd: number }
  minDate?: Date
  onDayClick: (date: Date) => void
  onDayHover: (date: Date | null) => void
}

// ─── Month grid ───────────────────────────────────────────────────────────────

function JalaliMonthView({
  jYear,
  jMonth,
  selected,
  hovered,
  today,
  minDate,
  onDayClick,
  onDayHover,
}: JalaliMonthViewProps) {
  const daysCount = daysInJalaliMonth(jYear, jMonth)
  const firstWeekday = jalaliWeekday(jYear, jMonth, 1) // 0=Sat

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none" dir="rtl">
      {/* Week-day headers */}
      <div className="grid grid-cols-7 mb-1">
        {PERSIAN_WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((jd, idx) => {
          if (!jd)
            return <div key={`empty-${idx}`} className="h-9 w-full" />

          const gDate = jalaliToGregorian(jYear, jMonth, jd)
          const isToday =
            jYear === today.jy && jMonth === today.jm && jd === today.jd
          const isDisabled = minDate
            ? isDateBefore(gDate, minDate) && !isSameDay(gDate, minDate)
            : false

          const isStart = selected.from && isSameDay(gDate, selected.from)
          const isEnd = selected.to && isSameDay(gDate, selected.to)
          const isSelected = isStart || isEnd

          // Determine if day is within the highlighted range
          const rangeEnd = selected.to ?? (hovered && selected.from ? hovered : undefined)
          const inRange =
            selected.from &&
            rangeEnd &&
            gDate > selected.from &&
            gDate < rangeEnd &&
            !isSameDay(gDate, selected.from) &&
            !isSameDay(gDate, rangeEnd)

          return (
            <div
              key={jd}
              className={cn(
                "relative h-9 flex items-center justify-center text-sm",
                inRange && "bg-primary/10",
                isStart && "rounded-r-full bg-primary/10",
                isEnd && "rounded-l-full bg-primary/10",
              )}
            >
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onDayClick(gDate)}
                onMouseEnter={() => !isDisabled && onDayHover(gDate)}
                onMouseLeave={() => onDayHover(null)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors font-medium",
                  isDisabled && "opacity-30 cursor-not-allowed",
                  !isDisabled && !isSelected && "hover:bg-accent hover:text-accent-foreground",
                  isToday && !isSelected && "border border-primary text-primary",
                  isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 z-10",
                )}
              >
                {toPersianDigits(jd)}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Caption (month/year nav) ─────────────────────────────────────────────────

interface CaptionProps {
  jYear: number
  jMonth: number
  onPrev: () => void
  onNext: () => void
}

function JalaliCaption({ jYear, jMonth, onPrev, onNext }: CaptionProps) {
  return (
    <div className="flex items-center justify-between mb-3 px-1" dir="rtl">
      <button
        type="button"
        onClick={onPrev}
        className="p-1 rounded hover:bg-accent transition-colors"
        aria-label="ماه قبل"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold">
        {PERSIAN_MONTHS[jMonth - 1]} {toPersianDigits(jYear)}
      </span>

      <button
        type="button"
        onClick={onNext}
        className="p-1 rounded hover:bg-accent transition-colors"
        aria-label="ماه بعد"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface JalaliDateRangePickerProps {
  /** Currently selected Gregorian check-in date */
  checkIn?: Date
  /** Currently selected Gregorian check-out date */
  checkOut?: Date
  onChange: (checkIn: Date | undefined, checkOut: Date | undefined) => void
  /** Earliest selectable date (Gregorian). Defaults to today. */
  minDate?: Date
  /** Placeholder shown when no date is selected */
  placeholder?: string
  className?: string
}

export function JalaliDateRangePicker({
  checkIn,
  checkOut,
  onChange,
  minDate,
  placeholder = "انتخاب تاریخ",
  className,
}: JalaliDateRangePickerProps) {
  const todayGregorian = new Date()
  const todayJalali = gregorianToJalali(todayGregorian)
  const effectiveMin = minDate ?? new Date(todayGregorian.setHours(0, 0, 0, 0))

  // Current calendar view (Jalali month)
  const initialView = checkIn
    ? gregorianToJalali(checkIn)
    : todayJalali
  const [viewYear, setViewYear] = useState(initialView.jy)
  const [viewMonth, setViewMonth] = useState(initialView.jm)

  const [hovered, setHovered] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)

  // ── Navigation ──
  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 1) { setViewYear((y) => y - 1); return 12 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 12) { setViewYear((y) => y + 1); return 1 }
      return m + 1
    })
  }, [])

  // ── Day selection (range logic) ──
  const handleDayClick = useCallback(
    (date: Date) => {
      if (!checkIn || (checkIn && checkOut)) {
        // Start fresh selection
        onChange(date, undefined)
      } else {
        // Second click: set end date
        if (isDateBefore(date, checkIn)) {
          onChange(date, checkIn)
        } else if (isSameDay(date, checkIn)) {
          onChange(undefined, undefined)
        } else {
          onChange(checkIn, date)
          setOpen(false)
        }
      }
    },
    [checkIn, checkOut, onChange],
  )

  // ── Display label ──
  let label: React.ReactNode
  if (checkIn && checkOut) {
    label = (
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11px] text-muted-foreground">ورود — خروج</span>
        <span className="text-sm font-medium truncate">
          {formatJalaliDate(checkIn)} — {formatJalaliDate(checkOut)}
        </span>
      </span>
    )
  } else if (checkIn) {
    label = (
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11px] text-muted-foreground">ورود</span>
        <span className="text-sm font-medium">{formatJalaliDate(checkIn)}</span>
      </span>
    )
  } else {
    label = <span className="text-muted-foreground text-sm">{placeholder}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-right gap-2 h-auto py-2 px-3",
            className,
          )}
          dir="rtl"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 min-w-0 text-right overflow-hidden">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4 shadow-xl"
        align="start"
        dir="rtl"
      >
        {/* Helper text */}
        <p className="text-xs text-muted-foreground mb-3 text-center">
          {!checkIn
            ? "تاریخ ورود را انتخاب کنید"
            : !checkOut
            ? "تاریخ خروج را انتخاب کنید"
            : "برای تغییر، روی تاریخ ورود کلیک کنید"}
        </p>

        <JalaliCaption
          jYear={viewYear}
          jMonth={viewMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        <JalaliMonthView
          jYear={viewYear}
          jMonth={viewMonth}
          selected={{ from: checkIn, to: checkOut }}
          hovered={hovered}
          today={todayJalali}
          minDate={effectiveMin}
          onDayClick={handleDayClick}
          onDayHover={setHovered}
        />

        {/* Clear button */}
        {(checkIn || checkOut) && (
          <div className="mt-3 border-t pt-3 text-center">
            <button
              type="button"
              onClick={() => onChange(undefined, undefined)}
              className="text-xs text-destructive hover:underline"
            >
              پاک کردن تاریخ‌ها
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─── Single-date variant (for cases you need just one date) ──────────────────

interface JalaliSingleDatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  placeholder?: string
  className?: string
}

export function JalaliSingleDatePicker({
  value,
  onChange,
  minDate,
  placeholder = "انتخاب تاریخ",
  className,
}: JalaliSingleDatePickerProps) {
  const todayGregorian = new Date()
  const todayJalali = gregorianToJalali(todayGregorian)
  const effectiveMin = minDate ?? new Date(new Date().setHours(0, 0, 0, 0))

  const initialView = value ? gregorianToJalali(value) : todayJalali
  const [viewYear, setViewYear] = useState(initialView.jy)
  const [viewMonth, setViewMonth] = useState(initialView.jm)
  const [open, setOpen] = useState(false)

  const prevMonth = () =>
    setViewMonth((m) => { if (m === 1) { setViewYear((y) => y - 1); return 12 } return m - 1 })
  const nextMonth = () =>
    setViewMonth((m) => { if (m === 12) { setViewYear((y) => y + 1); return 1 } return m + 1 })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-right gap-2 h-auto py-2 px-3", className)}
          dir="rtl"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 min-w-0 text-right overflow-hidden">
            {value ? (
              <span className="text-sm font-medium">{formatJalaliDate(value)}</span>
            ) : (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            )}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-4 shadow-xl" align="start" dir="rtl">
        <JalaliCaption
          jYear={viewYear}
          jMonth={viewMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
        <JalaliMonthView
          jYear={viewYear}
          jMonth={viewMonth}
          selected={{ from: value }}
          today={todayJalali}
          minDate={effectiveMin}
          onDayClick={(d) => { onChange(d); setOpen(false) }}
          onDayHover={() => {}}
        />
        {value && (
          <div className="mt-3 border-t pt-3 text-center">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-xs text-destructive hover:underline"
            >
              پاک کردن تاریخ
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
