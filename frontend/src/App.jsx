import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CashManagementPage from './pages/CashManagementPage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import POSPage from './pages/POSPage';
import ReportsPage from './pages/ReportsPage';
import BusinessPage from './pages/BusinessPage';

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<AppLayout />}>
              {/* Owner & Kasir Routes (kasir access further filtered by accessibleMenus in ProtectedRoute) */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'kasir']} />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cash" element={<CashManagementPage />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Owner Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/businesses" element={<BusinessPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BusinessProvider>
    </AuthProvider>
  );
}
