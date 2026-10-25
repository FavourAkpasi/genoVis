import { IconAlertTriangle } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';

import { Button, buttonVariants } from '@/components/ui/button';
import { captureError } from '@/lib/observability';
import { routes } from '@/router/routes';

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'An unexpected error occurred.');

/**
 * Route-level error boundary (React Router `errorElement`). Sits inside the app shell so
 * the nav stays usable, reports the error to Sentry, and offers a reload — the usual fix
 * when a lazily-loaded route chunk is stale after a deploy.
 */
export const RouteError = () => {
  const error = useRouteError();

  useEffect(() => {
    captureError(error, { tags: { source: 'route' } });
  }, [error]);

  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
    >
      <IconAlertTriangle className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{messageOf(error)}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Link to={routes.explorer} className={buttonVariants({ variant: 'outline' })}>
          Back to Explorer
        </Link>
      </div>
    </div>
  );
};

export default RouteError;
