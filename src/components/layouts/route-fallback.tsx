import { IconLoader2 } from '@tabler/icons-react';

/**
 * Shown by the route-level <Suspense> boundary while a lazily-loaded
 * route chunk is being fetched. The app shell (nav) stays painted; only
 * this fills the <Outlet /> area during the download.
 */
export const RouteFallback = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading view">
      <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default RouteFallback;
