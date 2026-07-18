import { IconMenu2 } from '@tabler/icons-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

const navItems = [
  { to: routes.explorer, label: 'Explorer' },
  { to: routes.caseStudy, label: 'Case Study' },
  { to: routes.insights, label: 'Insights' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
    isActive && 'bg-muted text-foreground'
  );

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" className="sm:hidden" />}>
              <IconMenu2 className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetTitle className="border-bottom-1 border p-3 text-3xl font-semibold tracking-tight">
                GenoVis
              </SheetTitle>
              <div className="mt-4 flex flex-col gap-1 px-2">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end onClick={() => setMobileOpen(false)} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-2xl font-semibold tracking-tight">GenoVis</span>

          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
