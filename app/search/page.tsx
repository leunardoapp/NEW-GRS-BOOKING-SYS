'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { Hotel, Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchForm } from '@/src/components/search-form';
import { SuggestionCard } from '@/src/components/hotel-card';
import { formatPriceNumber, toPersianDigits } from '@/src/lib/jalali';
import type { Suggestion } from '@/src/types/grs'; // از تایپ جدید استفاده می‌کنیم
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// تابع کمکی برای یافتن ارزان‌ترین قیمت در هتل
const getMinPrice = (suggestion: Suggestion): number => {
  let min = Infinity;
  suggestion.rooms.forEach(room => {
    room.rate_plans.forEach(plan => {
      if (plan.grs_rate < min) min = plan.grs_rate;
    });
  });
  return min === Infinity ? 0 : min;
};

function SearchResults() {
  const searchParams = useSearchParams();

  const cityId = searchParams.get('city_id');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const adultsCount = searchParams.get('adults_count') || '2';
  const children = searchParams.get('children');

  const apiUrl = useMemo(() => {
    if (!cityId || !checkIn || !checkOut) return null;
    const params = new URLSearchParams();
    params.set('city_id', cityId);
    params.set('check_in', checkIn);
    params.set('check_out', checkOut);
    params.set('adults_count', adultsCount);
    if (children) params.set('children', children);
    return `/api/grs/suggestion?${params.toString()}`;
  }, [cityId, checkIn, checkOut, adultsCount, children]);

  // توجه: دیتای برگشتی از API مستقیماً لیست suggestions را در value دارد
  const { data, isLoading, error } = useSWR<{
    code: number;
    message: string;
    errors: any;
    value: { suggestions: Suggestion[]; total: number };
  }>(apiUrl, fetcher);

  const suggestions = data?.value?.suggestions || [];

  // Debug log - موقت
console.log('🔍 Debug Info:');
console.log('API Data:', data);
console.log('Suggestions:', suggestions);
console.log('Suggestions Count:', suggestions.length);
if (suggestions.length > 0) {
  console.log('First Suggestion:', suggestions[0]);
  console.log('First Suggestion Structure:', Object.keys(suggestions[0]));
}
  // حذف فیلتر ستاره چون در دیتای فعلی نیست
  // const [starFilters, setStarFilters] = useState<number[]>([]); 
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]); // افزایش محدوده به ریال
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];

    // فیلتر قیمت (بر اساس ارزان‌ترین اتاق)
    result = result.filter((s) => {
      const minPrice = getMinPrice(s);
      return minPrice >= priceRange[0] && minPrice <= priceRange[1];
    });

    // مرتب‌سازی
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = getMinPrice(a) - getMinPrice(b);
          break;
        case 'name':
          comparison = a.property_name.localeCompare(b.property_name, 'fa');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [suggestions, priceRange, sortBy, sortOrder]);

  const clearFilters = () => {
    setPriceRange([0, 500000000]);
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 500000000;

  const FilterContent = () => (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 ml-2" />
          پاک کردن فیلترها
        </Button>
      )}

      <div>
        <h3 className="font-semibold mb-3">محدوده قیمت (تومان)</h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500000000}
          step={1000000}
          className="my-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPriceNumber(priceRange[0])}</span>
          <span>{formatPriceNumber(priceRange[1])}</span>
        </div>
      </div>
    </div>
  );

  if (!apiUrl) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">جستجوی هتل</h1>
          <SearchForm variant="default" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <SearchForm
          variant="compact"
          defaultValues={{
            cityId: cityId || undefined,
            checkIn: checkIn || undefined,
            checkOut: checkOut || undefined,
            adults: parseInt(adultsCount),
            childrenAges: children ? children.split(',').map(Number) : undefined,
          }}
        />
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                فیلترها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <p className="text-muted-foreground">
                  {toPersianDigits(filteredSuggestions.length)} هتل یافت شد
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 ml-2" />
                    فیلترها
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="mr-2">1</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader><SheetTitle>فیلترها</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterContent /></div>
                </SheetContent>
              </Sheet>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [sort, order] = value.split('-') as ['price' | 'name', 'asc' | 'desc'];
                  setSortBy(sort);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-44">
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
                  <SelectItem value="price-desc">گران‌ترین</SelectItem>
                  <SelectItem value="name-asc">نام (الف تا ی)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <div className="flex"><Skeleton className="h-48 w-64" /><div className="flex-1 p-4 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div></div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">خطا در دریافت اطلاعات.</p><Button onClick={() => window.location.reload()}>تلاش مجدد</Button></CardContent></Card>
          ) : filteredSuggestions.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">{suggestions.length === 0 ? 'هتلی یافت نشد' : 'هتلی با فیلترهای انتخابی یافت نشد'}</p>{hasActiveFilters && <Button variant="outline" onClick={clearFilters}>پاک کردن فیلترها</Button>}</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.property_id}
                  suggestion={suggestion}
                  checkIn={checkIn!}
                  checkOut={checkOut!}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg"><Hotel className="h-5 w-5 text-primary-foreground" /></div>
            <span className="text-lg font-bold">یورزرو</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/auth/login">ورود</Link></Button>
            <Button size="sm" asChild><Link href="/dashboard">پنل کاربری</Link></Button>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">در حال بارگذاری...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}