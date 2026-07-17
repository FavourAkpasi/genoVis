import { NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

const navItems = [
  { to: routes.explorer, label: 'Explorer' },
  { to: routes.caseStudy, label: 'Case Study' },
];

export const DashboardLayout = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">GenoVis</span>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-muted text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
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
