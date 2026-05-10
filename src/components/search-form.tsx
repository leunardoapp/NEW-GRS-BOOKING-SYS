"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Users, Minus, Plus, ChevronDown, Hotel as HotelIcon, History, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { JalaliDateRangePicker, formatJalaliDate } from "./jalali-date-picker"

// ─── Types ────────────────────────────────────────────────────────────────────

interface City {
  id: string | number
  name: string
  name_en?: string
  englishName?: string
}

interface HotelSuggestion {
  id: number
  name: string
  cityName: string
  image?: string
}

// ─── Static data ────────────────

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
        <p className="text-sm font-bold">{label}</p>
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
          "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 bg-background/50 backdrop-blur-sm text-right",
          "hover:border-primary/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "border-primary ring-4 ring-primary/10",
        )}
        dir="rtl"
      >
        <Users className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">تعداد مسافران</span>
            <span className="text-sm font-bold truncate">{label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-3 right-0 z-50 w-80 rounded-2xl border bg-popover/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5 divide-y animate-in fade-in zoom-in duration-200"
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
          <div className="pt-4">
            <Button
              type="button"
              className="w-full rounded-xl font-bold h-11"
              onClick={() => setOpen(false)}
            >
              تأیید مسافران
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

  // Fetch data from our suggestions API
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

  // Close on outside click
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
          "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 bg-background/50 backdrop-blur-sm",
          "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300",
        )}
      >
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">مقصد (شهر یا هتل)</span>
            <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="کجا سفر می‌کنید؟"
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/60 h-5"
            autoComplete="off"
            />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setHotels([]); setCities([]); inputRef.current?.focus() }}
            className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-3 right-0 left-0 z-50 rounded-2xl border bg-popover/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-h-[30rem] overflow-y-auto animate-in fade-in zoom-in duration-200">
          {/* Recommendations when empty */}
          {query.trim().length === 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <p className="text-xs font-black text-foreground uppercase tracking-wider">
                  محبوب‌ترین مقصدها
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {DEFAULT_CITIES.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city.name, "city", city.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 text-right transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                        <MapPin className="h-4 w-4 text-primary/60 group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-bold">{city.name}</span>
                    <span className="text-[10px] text-muted-foreground mr-auto">{city.englishName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {(cities.length > 0 || hotels.length > 0) && (
            <div className="divide-y divide-border/40">
              {/* Cities */}
              {cities.length > 0 && (
                <div className="p-2">
                    <p className="text-[10px] font-black text-muted-foreground px-4 pt-2 pb-2 uppercase tracking-widest">شهرها</p>
                    {cities.map((city) => (
                    <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelect(city.name, "city", city.id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-primary/5 text-right transition-all group rounded-xl"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                        <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                        <span className="text-sm font-black block group-hover:text-primary transition-colors">{city.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{city.province_name || city.name_en}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/20 -rotate-90" />
                    </button>
                    ))}
                </div>
              )}

              {/* Hotels */}
              {hotels.length > 0 && (
                <div className="p-2">
                    <p className="text-[10px] font-black text-muted-foreground px-4 pt-2 pb-2 uppercase tracking-widest">هتل‌ها</p>
                    {hotels.map((hotel) => (
                    <button
                        key={hotel.id}
                        type="button"
                        onClick={() => handleSelect(hotel.name, "hotel", hotel.id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-primary/5 text-right transition-all group rounded-xl"
                    >
                        {hotel.image ? (
                        <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="h-12 w-12 rounded-2xl object-cover shrink-0 shadow-md group-hover:scale-105 transition-transform"
                        />
                        ) : (
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                            <HotelIcon className="h-6 w-6 text-primary" />
                        </div>
                        )}
                        <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-black truncate group-hover:text-primary transition-colors">{hotel.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-medium">{hotel.cityName}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-700">۴.۸</span>
                        </div>
                    </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {loading && query.length >= 2 && (
            <div className="p-10 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mb-3"></div>
              <p className="text-xs font-bold text-muted-foreground tracking-tight">در حال جستجوی اختصاصی برای شما...</p>
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

    if (!destination.trim()) { setError("لطفاً مقصد خود را مشخص کنید"); return }
    if (!checkIn)            { setError("تاریخ ورود الزامی است"); return }
    if (!checkOut)           { setError("تاریخ خروج الزامی است"); return }

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
    <div className={cn("w-full max-w-6xl mx-auto px-4", isHome ? "mb-8" : "")}>
        <form
        onSubmit={handleSubmit}
        className={cn(
            "w-full transition-all duration-500",
            isHome
            ? "bg-white/90 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] border border-white/40 p-2 md:p-3"
            : "bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 p-2 shadow-xl",
        )}
        dir="rtl"
        >
        <div
            className={cn(
            "flex flex-col lg:flex-row gap-2 items-stretch",
            )}
        >
            {/* 1. Destination */}
            <div className="flex-1 min-w-0">
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
                placeholder="تاریخ سفر"
                className="h-full rounded-xl border-2 py-3"
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
            <div className="lg:w-44 flex">
            <Button
                type="submit"
                size="xl"
                className={cn(
                "w-full rounded-2xl gap-3 font-black text-base transition-all duration-300",
                "bg-primary hover:bg-primary/90 shadow-[0_10px_25px_-5px_rgba(var(--primary),0.4)]",
                "active:scale-95 h-full py-4 lg:py-0"
                )}
            >
                <Search className="h-6 w-6 stroke-[3px]" />
                جستجو
            </Button>
            </div>
        </div>

        {/* Error message with animation */}
        {error && (
            <div className="px-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-black text-destructive text-right flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    {error}
                </p>
            </div>
        )}
        </form>
    </div>
  )
}

export function CompactSearchForm(props: Omit<SearchFormProps, "variant">) {
  return <SearchForm {...props} variant="compact" />
}
