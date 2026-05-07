import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { reservations, payments } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard, User } from 'lucide-react';
import { formatJalaliDisplay, toPersianDigits } from '@/src/lib/jalali';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const userId = parseInt(session.user.id);

  const [userReservations, userPayments] = await Promise.all([
    db.query.reservations.findMany({
      where: eq(reservations.userId, userId),
      orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
      limit: 5,
    }),
    db.query.payments.findMany({
      where: eq(payments.userId, userId),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      limit: 5,
    }),
  ]);

  const totalBookings = userReservations.length;
  const totalPayments = userPayments.length;
  const totalSpent = userPayments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">پنل کاربری</h1>
        <p className="text-muted-foreground">خوش آمدید، {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رزروها</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toPersianDigits(totalBookings)}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/bookings" className="hover:underline">
                مشاهده همه
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پرداخت‌ها</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toPersianDigits(totalPayments)}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/payments" className="hover:underline">
                مشاهده همه
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع پرداختی</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toPersianDigits(Math.floor(totalSpent / 10).toLocaleString())}{' '}
              <span className="text-sm font-normal">تومان</span>
            </div>
            <p className="text-xs text-muted-foreground">پرداخت‌های تایید شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>رزروهای اخیر</CardTitle>
          <CardDescription>آخرین رزروهای شما</CardDescription>
        </CardHeader>
        <CardContent>
          {userReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>هنوز رزروی ثبت نکرده‌اید</p>
              <Button asChild className="mt-4">
                <Link href="/search">جستجوی هتل</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{r.propertyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatJalaliDisplay(new Date(r.checkIn))} تا{' '}
                      {formatJalaliDisplay(new Date(r.checkOut))}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{r.status}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {r.confirmationCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
