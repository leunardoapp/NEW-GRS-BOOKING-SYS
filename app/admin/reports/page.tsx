'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatJalaliDisplay } from '@/src/lib/jalali'

interface WebhookLog {
  id: string
  event: string
  status: string
  errorMessage?: string
  createdAt: string
}

const statusColorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  received: 'outline',
  processed: 'default',
  error: 'destructive',
  invalid_signature: 'destructive',
  booking_not_found: 'secondary',
}

const statusLabelMap: Record<string, string> = {
  received: 'دریافت‌شده',
  processed: 'پردازش‌شده',
  error: 'خرابی',
  invalid_signature: 'امضای نامعتبر',
  booking_not_found: 'رزرو پیدا نشد',
}

export default function AdminReportsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/admin/webhook-logs')
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (error) {
        console.log('[v0] Failed to fetch webhook logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
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
        <h1 className="text-3xl font-bold text-foreground">گزارش‌ها</h1>
        <p className="text-muted-foreground">
          {logs.length} رویداد وب‌هوک ثبت‌شده است
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>وب‌هوک‌های GRS</CardTitle>
          <CardDescription>تاریخچه تمام وب‌هوک‌های دریافتی از GRS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-4 font-semibold">رویداد</th>
                  <th className="text-right py-3 px-4 font-semibold">وضعیت</th>
                  <th className="text-right py-3 px-4 font-semibold">پیام خرابی</th>
                  <th className="text-right py-3 px-4 font-semibold">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{log.event}</td>
                    <td className="py-4 px-4">
                      <Badge variant={statusColorMap[log.status] || 'outline'}>
                        {statusLabelMap[log.status] || log.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {log.errorMessage || '-'}
                    </td>
                    <td className="py-4 px-4">
                      {formatJalaliDisplay(new Date(log.createdAt))}
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
