'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toJalaliPersian, toGregorian, toEnglishDigits, toPersianDigits, getTodayJalali, addDaysToJalali } from '@/src/lib/jalali';
import { cn } from '@/lib/utils';

interface JalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  disabled?: boolean;
  displayFormat?: (date: Date | string) => string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  minDate,
  className,
  disabled,
  displayFormat,
}: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert Jalali value to Date for the calendar
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const gregorian = toGregorian(toEnglishDigits(value));
      return new Date(gregorian);
    } catch {
      return undefined;
    }
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const jalali = toJalaliPersian(date);
      onChange(jalali);
      setOpen(false);
    }
  };

  // Convert Jalali to display text
  const displayValue = React.useMemo(() => {
    if (!value) return '';
    
    try {
      const gregorian = toGregorian(toEnglishDigits(value));
      const dateObj = new Date(gregorian);
      
      // Use custom format if provided
      if (displayFormat) {
        return displayFormat(dateObj);
      }
      
      // Default format: YYYY/MM/DD with Persian digits
      const normalized = toEnglishDigits(value);
      const parts = normalized.split(/[-/]/);
      if (parts.length === 3) {
        return `${toPersianDigits(parts[0])}/${toPersianDigits(parts[1].padStart(2, '0'))}/${toPersianDigits(parts[2].padStart(2, '0'))}`;
      }
      return value;
    } catch {
      return value;
    }
  }, [value, displayFormat]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-right font-normal',
            !displayValue && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue ? displayValue : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          fromDate={minDate || new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
