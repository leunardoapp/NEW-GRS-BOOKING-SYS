'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { LogOut, BarChart3, Users, Settings, FileText, AlertCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'

const adminNavigation = [
  { name: 'داشبورد', href: '/admin/dashboard', icon: BarChart3 },
  { name: 'رزرو‌ها', href: '/admin/bookings', icon: FileText },
  { name: 'کاربران', href: '/admin/users', icon: Users },
  { name: 'گزارش‌ها', href: '/admin/reports', icon: AlertCircle },
  { name: 'تنظیمات', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    // Check if user is admin - this is a client-side check
    // Server-side validation happens in API routes
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session?.user?.role, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="w-64 border-l border-border bg-card">
        <div className="flex flex-col h-full">
          {/* Branding */}
          <div className="border-b border-border p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-primary">پنل ادمین</p>
              <h1 className="text-lg font-bold text-foreground">YouReserveIR</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {adminNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-border space-y-4 p-4">
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">ورود به‌عنوان</p>
              <p className="font-semibold text-foreground">{session.user.name}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
