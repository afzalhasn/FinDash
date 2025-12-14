"use client";
import { AppProvider, useApp, AppPage, UserRole } from './context/AppContext';
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

const PAGE_ACCESS: Partial<Record<AppPage, UserRole[]>> = {
  'add-entry': ['admin', 'partner'],
  'add-investor': ['admin'],
  'new-account': ['admin'],
};

function canAccess(page: AppPage, role?: UserRole): boolean {
  const allowedRoles = PAGE_ACCESS[page];
  if (!allowedRoles) return true;
  return role ? allowedRoles.includes(role) : false;
}

function AppRouter() {
  const { currentPage, user } = useApp();

  // Redirect unauthenticated users to login
  if (!user) {
    return pageComponents.login;
  }

  // Authenticated but accessing forbidden page
  if (!canAccess(currentPage, user.role)) {
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
