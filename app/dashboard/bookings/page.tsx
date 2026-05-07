'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Loader2 } from 'lucide-react'
import { formatJalaliDisplay } from '@/src/lib/jalali'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ReserveStatusBadge from '@/components/reserve-status-badge'

interface Booking {
  id: string
  grsReserveId: string
  hotelId: string
  hotelName: string
  checkIn: string
  checkOut: string
  guestName: string
  totalPrice: number
  currency: string
  status: string
  createdAt: string
}

export default function BookingsDashboardPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/dashboard/bookings')
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (error) {
        console.log('[v0] Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchBookings()
    }
  }, [session?.user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">رزرو‌های من</h1>
          <p className="text-muted-foreground">رزرو شده‌ی هتل‌های خود را مدیریت کنید</p>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyTitle>هنوز رزروی ندارید</EmptyTitle>
            <EmptyDescription>شروع کنید و اولین هتل خود را رزرو کنید</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/search">
              <Button>جستجوی هتل</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">رزرو‌های من</h1>
        <p className="text-muted-foreground">شما {bookings.length} رزرو دارید</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{booking.hotelName}</CardTitle>
                <CardDescription>شناسه: {booking.grsReserveId}</CardDescription>
              </div>
              <ReserveStatusBadge status={booking.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">ورود</p>
                  <p className="font-semibold">{formatJalaliDisplay(new Date(booking.checkIn))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">خروج</p>
                  <p className="font-semibold">{formatJalaliDisplay(new Date(booking.checkOut))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نام مهمان</p>
                  <p className="font-semibold">{booking.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قیمت کل</p>
                  <p className="font-semibold">
                    {booking.totalPrice.toLocaleString('fa-IR')} {booking.currency}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  ایجاد شده در: {formatJalaliDisplay(new Date(booking.createdAt))}
                </p>
                <Link href={`/dashboard/bookings/${booking.id}`}>
                  <Button size="sm" variant="outline">
                    مشاهده جزئیات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
