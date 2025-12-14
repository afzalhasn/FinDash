import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProductInsightsPage } from './pages/ProductInsightsPage';
import { AddInvestorPage } from './pages/AddInvestorPage';
import { NewAccountPage } from './pages/NewAccountPage';
import { Toaster } from 'sonner';

function AppRouter() {
  const { currentPage, user } = useApp();

  // Redirect to login if not authenticated
  if (!user && currentPage !== 'login') {
    return <LoginPage />;
  }

  switch (currentPage) {
    case 'login':
      return <LoginPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'add-entry':
      // Admin & Partner can access add entry page
      if (user?.role === 'admin' || user?.role === 'partner') {
        return <AddEntryPage />;
      }
      return <DashboardPage />;
    case 'history':
      return <TransactionsPage />;
    case 'insights':
      return <ProductInsightsPage />;
    case 'add-investor':
      // Only admin can access investor page
      if (user?.role === 'admin') {
        return <AddInvestorPage />;
      }
      return <DashboardPage />;
    case 'new-account':
      // Only admin can access account management page
      if (user?.role === 'admin') {
        return <NewAccountPage />;
      }
      return <DashboardPage />;
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
