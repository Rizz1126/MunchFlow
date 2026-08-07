import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Topbar({ onMenuClick, pageTitle = '' }) {
  const { user } = useAuth();

  return (
    <header className="app-topbar">
      <div className="flex items-center gap-4">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="topbar-title">
          <h2>{pageTitle}</h2>
          <p>Selamat datang kembali, {user?.displayName}</p>
        </div>
      </div>
      <div className="topbar-actions">
        {/* Placeholder for notifications/alerts */}
        <button className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
