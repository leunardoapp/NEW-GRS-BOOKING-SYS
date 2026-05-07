'use client';

import { use, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Hotel,
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  ChevronLeft,
  Users,
  Bed,
  Maximize,
  Eye,
  Coffee,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceDisplay } from '@/src/components/price-display';
import {
  formatJalaliRange,
  formatNights,
  toPersianDigits,
} from '@/src/lib/jalali';
import type { PropertyDetails, RoomRate } from '@/src/types/grs';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HotelDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const adults = searchParams.get('adults') || '2';
  const childrenAges = searchParams.get('children_ages');

  // Fetch property details
  const { data: propertyData, isLoading: propertyLoading } = useSWR<{
    code: number;
    value: { property: PropertyDetails }; // ✅ ساختار اصلاح شده: property درون value است
  }>(`/api/grs/properties/${resolvedParams.id}`, fetcher);

  // ✅ اصلاح شده: استخراج صحیح property
  const property = propertyData?.value?.property;

  // Fetch available rooms if dates are provided
  const roomsUrl = useMemo(() => {
    if (!checkIn || !checkOut) return null;

    const params = new URLSearchParams();
    params.set('property_id', resolvedParams.id);
    params.set('check_in', checkIn);
    params.set('check_out', checkOut);
    params.set('adults', adults);
    if (childrenAges) params.set('children_ages', childrenAges);

    return `/api/grs/available-rooms?${params.toString()}`;
  }, [resolvedParams.id, checkIn, checkOut, adults, childrenAges]);

  const { data: roomsData, isLoading: roomsLoading } = useSWR<{
    code: number;
    value: { rooms: any[] }; // ✅ ساختار واقعی API: value.rooms
  }>(roomsUrl, fetcher);

  // ✅ اصلاح شده: استخراج صحیح اتاق‌ها
  const rooms = useMemo(() => {
    if (!roomsData?.value) return [];
    
    // API یک آرایه مستقیم نیست، یک شی با کلید rooms دارد
    if (roomsData.value.rooms && Array.isArray(roomsData.value.rooms)) {
      return roomsData.value.rooms;
    }
    
    return [];
  }, [roomsData]);

  // ✅ اصلاح شده: مدیریت عکس اصلی اگر در API نبود
  const mainImage = property?.main_image || property?.images?.[0];

  const handleBookRoom = (roomRate: any) => {
    // Note: Since structure changes, we might need to adapt how we pass data
    // Assuming roomRate structure from available-rooms matches expected RoomRate
    const params = new URLSearchParams();
    params.set('property_id', resolvedParams.id);
    params.set('room_type_id', String(roomRate.room_type_id)); // ✅ از data استفاده می‌کنیم
    params.set('rate_plan_id', String(roomRate.rate_plans[0]?.id)); // ✅ اصلاح شده
    params.set('check_in', checkIn!);
    params.set('check_out', checkOut!);
    params.set('adults', adults);
    if (childrenAges) params.set('children_ages', childrenAges);

    router.push(`/booking?${params.toString()}`);
  };

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-80 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">هتل مورد نظر یافت نشد</p>
            <Button asChild>
              <Link href="/search">بازگشت به جستجو</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Hotel className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">یورزرو</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search" className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                بازگشت به جستجو
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">ورود</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">پنل کاربری</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-80">
          {mainImage ? (
            <div className="col-span-2 row-span-2 relative">
              <Image
                src={mainImage.url || `/placeholder-hotel.jpg`}
                alt={property.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="col-span-2 row-span-2 bg-muted flex items-center justify-center">
              <Hotel className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          {/* ✅ اصلاح شده: استفاده از optional chaining */}
          {property.images?.slice(0, 4).map((image, i) => (
            <div key={i} className="relative">
              <Image
                src={image.url}
                alt={image.alt || `${property.name} - ${i + 1}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {property.type}
                  </Badge>
                  <h1 className="text-2xl font-bold">{property.name}</h1>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* در API فیلد star یا stars می‌تواند باشد، از parseInt استفاده می‌کنیم */}
                  {Array.from({ length: parseInt(String(property.stars || '0')) }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.address}</span>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">ورود</div>
                  <div className="font-semibold" dir="ltr">
                    {property.check_in_time}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">خروج</div>
                  <div className="font-semibold" dir="ltr">
                    {property.check_out_time}
                  </div>
                </CardContent>
              </Card>
              {property.phone && (
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Phone className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">تلفن</div>
                    <div className="font-semibold text-sm" dir="ltr">
                      {property.phone}
                    </div>
                  </CardContent>
                </Card>
              )}
              {property.email && (
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Mail className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">ایمیل</div>
                    <div className="font-semibold text-sm truncate" dir="ltr">
                      {property.email}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="rooms">
              <TabsList>
                <TabsTrigger value="rooms">اتاق‌ها</TabsTrigger>
                <TabsTrigger value="facilities">امکانات</TabsTrigger>
                <TabsTrigger value="description">توضیحات</TabsTrigger>
                <TabsTrigger value="policies">قوانین</TabsTrigger>
              </TabsList>

              <TabsContent value="rooms" className="mt-4 space-y-4">
                {!checkIn || !checkOut ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        برای مشاهده اتاق‌های موجود، تاریخ ورود و خروج را انتخاب کنید
                      </p>
                      <Button asChild>
                        <Link href={`/search?city_id=${property.city_id}`}>
                          انتخاب تاریخ
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : roomsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Skeleton className="h-32 w-48" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-6 w-48" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        متاسفانه اتاقی برای تاریخ‌های انتخاب شده موجود نیست
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  rooms.map((roomRate) => (
                    <Card key={`${roomRate.room_type_id}-${roomRate.rate_plans[0]?.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Room Image - Placeholder as available-rooms doesn't usually send room images */}
                          <div className="relative h-32 md:w-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                             <div className="h-full w-full flex items-center justify-center">
                                <Bed className="h-8 w-8 text-muted-foreground" />
                              </div>
                          </div>

                          {/* Room Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {roomRate.room_type_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {roomRate.rate_plans[0]?.name}
                                </p>
                              </div>
                              {roomRate.rate_plans[0]?.cancelable === 1 && (
                                <Badge variant="outline" className="text-xs">
                                  قابل کنسل
                                </Badge>
                              )}
                            </div>

                            {/* Calculate total price based on API structure */}
                            {roomRate.rate_plans[0] && (
                                <>
                                    <div className="flex items-end justify-between mt-4">
                                      <div>
                                        {/* API prices are per day, we sum them or use total if provided */}
                                        {/* Using first rate plan's prices to estimate total */}
                                        {(() => {
                                            const total = roomRate.rate_plans[0].prices.reduce((acc: number, p: any) => acc + (p.grs_rate || 0), 0);
                                            return (
                                                <>
                                                    <PriceDisplay rials={total} size="lg" />
                                                    <span className="text-sm text-muted-foreground">
                                                    {' '}
                                                    / {formatNights(checkIn, checkOut)}
                                                    </span>
                                                </>
                                            );
                                        })()}
                                      </div>
                                      <Button
                                        onClick={() => handleBookRoom(roomRate)}
                                      >
                                        رزرو
                                      </Button>
                                    </div>
                                </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="facilities" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {property.facilities && property.facilities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.facilities.map((facility) => (
                          <div
                            key={facility.id}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4 text-primary" />
                            <span>{facility.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        اطلاعات امکانات موجود نیست
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {property.description ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: property.description }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        توضیحاتی برای این هتل ثبت نشده است
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="policies" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {property.policies ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: property.policies }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        قوانین خاصی ثبت نشده است
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Booking Summary */}
            {checkIn && checkOut && (
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">اطلاعات رزرو</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">تاریخ:</span>
                    <span className="font-medium">
                      {formatJalaliRange(checkIn, checkOut)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مدت اقامت:</span>
                    <span className="font-medium">
                      {formatNights(checkIn, checkOut)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مسافران:</span>
                    <span className="font-medium">
                      {toPersianDigits(parseInt(adults))} بزرگسال
                      {childrenAges && (
                        <>
                          {' + '}
                          {toPersianDigits(childrenAges.split(',').length)} کودک
                        </>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    از لیست اتاق‌ها، اتاق مورد نظر خود را انتخاب کنید
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تماس با هتل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${property.phone}`}
                      className="hover:text-primary"
                      dir="ltr"
                    >
                      {property.phone}
                    </a>
                  </div>
                )}
                {property.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${property.email}`}
                      className="hover:text-primary"
                      dir="ltr"
                    >
                      {property.email}
                    </a>
                  </div>
                )}
                {property.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={property.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                      dir="ltr"
                    >
                      وب‌سایت هتل
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}