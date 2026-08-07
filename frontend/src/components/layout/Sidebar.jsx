import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  WalletCards, 
  Package, 
  ChefHat, 
  Store, 
  PieChart, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CONFIG } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['owner', 'kasir'] },
    { name: 'Kas Masuk & Keluar', path: '/cash', icon: WalletCards, roles: ['owner', 'kasir'] },
    { name: 'POS (Kasir)', path: '/pos', icon: Store, roles: ['owner', 'kasir'] },
    { name: 'Inventaris', path: '/inventory', icon: Package, roles: ['owner'] },
    { name: 'Resep & Menu', path: '/recipes', icon: ChefHat, roles: ['owner'] },
    { name: 'Laporan', path: '/reports', icon: PieChart, roles: ['owner'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">M</div>
          <div>
            <h1>{CONFIG.APP_NAME}</h1>
            <span>Micro F&B POS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Utama</div>
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.displayName?.[0] || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.displayName}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
