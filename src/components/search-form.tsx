'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, Minus, Plus, X, Hotel as HotelIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  toJalaliPersian,
  toGregorian,
  toEnglishDigits,
  isValidJalali,
  addDaysToJalali,
  toPersianDigits,
  formatNights,
  formatJalaliWithDay,
} from '@/src/lib/jalali';
import type { City } from '@/src/types/grs';
import useSWR from 'swr';
import { JalaliDatePicker } from './jalali-date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SearchFormProps {
  defaultValues?: {
    cityId?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    childrenAges?: number[];
  };
  variant?: 'default' | 'compact' | 'hero';
  onSearch?: (params: URLSearchParams) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Cities to show initially (without Tehran)
const INITIAL_CITIES = ['اصفهان', 'شیراز', 'مشهد', 'تبریز', 'یزد'];

export function SearchForm({
  defaultValues,
  variant = 'default',
  onSearch,
}: SearchFormProps) {
  const router = useRouter();

  const { data: citiesResponse, isLoading: citiesLoading } = useSWR<{
    code: number;
    value: { cities: City[]; total: number };
  }>('/api/grs/cities', fetcher);
  const cities = Array.isArray(citiesResponse?.value?.cities) ? citiesResponse.value.cities : [];

  // Fetch hotels for autocomplete (lazy load when user types)
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hotelSearchQuery.length >= 2) {
        setHotelsLoading(true);
        try {
          // Search for properties by name
          const response = await fetch(`/api/grs/properties?search=${encodeURIComponent(hotelSearchQuery)}`);
          const data = await response.json();
          if (data.value?.properties) {
            setHotels(data.value.properties.slice(0, 10));
          }
        } catch (error) {
          console.error('Failed to search hotels:', error);
        } finally {
          setHotelsLoading(false);
        }
      } else {
        setHotels([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hotelSearchQuery]);

  const [cityId, setCityId] = useState(defaultValues?.cityId || '');
  const [cityName, setCityName] = useState('');
  const [checkIn, setCheckIn] = useState(
    defaultValues?.checkIn
      ? toJalaliPersian(defaultValues.checkIn)
      : toJalaliPersian(new Date())
  );
  const [checkOut, setCheckOut] = useState(
    defaultValues?.checkOut
      ? toJalaliPersian(defaultValues.checkOut)
      : toJalaliPersian(addDaysToJalali(toJalaliPersian(new Date()), 1))
  );
  const [adults, setAdults] = useState(defaultValues?.adults || 2);
  const [childrenAges, setChildrenAges] = useState<number[]>(
    defaultValues?.childrenAges || []
  );
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [citySearchText, setCitySearchText] = useState('');

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearchText) {
      // Show only initial cities when no search text
      return cities.filter(city => INITIAL_CITIES.includes(city.name));
    }
    return cities.filter(city => 
      city.name.toLowerCase().includes(citySearchText.toLowerCase()) ||
      city.name_en.toLowerCase().includes(citySearchText.toLowerCase())
    );
  }, [cities, citySearchText]);

  // Combined suggestions (cities + hotels)
  const combinedSuggestions = useMemo(() => {
    if (!citySearchText) return [];
    
    const cityResults = filteredCities.map(city => ({
      type: 'city' as const,
      id: String(city.id),
      name: city.name,
      subname: city.province_name,
    }));

    const hotelResults = hotels.map(hotel => ({
      type: 'hotel' as const,
      id: String(hotel.id),
      name: hotel.name,
      subname: hotel.city_name,
      image: hotel.main_image?.url,
    }));

    return [...cityResults, ...hotelResults].slice(0, 10);
  }, [filteredCities, hotels, citySearchText]);

  const handleSelectSuggestion = (suggestion: typeof combinedSuggestions[0]) => {
    if (suggestion.type === 'city') {
      setCityId(suggestion.id);
      setCityName(suggestion.name);
    } else {
      // For hotel selection, we'll navigate to the hotel page
      router.push(`/hotels/${suggestion.id}`);
      return;
    }
    setCitySearchOpen(false);
    setCitySearchText('');
  };

  const checkInValid = isValidJalali(toEnglishDigits(checkIn));
  const checkOutValid = isValidJalali(toEnglishDigits(checkOut));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cityId || !checkInValid || !checkOutValid) return;

    const params = new URLSearchParams();
    params.set('city_id', cityId);
    params.set('check_in', toGregorian(toEnglishDigits(checkIn)));
    params.set('check_out', toGregorian(toEnglishDigits(checkOut)));
    params.set('adults_count', String(adults)); // ← نام صحیح طبق GRS
    if (childrenAges.length > 0) {
      params.set('children', childrenAges.join(',')); // ← نام صحیح طبق GRS
    }

    if (onSearch) {
      onSearch(params);
    } else {
      router.push(`/search?${params.toString()}`);
    }
  };

  const addChild = () => {
    if (childrenAges.length < 4) setChildrenAges([...childrenAges, 5]);
  };

  const removeChild = (index: number) => {
    setChildrenAges(childrenAges.filter((_, i) => i !== index));
  };

  const updateChildAge = (index: number, age: number) => {
    const updated = [...childrenAges];
    updated[index] = age;
    setChildrenAges(updated);
  };

  const totalGuests = adults + childrenAges.length;
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <form onSubmit={handleSubmit}>
      <Card className={isHero ? 'shadow-xl' : ''}>
        <CardContent className={isHero ? 'p-6' : isCompact ? 'p-3' : 'p-4'}>
          <div
            className={`grid gap-4 ${
              isHero
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
                : isCompact
                ? 'grid-cols-2 md:grid-cols-5 gap-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {/* City Select with Autocomplete */}
            <Field className={isHero ? 'lg:col-span-1' : ''}>
              {!isCompact && <FieldLabel>مقصد</FieldLabel>}
              <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start font-normal ${isCompact ? 'h-9' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {cityName || (cityId ? cities.find(c => String(c.id) === cityId)?.name : 'شهر یا هتل را انتخاب کنید')}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="space-y-1 p-2">
                    <Input
                      placeholder="جستجوی شهر یا هتل..."
                      value={citySearchText}
                      onChange={(e) => {
                        setCitySearchText(e.target.value);
                        setHotelSearchQuery(e.target.value);
                      }}
                      className="h-9"
                      autoFocus
                    />
                    {citiesLoading || hotelsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner className="h-5 w-5" />
                      </div>
                    ) : combinedSuggestions.length === 0 ? (
                      citySearchText ? (
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                          موردی یافت نشد
                        </div>
                      ) : (
                        <div className="p-2">
                          <div className="text-xs text-muted-foreground mb-2 px-2">شهرهای پیشنهادی</div>
                          {filteredCities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              className="w-full text-right px-2 py-1.5 rounded hover:bg-accent text-sm"
                              onClick={() => handleSelectSuggestion({
                                type: 'city',
                                id: String(city.id),
                                name: city.name,
                                subname: city.province_name,
                              })}
                            >
                              {city.name}
                              {city.province_name && city.province_name !== city.name && (
                                <span className="text-muted-foreground mr-1 text-xs">
                                  ({city.province_name})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )
                    ) : (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-1">
                          {combinedSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.type}-${suggestion.id}-${index}`}
                              type="button"
                              className="w-full text-right px-2 py-2 rounded hover:bg-accent flex items-center gap-2"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              {suggestion.type === 'hotel' && suggestion.image ? (
                                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                                  <img src={suggestion.image} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                                  suggestion.type === 'hotel' ? 'bg-primary/10 text-primary' : 'bg-muted'
                                }`}>
                                  {suggestion.type === 'hotel' ? (
                                    <HotelIcon className="h-4 w-4" />
                                  ) : (
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{suggestion.name}</div>
                                {suggestion.subname && (
                                  <div className="text-xs text-muted-foreground truncate">{suggestion.subname}</div>
                                )}
                              </div>
                              {suggestion.type === 'hotel' && (
                                <Badge variant="secondary" className="text-xs">هتل</Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </Field>

            {/* Check-in Date */}
            <Field>
              {!isCompact && <FieldLabel>تاریخ ورود</FieldLabel>}
              <JalaliDatePicker
                value={checkIn}
                onChange={(date) => {
                  setCheckIn(date);
                  // Auto-update check-out if it's before new check-in
                  const checkInDate = toGregorian(toEnglishDigits(date));
                  const checkOutDate = toGregorian(toEnglishDigits(checkOut));
                  if (new Date(checkOutDate) <= new Date(checkInDate)) {
                    setCheckOut(toJalaliPersian(addDaysToJalali(date, 1)));
                  }
                }}
                displayFormat={formatJalaliWithDay}
                placeholder="۱۴۰۳/۰۹/۱۵"
                className={isCompact ? 'h-9' : ''}
              />
            </Field>

            {/* Check-out Date */}
            <Field>
              {!isCompact && <FieldLabel>تاریخ خروج</FieldLabel>}
              <JalaliDatePicker
                value={checkOut}
                onChange={setCheckOut}
                displayFormat={formatJalaliWithDay}
                placeholder="۱۴۰۳/۰۹/۱۶"
                minDate={(() => {
                  try {
                    const g = toGregorian(toEnglishDigits(checkIn));
                    return new Date(g);
                  } catch {
                    return new Date();
                  }
                })()}
                className={isCompact ? 'h-9' : ''}
              />
            </Field>

            {/* Guests */}
            <Field>
              {!isCompact && <FieldLabel>مسافران</FieldLabel>}
              <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start font-normal ${isCompact ? 'h-9' : ''}`}
                  >
                    <Users className="h-4 w-4 ml-2" />
                    {toPersianDigits(totalGuests)} مسافر
                    {childrenAges.length > 0 && (
                      <span className="text-muted-foreground mr-1">
                        ({toPersianDigits(childrenAges.length)} کودک)
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">بزرگسال</div>
                        <div className="text-sm text-muted-foreground">۱۲ سال به بالا</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{toPersianDigits(adults)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setAdults(Math.min(10, adults + 1))}
                          disabled={adults >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">کودک</div>
                          <div className="text-sm text-muted-foreground">۰ تا ۱۱ سال</div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChild}
                          disabled={childrenAges.length >= 4}
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          افزودن
                        </Button>
                      </div>

                      {childrenAges.length > 0 && (
                        <div className="space-y-2">
                          {childrenAges.map((age, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Select
                                value={String(age)}
                                onValueChange={(v) => updateChildAge(index, parseInt(v))}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i} value={String(i)}>
                                      {i === 0 ? 'زیر ۱ سال' : `${toPersianDigits(i)} سال`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeChild(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </Field>

            {/* Search Button */}
            <div className={isHero ? 'lg:col-span-1 flex items-end' : 'flex items-end'}>
              <Button
                type="submit"
                className={`w-full ${isHero ? 'h-11' : isCompact ? 'h-9' : ''}`}
                disabled={!cityId || !checkInValid || !checkOutValid}
              >
                <Search className="h-4 w-4 ml-2" />
                جستجو
              </Button>
            </div>
          </div>

          {checkInValid && checkOutValid && (
            <div className="mt-3 text-center text-sm text-muted-foreground">
              {formatNights(
                toGregorian(toEnglishDigits(checkIn)),
                toGregorian(toEnglishDigits(checkOut))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}