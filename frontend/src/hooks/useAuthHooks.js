import { useAuth } from '../contexts/AuthContext';

export function useRequireAuth() {
  const { user, loading } = useAuth();
  return { user, loading, isAuthenticated: !!user };
}

export function useRequireRole(allowedRoles = []) {
  const { user, loading } = useAuth();
  
  const hasRole = user && allowedRoles.includes(user.role);

  return { 
    user, 
    loading, 
    isAuthenticated: !!user,
    hasRole,
    isOwner: user?.role === 'owner',
    isKasir: user?.role === 'kasir'
  };
}
