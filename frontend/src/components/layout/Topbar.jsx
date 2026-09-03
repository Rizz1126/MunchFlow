import React from 'react';
import { Menu, Bell, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';

export default function Topbar({ onMenuClick, pageTitle = '' }) {
  const { user } = useAuth();
  const { businesses, selectedBusinessId, changeBusiness } = useBusiness();

  const isOwner = user?.role === 'owner';

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
      <div className="topbar-actions flex items-center gap-4">
        
        {/* Business Selector (Owner Only) */}
        {isOwner && (
          <div className="flex items-center bg-surface-alt rounded-lg px-3 py-1.5 border border-border-light">
            <Building2 size={16} className="text-gray-500 mr-2" />
            <select
              value={selectedBusinessId}
              onChange={(e) => changeBusiness(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-gray-700 outline-none"
              style={{ minWidth: '150px' }}
            >
              <option value="">-- Semua Bisnis --</option>
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Placeholder for notifications/alerts */}
        <button className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
