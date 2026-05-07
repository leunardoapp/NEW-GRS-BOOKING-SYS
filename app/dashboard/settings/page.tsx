'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const handleLogout = () => {
    signOut({ redirect: true, callbackUrl: '/auth/login' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
        <p className="text-muted-foreground">تنظیمات حساب و ترجیحات خود را مدیریت کنید</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>امنیت</CardTitle>
          <CardDescription>گزینه‌های امنیتی حساب شما</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <p className="font-semibold">تغییر رمز عبور</p>
              <p className="text-sm text-muted-foreground">رمز عبور حساب خود را به‌روز کنید</p>
            </div>
            <Button variant="outline" disabled>
              به‌زودی
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">تایید دو مرحله‌ای</p>
              <p className="text-sm text-muted-foreground">
                امنیت حساب خود را با فعال کردن تایید دو مرحله‌ای افزایش دهید
              </p>
            </div>
            <Button variant="outline" disabled>
              به‌زودی
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            خطر
          </CardTitle>
          <CardDescription>اقدامات خطرناک برای حساب شما</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between border-b border-red-200 pb-4">
            <div>
              <p className="font-semibold text-red-600">خروج از تمام دستگاه‌ها</p>
              <p className="text-sm text-muted-foreground">
                از تمام دستگاه‌های دیگر خارج شوید
              </p>
            </div>
            <Button variant="destructive" size="sm">
              خروج
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-red-600">حذف حساب</p>
              <p className="text-sm text-muted-foreground">
                این عمل برگشت‌ناپذیر است. تمام داده‌های شما حذف خواهد شد
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              حذف حساب
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleLogout}>
          خروج از حساب
        </Button>
      </div>
    </div>
  )
}
