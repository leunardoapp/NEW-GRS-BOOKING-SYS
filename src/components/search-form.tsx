"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Users, Minus, Plus, ChevronDown, Hotel as HotelIcon, Star, History, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { JalaliDateRangePicker, formatJalaliDate } from "./jalali-date-picker"

// ─── Types ────────────────────────────────────────────────────────────────────

interface City {
  id: string | number
  name: string
  englishName?: string
  name_en?: string
}

interface HotelSuggestion {
  id: number
  name: string
  cityName: string
  image?: string
}

// ─── Static data (matches promt.txt & IMPLEMENTATION_SUMMARY) ────────────────

const DEFAULT_CITIES = [
  { id: "isfahan",  name: "اصفهان", englishName: "Isfahan" },
  { id: "shiraz",   name: "شیراز",  englishName: "Shiraz"  },
  { id: "mashhad",  name: "مشهد",   englishName: "Mashhad" },
  { id: "tabriz",   name: "تبریز",  englishName: "Tabriz"  },
  { id: "yazd",     name: "یزد",    englishName: "Yazd"    },
]

// ─── Guests selector ─────────────────────────────────────────────────────────

interface GuestsSelectorProps {
  adults: number
  children: number
  rooms: number
  onChange: (adults: number, children: number, rooms: number) => void
}

