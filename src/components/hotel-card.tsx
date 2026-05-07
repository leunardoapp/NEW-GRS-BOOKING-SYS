'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceRange } from './price-display';
import { cn } from '@/lib/utils';
import type { Suggestion } from '@/src/types/grs';
import { toPersianDigits, formatPriceNumber } from '@/src/lib/jalali';
import { Button } from '@/components/ui/button';

interface SuggestionCardProps {
  suggestion: Suggestion;
  checkIn: string;
  checkOut: string;
  className?: string;
}

// تابع برای گرفتن حداقل قیمت
const getMinPrice = (suggestion: Suggestion): number => {
  let min = Infinity;
  suggestion.rooms.forEach(room => {
    room.rate_plans.forEach(plan => {
      if (plan.grs_rate < min) min = plan.grs_rate;
    });
  });
  return min === Infinity ? 0 : min;
};

export function SuggestionCard({ suggestion, checkIn, checkOut, className }: SuggestionCardProps) {
  const href = `/hotels/${suggestion.property_id}?check_in=${checkIn}&check_out=${checkOut}`;
  const minPrice = getMinPrice(suggestion);
  const availableRooms = suggestion.rooms.filter(r => r.rate_plans.some(p => p.prices.some(d => d.inventory > 0 && d.reservation_state === 'online'))).length;

  return (
    <Link href={href} className="block">
      <Card className={cn('group overflow-hidden transition-all hover:shadow-lg hover:border-primary/30', className)}>
        <div className="flex flex-col md:flex-row">
          {/* Image Placeholder */}
          <div className="relative h-48 md:h-auto md:w-64 flex-shrink-0 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
              <span className="text-5xl">🏨</span>
              <p className="text-xs text-gray-500 mt-2">تصویر هتل</p>
            </div>
          </div>

          <CardContent className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {suggestion.property_name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>شناسه هتل: {toPersianDigits(suggestion.property_id)}</span>
                  </div>
                </div>
                {/* اگر ستاره داشتید اینجا اضافه کنید، فعلاً چون در دیتا نیست حذف شده */}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">{toPersianDigits(suggestion.rooms.length)} نوع اتاق</Badge>
                {availableRooms > 0 && <Badge variant="outline">{toPersianDigits(availableRooms)} اتاق آماده رزرو</Badge>}
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto pt-3 border-t">
              <div>
                <div className="text-xs text-muted-foreground">شروع قیمت از</div>
                <div className="text-xl font-bold text-primary">
                  {formatPriceNumber(minPrice)} <span className="text-sm font-normal">تومان</span>
                </div>
              </div>
              <Button variant="default" size="sm">مشاهده و رزرو</Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}