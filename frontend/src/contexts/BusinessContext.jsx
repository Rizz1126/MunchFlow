import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [accessibleMenus, setAccessibleMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize and fetch businesses when user changes
  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setSelectedBusinessId('');
      setLoading(false);
      return;
    }

    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        // Both owner and kasir use the same endpoint, backend handles filtering
        const data = await api.getBusinesses();
        setBusinesses(data);

        // Auto-select logic
        if (user.role === 'kasir') {
          // Kasir is restricted to their assigned business(es)
          if (data.length > 0) {
            setSelectedBusinessId(data[0].id.toString());
          }
        } else {
          // Owner can see "All Businesses", default to empty (all)
          // If they previously selected one, keep it if it still exists
          const savedId = localStorage.getItem('selectedBusinessId');
          if (savedId && data.some(b => b.id.toString() === savedId)) {
            setSelectedBusinessId(savedId);
          } else {
            setSelectedBusinessId(''); // '' means All Businesses for Owner
          }
        }
      } catch (err) {
        console.error('Failed to fetch businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [user]);

  // Handle business selection change
  const changeBusiness = (id) => {
    if (user?.role === 'kasir') return; // Kasir cannot change business freely
    
    setSelectedBusinessId(id);
    if (id) {
      localStorage.setItem('selectedBusinessId', id);
    } else {
      localStorage.removeItem('selectedBusinessId');
    }
  };

  // Derive accessible menus whenever selectedBusinessId or businesses change
  useEffect(() => {
    if (user?.role === 'owner') {
      setAccessibleMenus(['all']);
    } else if (user?.role === 'kasir' && selectedBusinessId && user.assignedBusinesses) {
      const activeBiz = user.assignedBusinesses.find(b => b.id.toString() === selectedBusinessId);
      if (activeBiz && activeBiz.accessibleMenus) {
        setAccessibleMenus(activeBiz.accessibleMenus.split(',').map(s => s.trim()));
      } else {
        setAccessibleMenus([]);
      }
    } else {
      setAccessibleMenus([]);
    }
  }, [user, selectedBusinessId]);

  // Provide a method to refresh the list
  const refreshBusinesses = async () => {
    try {
      const data = await api.getBusinesses();
      setBusinesses(data);
    } catch (err) {}
  };

  return (
    <BusinessContext.Provider 
      value={{ 
        businesses, 
        selectedBusinessId, 
        accessibleMenus,
        changeBusiness, 
        loading,
        refreshBusinesses
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}

export default BusinessContext;