function GuestsSelector({ adults, children, rooms, onChange }: GuestsSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const Counter = ({
    label,
    sub,
    value,
    onInc,
    onDec,
    min = 0,
  }: {
    label: string
    sub: string
    value: number
    onInc: () => void
    onDec: () => void
    min?: number
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDec}
          disabled={value <= min}
          className="h-9 w-9 rounded-xl border-2 flex items-center justify-center hover:bg-accent disabled:opacity-20 transition-all active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-base font-black">{value}</span>
        <button
          type="button"
          onClick={onInc}
          className="h-9 w-9 rounded-xl border-2 flex items-center justify-center hover:bg-accent transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const label = `${adults + children} نفر، ${rooms} اتاق`

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-background/50 backdrop-blur-sm text-right",
          "hover:border-primary/40 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "border-primary ring-4 ring-primary/10",
        )}
        dir="rtl"
      >
        <Users className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">تعداد مسافران</span>
            <span className="text-sm font-bold truncate">{label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-3 right-0 z-50 w-80 rounded-3xl border bg-popover/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 divide-y animate-in fade-in zoom-in duration-200"
          dir="rtl"
        >
          <Counter
            label="بزرگسال"
            sub="۱۲ سال و بالاتر"
            value={adults}
            min={1}
            onInc={() => onChange(adults + 1, children, rooms)}
            onDec={() => onChange(Math.max(1, adults - 1), children, rooms)}
          />
          <Counter
            label="کودک"
            sub="زیر ۱۲ سال"
            value={children}
            onInc={() => onChange(adults, children + 1, rooms)}
            onDec={() => onChange(adults, Math.max(0, children - 1), rooms)}
          />
          <Counter
            label="اتاق"
            sub="تعداد واحدهای اقامتی"
            value={rooms}
            min={1}
            onInc={() => onChange(adults, children, rooms + 1)}
            onDec={() => onChange(adults, children, Math.max(1, rooms - 1))}
          />
          <div className="pt-5">
            <Button
              type="button"
              className="w-full rounded-2xl font-black h-12 shadow-lg hover:shadow-primary/20 transition-all"
              onClick={() => setOpen(false)}
            >
              تأیید و ادامه
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── City / Hotel autocomplete ────────────────────────────────────────────────

interface AutocompleteProps {
  value: string
  onSelect: (value: string, type: "city" | "hotel", id: string | number) => void
}

function CityHotelAutocomplete({ value, onSelect }: AutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [cities, setCities] = useState<any[]>([])
  const [hotels, setHotels] = useState<HotelSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setHotels([]);
      setCities([]);
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setHotels(data.hotels ?? [])
          setCities(data.cities ?? [])
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (display: string, type: "city" | "hotel", id: string | number) => {
    setQuery(display)
    setOpen(false)
    onSelect(display, type, id)
  }

  return (
    <div ref={ref} className="relative w-full" dir="rtl">
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3 rounded-2xl border-2 bg-background/50 backdrop-blur-sm",
          "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300",
        )}
      >
        <MapPin className="h-6 w-6 shrink-0 text-primary" />
        <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">مقصد شما (شهر یا هتل)</span>
            <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="کجا می‌خواهید اقامت کنید؟"
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/60 h-6"
            autoComplete="off"
            />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setHotels([]); setCities([]); inputRef.current?.focus() }}
            className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-all active:scale-90"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-3 right-0 left-0 z-50 rounded-[2rem] border bg-popover/95 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.25)] overflow-hidden max-h-[32rem] overflow-y-auto animate-in fade-in zoom-in duration-300">
          {query.trim().length === 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5 px-2">
                <Sparkles className="h-5 w-5 text-primary fill-primary/20" />
                <p className="text-xs font-black text-foreground uppercase tracking-[0.15em]">
                  محبوب‌ترین مقصدهای ایران
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_CITIES.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city.name, "city", city.id)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-primary/10 text-right transition-all group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                        <MapPin className="h-5 w-5 text-primary/60 group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-bold">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(cities.length > 0 || hotels.length > 0) && (
            <div className="divide-y divide-border/30">
              {cities.length > 0 && (
                <div className="p-3">
                    <p className="text-[10px] font-black text-muted-foreground px-4 pt-3 pb-3 uppercase tracking-[0.2em]">شهرها</p>
                    {cities.map((city) => (
                    <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelect(city.name, "city", city.id)}
                        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-primary/5 text-right transition-all group rounded-2xl"
                    >
                        <div className="h-11 w-11 rounded-[1rem] bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                        <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                        <span className="text-base font-black block group-hover:text-primary transition-colors leading-none mb-1">{city.name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">{city.province_name || city.name_en}</span>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground/15 -rotate-90" />
                    </button>
                    ))}
                </div>
              )}

              {hotels.length > 0 && (
                <div className="p-3">
                    <p className="text-[10px] font-black text-muted-foreground px-4 pt-3 pb-3 uppercase tracking-[0.2em]">هتل‌های منتخب</p>
                    {hotels.map((hotel) => (
                    <button
                        key={hotel.id}
                        type="button"
                        onClick={() => handleSelect(hotel.name, "hotel", hotel.id)}
                        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-primary/5 text-right transition-all group rounded-2xl"
                    >
                        {hotel.image ? (
                        <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="h-14 w-14 rounded-[1rem] object-cover shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                        />
                        ) : (
                        <div className="h-14 w-14 rounded-[1rem] bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                            <HotelIcon className="h-7 w-7 text-primary" />
                        </div>
                        )}
                        <div className="flex-1 min-w-0 text-right">
                        <p className="text-base font-black truncate group-hover:text-primary transition-colors leading-none mb-1">{hotel.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate font-semibold">{hotel.cityName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-400/15 px-2.5 py-1.5 rounded-xl border border-yellow-400/20">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-[11px] font-black text-yellow-700">۴.۸</span>
                        </div>
                    </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {loading && query.length >= 2 && (
            <div className="p-12 text-center">
              <div className="relative inline-block h-10 w-10 mb-4">
                  <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20"></div>
                  <div className="relative h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <p className="text-xs font-black text-foreground/80 tracking-tighter">در حال جستجوی بهترین پیشنهادها...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Search Form ─────────────────────────────────────────────────────────

interface SearchFormProps {
  variant?: "home" | "compact"
  initialCity?: string
  initialCheckIn?: Date
  initialCheckOut?: Date
}

export function SearchForm({
  variant = "home",
  initialCity = "",
  initialCheckIn,
  initialCheckOut,
}: SearchFormProps) {
  const router = useRouter()

  const [destination, setDestination] = useState(initialCity)
  const [destinationType, setDestinationType] = useState<"city" | "hotel">("city")
  const [destinationId, setDestinationId] = useState<string | number>("")

  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn)
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut)

  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [rooms, setRooms] = useState(1)

  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!destination.trim()) { setError("لطفاً مقصد خود را انتخاب کنید"); return }
    if (!checkIn)            { setError("تاریخ ورود را وارد کنید"); return }
    if (!checkOut)           { setError("تاریخ خروج را وارد کنید"); return }

    const params = new URLSearchParams({
      check_in:  checkIn.toISOString().split("T")[0],
      check_out: checkOut.toISOString().split("T")[0],
      adults:    String(adults),
      children:  String(children),
      rooms:     String(rooms),
    })

    if (destinationType === "hotel" && destinationId) {
      router.push(`/hotels/${destinationId}?${params}`)
    } else {
      params.set("city", destination)
      router.push(`/search?${params}`)
    }
  }

  const isHome = variant === "home"

  return (
    <div className={cn("w-full max-w-6xl mx-auto px-4", isHome ? "mb-10" : "")}>
        <form
        onSubmit={handleSubmit}
        className={cn(
            "w-full transition-all duration-700 relative",
            isHome
            ? "bg-white/95 dark:bg-card/95 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-white/50 p-2 md:p-4"
            : "bg-card/98 backdrop-blur-2xl rounded-[2rem] border border-border/50 p-2 shadow-2xl",
        )}
        dir="rtl"
        >
        <div
            className={cn(
            "flex flex-col lg:flex-row gap-3 items-stretch",
            )}
        >
            {/* 1. Destination */}
            <div className="flex-[1.5] min-w-0">
            <CityHotelAutocomplete
                value={destination}
                onSelect={(val, type, id) => {
                setDestination(val)
                setDestinationType(type)
                setDestinationId(id)
                }}
            />
            </div>

            {/* 2. Date range */}
            <div className="flex-1 lg:max-w-xs">
            <JalaliDateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co) }}
                placeholder="تاریخ اقامت"
                className="h-full rounded-2xl border-2 py-4"
            />
            </div>

            {/* 3. Guests */}
            <div className="lg:w-64">
            <GuestsSelector
                adults={adults}
                children={children}
                rooms={rooms}
                onChange={(a, c, r) => { setAdults(a); setChildren(c); setRooms(r) }}
            />
            </div>

            {/* 4. Submit */}
            <div className="lg:w-48 flex">
            <Button
                type="submit"
                size="xl"
                className={cn(
                "w-full rounded-[1.5rem] gap-3 font-black text-lg transition-all duration-500",
                "bg-primary hover:bg-primary/90 shadow-[0_15px_35px_-5px_rgba(var(--primary),0.5)]",
                "active:scale-95 h-full py-5 lg:py-0"
                )}
            >
                <Search className="h-7 w-7 stroke-[4px]" />
                جستجو
            </Button>
            </div>
        </div>

        {/* Dynamic error bubble */}
        {error && (
            <div className="absolute -bottom-10 right-10 bg-destructive text-white px-4 py-1.5 rounded-full text-xs font-black shadow-xl animate-in slide-in-from-top-4 duration-300">
                {error}
            </div>
        )}
        </form>
    </div>
  )
}

export function CompactSearchForm(props: Omit<SearchFormProps, "variant">) {
  return <SearchForm {...props} variant="compact" />
}
