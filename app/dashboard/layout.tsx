'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { LogOut, User, Calendar, CreditCard, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'

const dashboardNavigation = [
  { name: 'رزرو‌های من', href: '/dashboard/bookings', icon: Calendar },
  { name: 'پروفایل', href: '/dashboard/profile', icon: User },
  { name: 'تاریخ پرداخت‌ها', href: '/dashboard/payments', icon: CreditCard },
  { name: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

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
      {/* Sidebar */}
      <aside className="w-64 border-l border-border bg-card">
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="border-b border-border p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">خوش‌آمدید</p>
              <p className="font-semibold text-foreground">{session.user.name}</p>
              <p className="text-xs text-muted-foreground break-all">{session.user.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {dashboardNavigation.map((item) => {
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

          {/* Logout */}
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
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
