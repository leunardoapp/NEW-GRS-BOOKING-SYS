'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getTodayJalali,
  addDaysToJalali,
  toPersianDigits,
  formatNights,
} from '@/src/lib/jalali';
import type { City } from '@/src/types/grs';
import useSWR from 'swr';
import { JalaliDatePicker } from './jalali-date-picker';

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

  const [cityId, setCityId] = useState(defaultValues?.cityId || '');
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
            {/* City Select */}
            <Field className={isHero ? 'lg:col-span-1' : ''}>
              {!isCompact && <FieldLabel>مقصد</FieldLabel>}
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger className={isCompact ? 'h-9' : ''}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="شهر را انتخاب کنید" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Spinner className="h-5 w-5" />
                    </div>
                  ) : cities.length === 0 ? (
                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                      شهری یافت نشد
                    </div>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                        {city.province_name && city.province_name !== city.name && (
                          <span className="text-muted-foreground mr-1">
                            ({city.province_name})
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            {/* Check-in Date */}
            <Field>
              {!isCompact && <FieldLabel>تاریخ ورود</FieldLabel>}
              <JalaliDatePicker
                value={checkIn}
                onChange={setCheckIn}
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