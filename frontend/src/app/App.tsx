"use client";
import { AppProvider, useApp, AppPage } from './context/AppContext';
import { AuthProvider, useAuth } from '../features/auth/context';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProductInsightsPage } from './pages/ProductInsightsPage';
import { AddInvestorPage } from './pages/AddInvestorPage';
import { NewAccountPage } from './pages/NewAccountPage';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

const pageComponents: Record<AppPage, JSX.Element> = {
  login: <LoginPage />,
  dashboard: <DashboardPage />,
  'add-entry': <AddEntryPage />,
  history: <TransactionsPage />,
  insights: <ProductInsightsPage />,
  'add-investor': <AddInvestorPage />,
  'new-account': <NewAccountPage />,
};

function AppRouter() {
  const { currentPage, isBootstrapping } = useApp();
  const { user, isAuthorized } = useAuth();

  // Redirect unauthenticated users to login
  if (!user) {
    return pageComponents.login;
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // Authenticated but accessing forbidden page
  if (!isAuthorized(currentPage)) {
    return pageComponents.dashboard;
  }

  return pageComponents[currentPage] ?? pageComponents.dashboard;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </AuthProvider>
  );
}
