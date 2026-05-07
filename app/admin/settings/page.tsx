'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    grsApiKey: process.env.NEXT_PUBLIC_GRS_API_KEY || '',
    zarinpalMerchantId: process.env.NEXT_PUBLIC_ZARINPAL_MERCHANT_ID || '',
  })

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('تنظیمات با موفقیت ذخیره شد')
    } catch (error) {
      toast.error('خرابی در ذخیره تنظیمات')
      console.log('[v0] Settings save error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
        <p className="text-muted-foreground">تنظیمات سیستم و کلیدهای API را مدیریت کنید</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>کلیدهای API</CardTitle>
          <CardDescription>کلیدهای API برای سرویس‌های خارجی</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field>
            <FieldLabel>کلید API - GRS</FieldLabel>
            <Input
              type="password"
              placeholder="کلید API GRS را وارد کنید"
              value={settings.grsApiKey}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, grsApiKey: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground mt-2">
              کلید API برای اتصال به سیستم GRS
            </p>
          </Field>

          <Field>
            <FieldLabel>کد تاجر ZarinPal</FieldLabel>
            <Input
              type="text"
              placeholder="کد تاجر ZarinPal را وارد کنید"
              value={settings.zarinpalMerchantId}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  zarinpalMerchantId: e.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground mt-2">
              کد تاجر درگاه ZarinPal برای پردازش پرداخت‌ها
            </p>
          </Field>

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'درحال ذخیره‌سازی...' : 'ذخیره تنظیمات'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات سیستم</CardTitle>
          <CardDescription>اطلاعات کلی درباره سیستم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">نسخه سیستم</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">محیط</p>
              <p className="font-semibold">
                {process.env.NODE_ENV === 'production' ? 'تولید' : 'توسعه'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
