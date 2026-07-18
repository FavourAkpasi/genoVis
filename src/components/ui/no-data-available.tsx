import { IconDatabaseOff } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

interface NoDataAvailableProps {
  /** Message shown below the icon. Falls back to a generic empty-state string. */
  text?: string;
  /** Optional icon override. */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Centered empty-state block. Meant to sit inside a card's body (below its heading),
 * so it never covers the surrounding title.
 */
export const NoDataAvailable = ({ text = 'No data available', icon, className }: NoDataAvailableProps) => (
  <div className={cn('flex min-h-40 w-full flex-col items-center justify-center gap-2 text-center', className)}>
    <span className="text-muted-foreground/50">{icon ?? <IconDatabaseOff className="size-8" />}</span>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default NoDataAvailable;
