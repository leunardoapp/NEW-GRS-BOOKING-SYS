'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Loader2 } from 'lucide-react'
import { formatJalaliDisplay } from '@/src/lib/jalali'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  authority: string
  refId: string | null
  description: string
  createdAt: string
  verifiedAt: string | null
}

const statusColorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  verified: 'default',
  failed: 'destructive',
}

const statusLabelMap: Record<string, string> = {
  pending: 'در انتظار',
  verified: 'تأیید شده',
  failed: 'ناموفق',
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/dashboard/transactions')
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error) {
        console.log('[v0] Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchTransactions()
    }
  }, [session?.user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">تاریخ پرداخت‌ها</h1>
          <p className="text-muted-foreground">تمام تراکنش‌های خود را مشاهده کنید</p>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyTitle>هنوز تراکنشی ندارید</EmptyTitle>
            <EmptyDescription>تمام پرداخت‌های خود اینجا ظاهر می‌شوند</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">تاریخ پرداخت‌ها</h1>
        <p className="text-muted-foreground">شما {transactions.length} تراکنش دارید</p>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6">
               <div className="space-y-1">
                <p className="font-semibold">{transaction.description || 'پرداخت رزرو'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatJalaliDisplay(new Date(transaction.createdAt))}
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <div className="text-right md:text-left">
                  <p className="text-sm text-muted-foreground">مبلغ (تومان)</p>
                  <p className="font-semibold">
                    {Math.floor(transaction.amount / 10).toLocaleString('fa-IR')}
                  </p>
                </div>

                <div>
                  <Badge variant={statusColorMap[transaction.status] || 'outline'}>
                    {statusLabelMap[transaction.status] || transaction.status}
                  </Badge>
                </div>

                {transaction.refId && (
                  <div className="text-xs text-muted-foreground">
                    <p>شناسه تراکنش:</p>
                    <p className="font-mono" dir="ltr">{transaction.refId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
