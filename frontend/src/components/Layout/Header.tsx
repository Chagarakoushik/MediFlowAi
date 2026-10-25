import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, RefreshCw, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, refreshStats, loadingStats, setIsCreateModalOpen } = useApp();

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Executive Healthcare Dashboard',
          subtitle: 'Real-time overview of post-care follow-up pipelines, no-show risks, and AI reminder statuses.',
        };
      case 'appointments':
        return {
          title: 'Appointments & Patient Directory',
          subtitle: 'Manage patient records, track follow-up progress, and filter clinical visit schedules.',
        };
      case 'studio':
        return {
          title: 'AI Reminder Studio',
          subtitle: 'Generate tailored multi-channel patient communications with Gemini AI and strict safety guardrails.',
        };
      case 'prompt-lab':
        return {
          title: 'Prompt Engineering & Safety Lab',
          subtitle: 'Evaluate Basic vs Improved vs Safety-Aware prompt tiers on identical clinical test scenarios.',
        };
      case 'automation':
        return {
          title: 'n8n Automation & Webhook Dispatcher',
          subtitle: 'Configure automated outbound webhook dispatchers, inspect JSON payloads, and test workflows.',
        };
      default:
        return { title: 'MediFlowAi', subtitle: 'Healthcare Follow-up System' };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="top-header">
      <div className="header-title-block">
        <h1>{meta.title}</h1>
        <div className="header-subtitle">{meta.subtitle}</div>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => refreshStats()}
          disabled={loadingStats}
          title="Refresh Statistics & Records"
        >
          <RefreshCw size={14} className={loadingStats ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={15} />
          <span>New Appointment</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            backgroundColor: '#f1f5f9',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#334155',
            border: '1px solid #e2e8f0',
          }}
        >
          <UserCheck size={14} style={{ color: '#2563eb' }} />
          <span>Staff: Nurse S. Connor, RN</span>
        </div>
      </div>
    </header>
  );
};
