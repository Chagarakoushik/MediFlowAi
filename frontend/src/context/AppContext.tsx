import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { api } from '../services/api';

export type TabType = 'dashboard' | 'appointments' | 'studio' | 'prompt-lab' | 'automation';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedAppointmentId: number | null;
  setSelectedAppointmentId: (id: number | null) => void;
  stats: DashboardStats | null;
  loadingStats: boolean;
  refreshStats: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  resetDatabase: () => Promise<void>;
  openStudioForAppointment: (id: number) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      showToast('Could not refresh stats: ' + err.message, 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const resetDatabase = async () => {
    try {
      await api.resetSeedData();
      showToast('Sample fictional patient records successfully restored!', 'success');
      await refreshStats();
    } catch (err: any) {
      showToast('Failed to reset data: ' + err.message, 'error');
    }
  };

  const openStudioForAppointment = (id: number) => {
    setSelectedAppointmentId(id);
    setActiveTab('studio');
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedAppointmentId,
        setSelectedAppointmentId,
        stats,
        loadingStats,
        refreshStats,
        showToast,
        toasts,
        removeToast,
        resetDatabase,
        openStudioForAppointment,
        isCreateModalOpen,
        setIsCreateModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
