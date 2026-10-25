import { lazy } from 'react';
import { Navigate, RouterProvider } from 'react-router-dom';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { RouteError } from '@/components/layouts/route-error';
import { createAppRouter } from '@/lib/observability';
import { routes } from '@/router/routes';

// Route-level code splitting: each import() becomes its own chunk, fetched
// only when the route is visited. The shell (DashboardLayout) stays eager so
// the nav paints immediately; route content streams in under <Suspense>.
const ExplorerView = lazy(() => import('@/components/modules/explorer/explorer-view'));
const CaseStudyView = lazy(() => import('@/components/modules/case-study/case-study-view'));
const InsightsView = lazy(() => import('@/components/modules/insights/insights-view'));

const router = createAppRouter([
  {
    element: <DashboardLayout />,
    // Last resort if the shell itself throws.
    errorElement: <RouteError />,
    children: [
      {
        // Pathless boundary: a crashing page renders the error inside the shell, so the nav stays usable.
        errorElement: <RouteError />,
        children: [
          { path: routes.explorer, element: <ExplorerView /> },
          { path: routes.caseStudy, element: <CaseStudyView /> },
          { path: routes.insights, element: <InsightsView /> },
          { path: '*', element: <Navigate to={routes.explorer} replace /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
