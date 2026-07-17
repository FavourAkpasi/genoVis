import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { CaseStudyView } from '@/components/modules/case-study/case-study-view';
import { ExplorerView } from '@/components/modules/explorer/explorer-view';
import { routes } from '@/router/routes';

const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      { path: routes.explorer, element: <ExplorerView /> },
      { path: routes.caseStudy, element: <CaseStudyView /> },
      { path: '*', element: <Navigate to={routes.explorer} replace /> },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
