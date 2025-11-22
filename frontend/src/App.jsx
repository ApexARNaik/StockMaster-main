import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import AuthForm from '../components/AuthForm';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ProductList from '../components/ProductList';
import ReceiptForm from '../components/ReceiptForm';
import DeliveryForm from '../components/DeliveryForm';
import TransferForm from '../components/TransferForm';
import AdjustmentForm from '../components/AdjustmentForm';
import LedgerView from '../components/LedgerView';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/auth" element={<AuthForm />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen bg-dark-bg text-white">
          <Sidebar />
          <div className="flex-1 p-8 ml-64">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route
                path="/inventory/receipts"
                element={
                  <AdminRoute>
                    <ReceiptForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/inventory/deliveries"
                element={
                  <AdminRoute>
                    <DeliveryForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/inventory/transfers"
                element={
                  <AdminRoute>
                    <TransferForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/inventory/adjustments"
                element={
                  <AdminRoute>
                    <AdjustmentForm />
                  </AdminRoute>
                }
              />
              <Route path="/ledger" element={<LedgerView />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;