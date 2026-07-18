import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import * as React from 'react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ThemeValue = 'light' | 'dark' | 'system';

const subscribeToResolvedTheme = (onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => observer.disconnect();
};

const getResolvedThemeSnapshot = () => document.documentElement.classList.contains('dark');

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = React.useSyncExternalStore(subscribeToResolvedTheme, getResolvedThemeSnapshot, () => false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Toggle theme" />}>
        {isDark ? <IconMoon className="size-4" /> : <IconSun className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemeValue)}>
          <DropdownMenuRadioItem value="light">
            <IconSun className="size-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <IconMoon className="size-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <IconDeviceDesktop className="size-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
