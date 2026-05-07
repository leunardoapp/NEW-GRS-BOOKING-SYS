import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReserveDetailsStatus } from '@/src/types/grs';

interface ReserveStatusBadgeProps {
  status: ReserveDetailsStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ReserveDetailsStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  pending: {
    label: 'در انتظار',
    variant: 'outline',
    className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950',
  },
  booking: {
    label: 'در حال رزرو',
    variant: 'outline',
    className: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950',
  },
  booked: {
    label: 'رزرو شده',
    variant: 'outline',
    className: 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950',
  },
  definite: {
    label: 'تایید شده',
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-600 text-white',
  },
  rejected: {
    label: 'رد شده',
    variant: 'destructive',
    className: '',
  },
  canceled: {
    label: 'لغو شده',
    variant: 'secondary',
    className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  canceling: {
    label: 'در حال لغو',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950',
  },
  modifying: {
    label: 'در حال تغییر',
    variant: 'outline',
    className: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950',
  },
  modified: {
    label: 'تغییر یافته',
    variant: 'outline',
    className: 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950',
  },
  no_show: {
    label: 'عدم حضور',
    variant: 'secondary',
    className: 'bg-gray-400 text-white dark:bg-gray-600',
  },
  checked_in: {
    label: 'ورود انجام شد',
    variant: 'outline',
    className: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  },
  checked_out: {
    label: 'خروج انجام شد',
    variant: 'secondary',
    className: 'bg-slate-500 text-white',
  },
  expired: {
    label: 'منقضی شده',
    variant: 'secondary',
    className: 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
  failed: {
    label: 'ناموفق',
    variant: 'destructive',
    className: '',
  },
  cancel_pending: {
    label: 'در انتظار لغو',
    variant: 'outline',
    className: 'border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-950',
  },
  modify_pending: {
    label: 'در انتظار تغییر',
    variant: 'outline',
    className: 'border-purple-400 text-purple-500 bg-purple-50 dark:bg-purple-950',
  },
  unknown: {
    label: 'نامشخص',
    variant: 'secondary',
    className: '',
  },
};

export function ReserveStatusBadge({ status, className }: ReserveStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

// Helper to get status label
export function getStatusLabel(status: ReserveDetailsStatus): string {
  return STATUS_CONFIG[status]?.label || 'نامشخص';
}

// Helper to check if status allows cancellation
export function canCancel(status: ReserveDetailsStatus): boolean {
  return ['booking', 'booked', 'definite'].includes(status);
}

// Helper to check if status allows modification
export function canModify(status: ReserveDetailsStatus): boolean {
  return ['booking', 'booked', 'definite'].includes(status);
}

// Helper to check if status requires polling
export function requiresPolling(status: ReserveDetailsStatus): boolean {
  return ['pending', 'canceling', 'modifying', 'cancel_pending', 'modify_pending'].includes(status);
}

// Helper to check if reservation is active
export function isActiveReservation(status: ReserveDetailsStatus): boolean {
  return ['booking', 'booked', 'definite', 'checked_in'].includes(status);
}

// Helper to check if reservation is final
export function isFinalStatus(status: ReserveDetailsStatus): boolean {
  return ['definite', 'rejected', 'canceled', 'no_show', 'checked_out', 'expired', 'failed'].includes(status);
}
