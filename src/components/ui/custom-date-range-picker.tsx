import { IconCalendar } from '@tabler/icons-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CustomDateRangePickerProps {
  value: DateRange | undefined;
  onValueChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const formatDay = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatRange = (range: DateRange | undefined) => {
  if (!range?.from) return null;
  if (!range.to) return formatDay(range.from);
  return `${formatDay(range.from)} – ${formatDay(range.to)}`;
};

export const CustomDateRangePicker = ({
  value,
  onValueChange,
  placeholder = 'Pick a date range',
  disabled,
  className,
}: CustomDateRangePickerProps) => {
  const label = formatRange(value);

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn('justify-start gap-2 font-normal', !label && 'text-muted-foreground', className)}
          />
        }
      >
        <IconCalendar className="size-4 shrink-0" />
        {label ?? placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="range" selected={value} onSelect={onValueChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
};

export default CustomDateRangePicker;
