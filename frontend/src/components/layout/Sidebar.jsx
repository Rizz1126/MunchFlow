import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  WalletCards, 
  Package, 
  ChefHat, 
  Store, 
  PieChart, 
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { CONFIG } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { accessibleMenus } = useBusiness();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['owner', 'kasir'], menuKey: 'dashboard' },
    { name: 'Kas Masuk & Keluar', path: '/cash', icon: WalletCards, roles: ['owner', 'kasir'], menuKey: 'cash' },
    { name: 'POS (Kasir)', path: '/pos', icon: Store, roles: ['owner', 'kasir'], menuKey: 'pos' },
    { name: 'Inventaris', path: '/inventory', icon: Package, roles: ['owner'], menuKey: 'inventory' },
    { name: 'Resep & Menu', path: '/recipes', icon: ChefHat, roles: ['owner'], menuKey: 'recipes' },
    { name: 'Laporan', path: '/reports', icon: PieChart, roles: ['owner'], menuKey: 'reports' },
    { name: 'Kelola Bisnis', path: '/businesses', icon: Building2, roles: ['owner'], menuKey: 'businesses' },
  ];

  const allowedNavItems = navItems.filter(item => {
    // Must have the correct role
    if (!item.roles.includes(user?.role)) return false;

    // Owner always has full access
    if (user?.role === 'owner') return true;

    // Kasir: check accessibleMenus
    // If accessibleMenus includes 'all', show everything for their role
    if (accessibleMenus.includes('all')) return true;

    // If no accessibleMenus configured (empty), show nothing except dashboard
    if (accessibleMenus.length === 0) return item.menuKey === 'dashboard';

    // Otherwise check if this menu key is in the accessible list
    return accessibleMenus.includes(item.menuKey);
  });

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
