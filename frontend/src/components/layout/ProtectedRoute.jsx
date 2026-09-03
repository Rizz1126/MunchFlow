import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';

// Map route paths to menu keys for accessibleMenus check
const ROUTE_TO_MENU_KEY = {
  '/': 'dashboard',
  '/cash': 'cash',
  '/pos': 'pos',
  '/inventory': 'inventory',
  '/recipes': 'recipes',
  '/reports': 'reports',
  '/businesses': 'businesses',
};

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const { accessibleMenus } = useBusiness();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check menu-based access for kasir
  if (user.role === 'kasir') {
    const menuKey = ROUTE_TO_MENU_KEY[location.pathname];
    if (menuKey) {
      const hasAccess = accessibleMenus.includes('all') || accessibleMenus.includes(menuKey);
      // Always allow dashboard as fallback
      if (!hasAccess && menuKey !== 'dashboard') {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <Outlet />;
}
