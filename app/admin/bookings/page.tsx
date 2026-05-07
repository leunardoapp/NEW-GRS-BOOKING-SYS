'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatJalaliDisplay } from '@/src/lib/jalali'
import ReserveStatusBadge from '@/components/reserve-status-badge'

interface AdminBooking {
  id: string
  grsReserveId: string
  userEmail: string
  userName: string
  hotelId: string
  checkIn: string
  checkOut: string
  totalPrice: number
  currency: string
  status: string
  createdAt: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings')
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (error) {
        console.log('[v0] Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">مدیریت رزرو‌ها</h1>
        <p className="text-muted-foreground">
          {bookings.length} رزرو در سیستم موجود است
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تمام رزرو‌ها</CardTitle>
          <CardDescription>لیست کاملی از تمام رزرو‌های سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-4 font-semibold">شناسه</th>
                  <th className="text-right py-3 px-4 font-semibold">کاربر</th>
                  <th className="text-right py-3 px-4 font-semibold">تاریخ ورود</th>
                  <th className="text-right py-3 px-4 font-semibold">وضعیت</th>
                  <th className="text-right py-3 px-4 font-semibold">قیمت</th>
                  <th className="text-right py-3 px-4 font-semibold">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4 font-mono text-xs">{booking.grsReserveId}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{booking.userName}</p>
                        <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {formatJalaliDisplay(new Date(booking.checkIn))}
                    </td>
                    <td className="py-4 px-4">
                      <ReserveStatusBadge status={booking.status} />
                    </td>
                    <td className="py-4 px-4 text-left">
                      {booking.totalPrice.toLocaleString('fa-IR')} {booking.currency}
                    </td>
                    <td className="py-4 px-4">
                      {formatJalaliDisplay(new Date(booking.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
