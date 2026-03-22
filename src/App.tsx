import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AppLayout from '@/components/AppLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import AuthPage from '@/pages/AuthPage';

const BuilderPage = lazy(() => import('@/pages/BuilderPage'));
const QuestionsPage = lazy(() => import('@/pages/QuestionsPage'));
const WorksheetsPage = lazy(() => import('@/pages/WorksheetsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/builder" replace />} />
          <Route
            path="builder"
            element={
              <Suspense fallback={<PageLoader />}>
                <BuilderPage />
              </Suspense>
            }
          />
          <Route
            path="questions"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuestionsPage />
              </Suspense>
            }
          />
          <Route
            path="worksheets"
            element={
              <Suspense fallback={<PageLoader />}>
                <WorksheetsPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
