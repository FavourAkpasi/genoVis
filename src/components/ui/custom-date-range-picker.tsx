import { IconCalendar, IconLoader2 } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// react-day-picker (~124 KiB) is only needed once the popover opens, so the
// Calendar is a lazy boundary: its chunk downloads on first open, not on the
// Explorer landing page. The trigger button below stays eager.
const Calendar = lazy(() => import('@/components/ui/calendar').then((m) => ({ default: m.Calendar })));

interface CustomDateRangePickerProps {
  value: DateRange | undefined;
  onValueChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Earliest selectable month (bounds the year dropdown). Defaults to 10 years ago. */
  startMonth?: Date;
  /** Latest selectable month (bounds the year dropdown). Defaults to the current month. */
  endMonth?: Date;
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
  startMonth,
  endMonth,
}: CustomDateRangePickerProps) => {
  const label = formatRange(value);

  const end = endMonth ?? new Date();
  const start = startMonth ?? new Date(end.getFullYear() - 10, 0, 1);
  const defaultMonth = value?.from ?? new Date(end.getFullYear(), end.getMonth() - 1, 1);

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
        <Suspense
          fallback={
            <div
              className="flex h-[300px] w-[560px] items-center justify-center"
              role="status"
              aria-label="Loading calendar"
            >
              <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <Calendar
            mode="range"
            captionLayout="dropdown"
            startMonth={start}
            endMonth={end}
            defaultMonth={defaultMonth}
            selected={value}
            onSelect={onValueChange}
            numberOfMonths={2}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
};

export default CustomDateRangePicker;
