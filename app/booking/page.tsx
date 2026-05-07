'use client';

import { useReducer, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Hotel,
  ChevronLeft,
  User,
  CreditCard,
  CheckCircle,
  Loader2,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PriceDisplay } from '@/src/components/price-display';
import {
  formatJalaliRange,
  formatNights,
  toPersianDigits,
  calculateNights,
} from '@/src/lib/jalali';
import type { PropertyDetails, RoomRate, ReserveGuest } from '@/src/types/grs';
import useSWR from 'swr';
import { SessionProvider } from '@/src/components/providers/session-provider';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ==================== STATE ====================

interface BookingState {
  step: 1 | 2 | 3;
  booker: {
    firstName: string;
    lastName: string;
    firstNameEn: string;
    lastNameEn: string;
    email: string;
    phone: string;
    nationalCode: string;
  };
  guests: ReserveGuest[];
  specialRequests: string;
  isSubmitting: boolean;
  error: string | null;
  confirmationCode: string | null;
}

type BookingAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'UPDATE_BOOKER'; field: keyof BookingState['booker']; value: string }
  | { type: 'UPDATE_GUEST'; index: number; field: keyof ReserveGuest; value: string | boolean }
  | { type: 'ADD_GUEST' }
  | { type: 'REMOVE_GUEST'; index: number }
  | { type: 'SET_SPECIAL_REQUESTS'; value: string }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CONFIRMATION_CODE'; code: string }
  | { type: 'RESET' };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'UPDATE_BOOKER':
      return { ...state, booker: { ...state.booker, [action.field]: action.value } };
    case 'UPDATE_GUEST':
      const newGuests = [...state.guests];
      newGuests[action.index] = { ...newGuests[action.index], [action.field]: action.value };
      return { ...state, guests: newGuests };
    case 'ADD_GUEST':
      return {
        ...state,
        guests: [
          ...state.guests,
          {
            guest_first_name: '',
            guest_last_name: '',
            guest_first_name_en: '',
            guest_last_name_en: '',
            guest_national_code: '',
            guest_birth_date: '',
            guest_gender: 'male',
            guest_is_child: false,
          },
        ],
      };
    case 'REMOVE_GUEST':
      return { ...state, guests: state.guests.filter((_, i) => i !== action.index) };
    case 'SET_SPECIAL_REQUESTS':
      return { ...state, specialRequests: action.value };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_CONFIRMATION_CODE':
      return { ...state, confirmationCode: action.code };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState: BookingState = {
  step: 1,
  booker: {
    firstName: '',
    lastName: '',
    firstNameEn: '',
    lastNameEn: '',
    email: '',
    phone: '',
    nationalCode: '',
  },
  guests: [
    {
      guest_first_name: '',
      guest_last_name: '',
      guest_first_name_en: '',
      guest_last_name_en: '',
      guest_national_code: '',
      guest_birth_date: '',
      guest_gender: 'male',
      guest_is_child: false,
    },
  ],
  specialRequests: '',
  isSubmitting: false,
  error: null,
  confirmationCode: null,
};

// ==================== STEPS ====================

const STEPS = [
  { number: 1, title: 'اطلاعات مسافران', icon: User },
  { number: 2, title: 'بررسی و تایید', icon: CheckCircle },
  { number: 3, title: 'پرداخت', icon: CreditCard },
];

// Helper function
function formatPriceNumber(rials: number): string {
  const tomans = Math.floor(rials / 10);
  return tomans.toLocaleString('fa-IR');
}

