'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatJalaliDisplay } from '@/src/lib/jalali'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  bookingCount: number
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        console.log('[v0] Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
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
        <h1 className="text-3xl font-bold text-foreground">مدیریت کاربران</h1>
        <p className="text-muted-foreground">
          {users.length} کاربر در سیستم ثبت‌شده است
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تمام کاربران</CardTitle>
          <CardDescription>لیست کاملی از تمام کاربران سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-4 font-semibold">نام</th>
                  <th className="text-right py-3 px-4 font-semibold">ایمیل</th>
                  <th className="text-right py-3 px-4 font-semibold">نقش</th>
                  <th className="text-right py-3 px-4 font-semibold">تعداد رزرو</th>
                  <th className="text-right py-3 px-4 font-semibold">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{user.name}</td>
                    <td className="py-4 px-4 text-muted-foreground break-all">{user.email}</td>
                    <td className="py-4 px-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'ادمین' : 'کاربر'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">{user.bookingCount}</td>
                    <td className="py-4 px-4">
                      {formatJalaliDisplay(new Date(user.createdAt))}
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
