import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { SafetyBanner } from './components/Layout/SafetyBanner';
import { DashboardView } from './components/Dashboard/DashboardView';
import { AppointmentsView } from './components/Appointments/AppointmentsView';
import { ReminderStudioView } from './components/ReminderStudio/ReminderStudioView';
import { PromptLabView } from './components/PromptLab/PromptLabView';
import { AutomationView } from './components/Automation/AutomationView';
import { ToastContainer } from './components/Common/Toast';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="app-layout">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header />

        <main className="page-container">
          {/* Universal Clinical Safety Guardrail Disclaimer */}
          <SafetyBanner />

          {/* Tab Views */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'studio' && <ReminderStudioView />}
          {activeTab === 'prompt-lab' && <PromptLabView />}
          {activeTab === 'automation' && <AutomationView />}
        </main>
      </div>

      {/* Floating System Toasts */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
