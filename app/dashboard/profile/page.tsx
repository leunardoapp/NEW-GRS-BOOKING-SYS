'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileData {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  nationalCode: string | null
  role: string
  createdAt: string
  lastLoginAt: string | null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalCode: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/dashboard/profile')
        const data = await response.json()
        if (data.user) {
          setProfile(data.user)
          setFormData({
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            phone: data.user.phone || '',
            nationalCode: data.user.nationalCode || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setFetching(false)
      }
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('پروفایل شما با موفقیت به‌روز شد')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در به‌روز رسانی پروفایل')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">پروفایل من</h1>
        <p className="text-muted-foreground">اطلاعات حساب خود را مدیریت کنید</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          <CardDescription>اطلاعات حساب کاربری خود را به‌روز کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>نام</FieldLabel>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="نام"
                />
              </Field>

              <Field>
                <FieldLabel>نام خانوادگی</FieldLabel>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="نام خانوادگی"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>شماره موبایل</FieldLabel>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                className="text-left"
              />
            </Field>

            <Field>
              <FieldLabel>کد ملی</FieldLabel>
              <Input
                type="text"
                name="nationalCode"
                value={formData.nationalCode}
                onChange={handleInputChange}
                placeholder="۰۰۱۲۳۴۵۶۷۸"
                dir="ltr"
                className="text-left"
              />
            </Field>

            <Field>
              <FieldLabel>ایمیل</FieldLabel>
              <Input
                type="email"
                value={profile?.email || session?.user?.email || ''}
                disabled
                className="opacity-50 cursor-not-allowed"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ایمیل قابل تغییر نیست
              </p>
            </Field>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره تغییرات'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
