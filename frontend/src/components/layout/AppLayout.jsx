import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine page title based on route
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/cash': return 'Kas Masuk & Keluar';
      case '/inventory': return 'Inventaris';
      case '/recipes': return 'Resep & Menu';
      case '/pos': return 'Point of Sale (POS)';
      case '/reports': return 'Laporan Keuangan';
      default: return 'MunchFlow';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="app-main">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)} 
          pageTitle={getPageTitle(location.pathname)}
        />
        
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
