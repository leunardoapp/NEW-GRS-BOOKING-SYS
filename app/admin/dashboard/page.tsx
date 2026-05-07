'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BookOpen, Users, CreditCard, AlertCircle } from 'lucide-react'

interface Stats {
  totalBookings: number
  totalUsers: number
  totalRevenue: number
  pendingWebhooks: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.log('[v0] Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">داشبورد ادمین</h1>
        <p className="text-muted-foreground">خوش‌آمدید به پنل مدیریت</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              کل رزرو‌ها
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">تمام رزرو‌های ثبت‌شده</p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              کاربران
              <Users className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">کاربران فعال</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              درآمد کل
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRevenue.toLocaleString('fa-IR') || 0}
            </div>
            <p className="text-xs text-muted-foreground">تراکنش‌های تأیید‌شده</p>
          </CardContent>
        </Card>

        {/* Pending Webhooks */}
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              در انتظار وب‌هوک
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingWebhooks || 0}
            </div>
            <p className="text-xs text-muted-foreground">نیاز به پردازش</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>راهنما</CardTitle>
          <CardDescription>برای مدیریت بهتر سیستم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• از بخش «رزرو‌ها» برای مشاهده و مدیریت تمام رزرو‌ها استفاده کنید</p>
            <p>• در بخش «کاربران» می‌توانید اطلاعات کاربران را مشاهده کنید</p>
            <p>• بخش «گزارش‌ها» شامل تمام وب‌هوک‌های GRS است</p>
            <p>• در تنظیمات می‌توانید کلیدهای API و تنظیمات سیستم را مدیریت کنید</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
