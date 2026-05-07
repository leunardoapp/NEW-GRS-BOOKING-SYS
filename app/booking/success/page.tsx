'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Loader2, Download, Printer, Home, List } from 'lucide-react'
import { formatJalaliWithDay, toPersianDigits } from '@/src/lib/jalali'

interface BookingDetails {
  id: string
  confirmationCode: string
  hotelName: string
  checkIn: string
  checkOut: string
  guestName: string
  totalPrice: number
  currency: string
  status: string
  createdAt: string
  roomType?: string
  guests?: number
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [bookingId, setBookingId] = useState<string>('')
  const [refId, setRefId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    const verifyPayment = async () => {
      const code = searchParams.get('code')
      const authority = searchParams.get('Authority')
      const payStatus = searchParams.get('Status')
      const testMode = searchParams.get('test_mode')

      if (testMode === 'true') {
        setIsTestMode(true)
      }

      // For test mode or direct code-based success
      if (code && (testMode === 'true' || !authority)) {
        try {
          const response = await fetch(`/api/bookings/verify-payment?code=${code}`, { method: 'POST' })
          const data = await response.json()

          if (data.success || data.booking) {
            setBookingId(data.booking?.confirmationCode || code)
            setBookingDetails(data.booking)
            setStatus('success')
            return
          }
        } catch (error) {
          console.log('[v0] Test mode booking fetch error:', error)
        }
      }

      if (!authority || !payStatus) {
        setErrorMessage('پارامترهای پرداخت موجود نیست')
        setStatus('error')
        return
      }

      try {
        const response = await fetch(
          `/api/bookings/verify-payment?Authority=${authority}&Status=${payStatus}`,
          { method: 'POST' }
        )

        const data = await response.json()

        if (data.success) {
          setBookingId(data.bookingId)
          setRefId(data.refId)
          setBookingDetails(data.booking)
          setStatus('success')
        } else {
          setErrorMessage(data.message || 'خرابی در تأیید پرداخت')
          setStatus('error')
          setBookingId(data.bookingId)
        }
      } catch (error) {
        setErrorMessage('خرابی در ارتباط با سرور')
        setStatus('error')
        console.log('[v0] Payment verification error:', error)
      }
    }

    verifyPayment()
  }, [searchParams])

  const handlePrintVoucher = () => {
    window.print()
  }

  const handleDownloadVoucher = () => {
    // In a real implementation, this would generate a PDF
    alert('در حال آماده‌سازی فایل PDF...\n(این ویژگی در نسخه نهایی پیاده‌سازی خواهد شد)')
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">در حال تأیید پرداخت...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              خرابی در پرداخت
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingId && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">شناسه رزرو:</p>
                <p className="font-mono font-semibold">{bookingId}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/bookings">
                <Button variant="outline" className="w-full">
                  بازگشت به داشبورد
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full">بازگشت به خانه</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-green-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            {isTestMode ? 'پرداخت تستی موفق' : 'پرداخت موفق'}
          </CardTitle>
          <CardDescription className="text-base">
            رزرو شما با موفقیت تأیید شد
            {isTestMode && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                حالت تستی
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Voucher Section */}
          {bookingDetails && (
            <div className="rounded-lg border-2 border-dashed border-green-200 bg-green-50/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">واچر رزرو</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadVoucher}>
                    <Download className="h-4 w-4 ml-2" />
                    دانلود
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintVoucher}>
                    <Printer className="h-4 w-4 ml-2" />
                    چاپ
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">کد رزرو:</p>
                  <p className="font-mono font-bold text-lg text-green-700" dir="ltr">
                    {bookingDetails.confirmationCode || bookingId}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">هتل:</p>
                  <p className="font-semibold">{bookingDetails.hotelName}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">وضعیت:</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {bookingDetails.status === 'booked' ? 'تأیید شده' : bookingDetails.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-muted-foreground">تاریخ ورود:</p>
                  <p className="font-semibold">
                    {formatJalaliWithDay(new Date(bookingDetails.checkIn))}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">تاریخ خروج:</p>
                  <p className="font-semibold">
                    {formatJalaliWithDay(new Date(bookingDetails.checkOut))}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">مهمان اصلی:</p>
                  <p className="font-semibold">{bookingDetails.guestName}</p>
                </div>

                {bookingDetails.roomType && (
                  <div>
                    <p className="text-muted-foreground">نوع اتاق:</p>
                    <p className="font-semibold">{bookingDetails.roomType}</p>
                  </div>
                )}

                {bookingDetails.guests && (
                  <div>
                    <p className="text-muted-foreground">تعداد مهمانان:</p>
                    <p className="font-semibold">{toPersianDigits(bookingDetails.guests)} نفر</p>
                  </div>
                )}

                <div className="col-span-2 border-t pt-3 mt-2">
                  <p className="text-muted-foreground">مبلغ پرداختی:</p>
                  <p className="font-bold text-xl text-green-700">
                    {toPersianDigits(bookingDetails.totalPrice.toLocaleString('fa-IR'))}{' '}
                    {bookingDetails.currency}
                  </p>
                </div>

                <div className="col-span-2 text-xs text-muted-foreground">
                  <p>تاریخ رزرو: {formatJalaliWithDay(new Date(bookingDetails.createdAt))}</p>
                </div>
              </div>
            </div>
          )}

          {!bookingDetails && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">شناسه رزرو:</p>
                <p className="font-mono font-semibold" dir="ltr">{bookingId}</p>
              </div>
              {refId && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground">شناسه تراکنش:</p>
                  <p className="font-mono text-sm font-semibold" dir="ltr">{refId}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>توجه:</strong> یک ایمیل تأیید برای شما ارسال شده است. لطفاً صندوق ورودی خود را بررسی کنید.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/dashboard/bookings" className="flex-1">
              <Button className="w-full">
                <List className="h-4 w-4 ml-2" />
                مشاهده رزرو‌های من
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 ml-2" />
                بازگشت به خانه
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
