import { IconDownload } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ExportItemT {
  label: string;
  onSelect: () => void;
}

interface ExportMenuProps {
  items: ExportItemT[];
  disabled?: boolean;
  label?: string;
}

/** Reusable export control: a small "Export" dropdown driven by whatever items a card provides. */
export const ExportMenu = ({ items, disabled, label = 'Export' }: ExportMenuProps) => {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} className="shrink-0 gap-1.5" />}
      >
        <IconDownload className="size-4" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onSelect}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
