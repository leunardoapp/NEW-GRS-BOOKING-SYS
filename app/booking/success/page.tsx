'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [bookingId, setBookingId] = useState<string>('')
  const [refId, setRefId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const verifyPayment = async () => {
      const authority = searchParams.get('Authority')
      const payStatus = searchParams.get('Status')

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            پرداخت موفق
          </CardTitle>
          <CardDescription>رزرو شما با موفقیت تأیید شد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">شناسه رزرو:</p>
              <p className="font-mono font-semibold">{bookingId}</p>
            </div>
            {refId && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">شناسه تراکنش:</p>
                <p className="font-mono text-sm font-semibold">{refId}</p>
              </div>
            )}
          </div>

          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              یک ایمیل تأیید برای شما ارسال شده است. لطفاً صندوق ورودی خود را بررسی کنید.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard/bookings">
              <Button className="w-full">مشاهده رزرو‌های من</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                بازگشت به خانه
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