// ==================== BOOKING FORM ====================

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const propertyId = searchParams.get('property_id');
  const roomTypeId = searchParams.get('room_type_id');
  const ratePlanId = searchParams.get('rate_plan_id');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const adults = searchParams.get('adults') || '2';

  const [state, dispatch] = useReducer(bookingReducer, initialState);

  // ✅ اصلاح شده: Fetch property details
  const { data: propertyData, isLoading: propertyLoading } = useSWR<{
    code: number;
    value: { property: PropertyDetails }; // ✅ property در value است
  }>(propertyId ? `/api/grs/properties/${propertyId}` : null, fetcher);

  // ✅ اصلاح شده: استخراج property
  const property = propertyData?.value?.property;

  // ✅ اصلاح شده: Fetch room rates
  const roomsUrl = propertyId && checkIn && checkOut
    ? `/api/grs/available-rooms?property_id=${propertyId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`
    : null;

  const { data: roomsData, isLoading: roomsLoading } = useSWR<{
    code: number;
    value: { rooms: any[] };
  }>(roomsUrl, fetcher);

  // ✅ اصلاح شده: پیدا کردن اتاق انتخاب شده با ساختار جدید
  const selectedRoom = useMemo(() => {
    const rooms = Array.isArray(roomsData?.value?.rooms) ? roomsData.value.rooms : [];
    if (rooms.length === 0) return null;

    // پیدا کردن اتاق بر اساس room_type_id و rate_plan_id
    const room = rooms.find(
      (r: any) => String(r.room_type_id) === roomTypeId
    );

    if (!room || !room.rate_plans) return null;

    const ratePlan = room.rate_plans.find(
      (rp: any) => String(rp.id) === ratePlanId
    );

    if (!ratePlan) return null;

    // محاسبه قیمت کل
    const totalRackPrice = ratePlan.prices.reduce((sum: number, p: any) => sum + p.rack_rate, 0);
    const totalSalesPrice = ratePlan.prices.reduce((sum: number, p: any) => sum + p.grs_rate, 0);

    // تبدیل به ساختار RoomRate
    return {
      room_type: {
        id: room.room_type_id,
        name: room.room_type_name,
        name_en: room.room_type_name_en || '',
        property_id: room.property_id,
        description: null,
        capacity: room.room_type_capacity || 0,
        extra_bed_capacity: room.room_type_extra_capacity || 0,
        size: null,
        bed_type: null,
        view: null,
        images: [],
        facilities: [],
      },
      rate_plan: {
        id: ratePlan.id,
        room_type_id: room.room_type_id,
        name: ratePlan.name,
        name_en: ratePlan.name_en,
        description: null,
        meal_plan: ratePlan.board_type,
        cancellation_policy: '',
        is_refundable: ratePlan.cancelable === 1,
      },
      prices: ratePlan.prices,
      total_rack_price: totalRackPrice,
      total_sales_price: totalSalesPrice,
      currency: 'IRR',
      available_rooms: Math.min(...ratePlan.prices.map((p: any) => p.inventory)),
    } as unknown as RoomRate;
  }, [roomsData, roomTypeId, ratePlanId]);

  // Pre-fill booker info from session
  useEffect(() => {
    if (session?.user) {
      const [firstName, ...lastParts] = session.user.name.split(' ');
      dispatch({ type: 'UPDATE_BOOKER', field: 'firstName', value: firstName || '' });
      dispatch({ type: 'UPDATE_BOOKER', field: 'lastName', value: lastParts.join(' ') || '' });
      dispatch({ type: 'UPDATE_BOOKER', field: 'email', value: session.user.email });
      dispatch({ type: 'UPDATE_BOOKER', field: 'phone', value: session.user.phone });
    }
  }, [session]);

  // Redirect if not logged in
  if (status === 'unauthenticated') {
    const callbackUrl = `/booking?${searchParams.toString()}`;
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null;
  }

  const handleSubmitStep1 = () => {
    // Validate booker info
    const { firstName, lastName, email, phone, nationalCode } = state.booker;
    if (!firstName || !lastName || !email || !phone || !nationalCode) {
      dispatch({ type: 'SET_ERROR', error: 'لطفا تمام فیلدهای ضروری را پر کنید' });
      return;
    }

    // Validate guests
    for (const guest of state.guests) {
      if (!guest.guest_first_name || !guest.guest_last_name || !guest.guest_national_code) {
        dispatch({ type: 'SET_ERROR', error: 'لطفا اطلاعات تمام مسافران را تکمیل کنید' });
        return;
      }
    }

    dispatch({ type: 'SET_ERROR', error: null });
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  const handleSubmitReservation = async () => {
    if (!property || !selectedRoom || !checkIn || !checkOut) return;

    dispatch({ type: 'SET_SUBMITTING', value: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const adultGuests = state.guests.filter(g => !g.guest_is_child);
      const childGuests = state.guests.filter(g => g.guest_is_child);

      const response = await fetch('/api/grs/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          check_in: checkIn,
          check_out: checkOut,
          booker_first_name: state.booker.firstName,
          booker_last_name: state.booker.lastName,
          booker_email: state.booker.email,
          booker_phone: state.booker.phone,
          booker_national_code: state.booker.nationalCode,
          rooms: [
            {
              room_type_id: selectedRoom.room_type.id,
              rate_plan_id: selectedRoom.rate_plan.id,
              count: 1,
              adult_count: adultGuests.length,
              children: childGuests.map(g => ({
                first_name: g.guest_first_name,
                last_name: g.guest_last_name,
                birth_date: g.guest_birth_date || '',
                gender: g.guest_gender,
              })),
              guest_first_name: adultGuests[0]?.guest_first_name || '',
              guest_last_name: adultGuests[0]?.guest_last_name || '',
              guest_phone: state.booker.phone,
              guest_email: state.booker.email,
              guest_national_code: adultGuests[0]?.guest_national_code || '',
              guest_passport_number: '',
              guest_country_id: null,
              guest_city_id: null,
              guests: state.guests.map(g => ({
                first_name: g.guest_first_name,
                last_name: g.guest_last_name,
                phone: state.booker.phone,
                email: state.booker.email,
                national_code: g.guest_national_code,
                passport_number: '',
                country_id: null,
                city_id: null,
              })),
            },
          ],
          description: state.specialRequests || null,
          vehicle: null,
          vehicle_number: null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code >= 400) {
        throw new Error(data.message || 'خطا در ثبت رزرو');
      }

      const confirmationCode = data.value.confirmation_code;
      dispatch({ type: 'SET_CONFIRMATION_CODE', code: confirmationCode });

      // Reserve succeeded, go to payment step
      dispatch({ type: 'SET_STEP', step: 3 });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'خطا در ثبت رزرو',
      });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  const handlePayment = async () => {
    if (!state.confirmationCode || !selectedRoom) return;

    dispatch({ type: 'SET_SUBMITTING', value: true });

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationCode: state.confirmationCode,
          amount: selectedRoom.total_sales_price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطا در ایجاد درخواست پرداخت');
      }

      // Redirect to payment gateway
      window.location.href = data.paymentUrl;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'خطا در پرداخت',
      });
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  if (!propertyId || !roomTypeId || !ratePlanId || !checkIn || !checkOut) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">پارامترهای رزرو ناقص است</p>
        <Button asChild>
          <Link href="/search">بازگشت به جستجو</Link>
        </Button>
      </div>
    );
  }

  if (propertyLoading || roomsLoading || status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!property || !selectedRoom) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">اتاق مورد نظر یافت نشد</p>
        <Button asChild>
          <Link href={`/hotels/${propertyId}?check_in=${checkIn}&check_out=${checkOut}`}>
            بازگشت به هتل
          </Link>
        </Button>
      </div>
    );
  }

  const nights = calculateNights(checkIn, checkOut);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                state.step === step.number
                  ? 'bg-primary text-primary-foreground'
                  : state.step > step.number
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              <span className="text-sm font-medium sm:hidden">{toPersianDigits(step.number)}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Guest Info */}
          {state.step === 1 && (
            <>
              {/* Booker Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    اطلاعات رزرو کننده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>نام</FieldLabel>
                        <Input
                          value={state.booker.firstName}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_BOOKER',
                              field: 'firstName',
                              value: e.target.value,
                            })
                          }
                          placeholder="نام"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>نام خانوادگی</FieldLabel>
                        <Input
                          value={state.booker.lastName}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_BOOKER',
                              field: 'lastName',
                              value: e.target.value,
                            })
                          }
                          placeholder="نام خانوادگی"
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>ایمیل</FieldLabel>
                        <Input
                          type="email"
                          value={state.booker.email}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_BOOKER',
                              field: 'email',
                              value: e.target.value,
                            })
                          }
                          placeholder="email@example.com"
                          dir="ltr"
                          className="text-left"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>شماره موبایل</FieldLabel>
                        <Input
                          type="tel"
                          value={state.booker.phone}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_BOOKER',
                              field: 'phone',
                              value: e.target.value,
                            })
                          }
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          dir="ltr"
                          className="text-left"
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>کد ملی</FieldLabel>
                      <Input
                        value={state.booker.nationalCode}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_BOOKER',
                            field: 'nationalCode',
                            value: e.target.value,
                          })
                        }
                        placeholder="۰۰۱۲۳۴۵۶۷۸"
                        dir="ltr"
                        className="text-left"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              {/* Guest Info */}
              {state.guests.map((guest, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        مسافر {toPersianDigits(index + 1)}
                      </CardTitle>
                      {state.guests.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch({ type: 'REMOVE_GUEST', index })}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>نام</FieldLabel>
                          <Input
                            value={guest.guest_first_name}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_GUEST',
                                index,
                                field: 'guest_first_name',
                                value: e.target.value,
                              })
                            }
                            placeholder="نام"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>نام خانوادگی</FieldLabel>
                          <Input
                            value={guest.guest_last_name}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_GUEST',
                                index,
                                field: 'guest_last_name',
                                value: e.target.value,
                              })
                            }
                            placeholder="نام خانوادگی"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>کد ملی</FieldLabel>
                          <Input
                            value={guest.guest_national_code}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_GUEST',
                                index,
                                field: 'guest_national_code',
                                value: e.target.value,
                              })
                            }
                            placeholder="۰۰۱۲۳۴۵۶۷۸"
                            dir="ltr"
                            className="text-left"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>جنسیت</FieldLabel>
                          <RadioGroup
                            value={guest.guest_gender}
                            onValueChange={(value) =>
                              dispatch({
                                type: 'UPDATE_GUEST',
                                index,
                                field: 'guest_gender',
                                value,
                              })
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="male" id={`gender-male-${index}`} />
                              <label htmlFor={`gender-male-${index}`}>مرد</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="female" id={`gender-female-${index}`} />
                              <label htmlFor={`gender-female-${index}`}>زن</label>
                            </div>
                          </RadioGroup>
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>
              ))}

              {state.guests.length < parseInt(adults) && (
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'ADD_GUEST' })}
                  className="w-full"
                >
                  افزودن مسافر
                </Button>
              )}

              {/* Special Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">درخواست‌های خاص (اختیاری)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={state.specialRequests}
                    onChange={(e) =>
                      dispatch({ type: 'SET_SPECIAL_REQUESTS', value: e.target.value })
                    }
                    placeholder="هرگونه درخواست خاص مانند تخت اضافه، طبقه خاص و..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSubmitStep1} size="lg">
                  ادامه و بررسی
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Review */}
          {state.step === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بررسی نهایی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">اطلاعات رزرو کننده</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {state.booker.firstName} {state.booker.lastName}
                      </p>
                      <p>{state.booker.phone}</p>
                      <p>{state.booker.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">مسافران</h4>
                    <div className="space-y-2">
                      {state.guests.map((guest, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {toPersianDigits(index + 1)}.{' '}
                          {guest.guest_first_name} {guest.guest_last_name}
                          {guest.guest_is_child && <Badge variant="secondary" className="mr-2">کودک</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {state.specialRequests && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">درخواست‌های خاص</h4>
                        <p className="text-sm text-muted-foreground">{state.specialRequests}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => dispatch({ type: 'SET_STEP', step: 1 })}>
                  ویرایش
                </Button>
                <Button onClick={handleSubmitReservation} disabled={state.isSubmitting} size="lg">
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    'ثبت رزرو و پرداخت'
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Payment */}
          {state.step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">کد رزرو شما:</p>
                  <p className="text-2xl font-bold" dir="ltr">{state.confirmationCode}</p>
                </div>
                <p className="text-center text-muted-foreground">
                  برای تکمیل رزرو، لطفا مبلغ زیر را پرداخت کنید
                </p>
                <div className="text-center">
                  <PriceDisplay rials={selectedRoom.total_sales_price} size="xl" />
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={state.isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      در حال انتقال...
                    </>
                  ) : (
                    'پرداخت با درگاه زرین‌پال'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Booking Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">خلاصه رزرو</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">{property.name}</h4>
                <p className="text-sm text-muted-foreground">{property.city_name}</p>
              </div>
              <Separator />
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اتاق:</span>
                  <span>{selectedRoom.room_type.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">پلن:</span>
                  <span>{selectedRoom.rate_plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    تاریخ:
                  </span>
                  <span>{formatJalaliRange(checkIn, checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدت اقامت:</span>
                  <span>{formatNights(checkIn, checkOut)}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">قیمت هر شب:</span>
                  <PriceDisplay rials={selectedRoom.total_sales_price / nights} size="sm" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {toPersianDigits(nights)} شب x {formatPriceNumber(selectedRoom.total_sales_price / nights)}
                  </span>
                </div>
                {selectedRoom.total_rack_price !== selectedRoom.total_sales_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">تخفیف:</span>
                    <span className="text-green-600">
                      -{formatPriceNumber(selectedRoom.total_rack_price - selectedRoom.total_sales_price)}
                    </span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">جمع کل:</span>
                <PriceDisplay rials={selectedRoom.total_sales_price} size="lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function BookingPage() {
  return (
    <SessionProvider>
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
              <span className="text-sm text-muted-foreground">تکمیل رزرو</span>
            </div>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <BookingForm />
        </Suspense>
      </div>
    </SessionProvider>
  );
}