import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { CustomersPage } from './pages/Customerspage';
import { PurchasePage } from './pages/PurchasePage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesBillingPage } from './pages/SalesBilling';
import { SettingsPage } from './pages/Settings';
import { StockPage } from './pages/StockPage';
import { SupplierPage } from './pages/SupplierPage';
import { UsersPage } from './pages/Users';
import { ProtectedRoute } from './routes/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="sales" element={<SalesBillingPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route element={<ProtectedRoute roles={['ADMIN', 'MANAGER']} />}>
                  <Route path="purchase" element={<PurchasePage />} />
                  <Route path="suppliers" element={<SupplierPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="users" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
