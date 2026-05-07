'use client'

import { Badge } from '@/components/ui/badge'

interface ReserveStatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'تأیید شده', variant: 'default' },
  pending: { label: 'در انتظار', variant: 'secondary' },
  cancelled: { label: 'لغو شده', variant: 'destructive' },
  completed: { label: 'تکمیل شده', variant: 'outline' },
}

export default function ReserveStatusBadge({ status }: ReserveStatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline' as const }

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}