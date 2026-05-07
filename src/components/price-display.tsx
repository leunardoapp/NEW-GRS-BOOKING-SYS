import { formatPrice, formatPriceNumber, toPersianDigits } from '@/src/lib/jalali';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  rials: number;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  strikethrough?: boolean;
  discount?: number; // Percentage discount to show
}

export function PriceDisplay({
  rials,
  showCurrency = true,
  size = 'md',
  className,
  strikethrough = false,
  discount,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold',
  };

  if (strikethrough) {
    return (
      <span
        className={cn(
          'text-muted-foreground line-through',
          sizeClasses[size],
          className
        )}
      >
        {showCurrency ? formatPrice(rials) : formatPriceNumber(rials)}
      </span>
    );
  }

  return (
    <span className={cn('text-foreground', sizeClasses[size], className)}>
      {showCurrency ? formatPrice(rials) : formatPriceNumber(rials)}
      {discount && discount > 0 && (
        <span className="mr-2 inline-flex items-center rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          {toPersianDigits(discount)}% تخفیف
        </span>
      )}
    </span>
  );
}

interface PriceRangeProps {
  minRials: number;
  maxRials?: number;
  className?: string;
}

export function PriceRange({ minRials, maxRials, className }: PriceRangeProps) {
  if (!maxRials || minRials === maxRials) {
    return (
      <div className={cn('flex items-baseline gap-1', className)}>
        <span className="text-muted-foreground text-sm">از</span>
        <PriceDisplay rials={minRials} size="lg" />
        <span className="text-muted-foreground text-xs">/ شب</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-baseline gap-1 flex-wrap', className)}>
      <span className="text-muted-foreground text-sm">از</span>
      <PriceDisplay rials={minRials} size="lg" showCurrency={false} />
      <span className="text-muted-foreground text-sm">تا</span>
      <PriceDisplay rials={maxRials} size="lg" />
      <span className="text-muted-foreground text-xs">/ شب</span>
    </div>
  );
}
