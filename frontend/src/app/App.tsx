"use client";
import { AppProvider, useApp, AppPage } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProductInsightsPage } from './pages/ProductInsightsPage';
import { AddInvestorPage } from './pages/AddInvestorPage';
import { NewAccountPage } from './pages/NewAccountPage';
import { Toaster } from 'sonner';

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
  const { currentPage, user, isAuthorized } = useApp();

  // Redirect unauthenticated users to login
  if (!user) {
    return pageComponents.login;
  }

  // Authenticated but accessing forbidden page
  if (!isAuthorized(currentPage)) {
    return pageComponents.dashboard;
  }

  return pageComponents[currentPage] ?? pageComponents.dashboard;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
