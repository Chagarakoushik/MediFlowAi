import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Sparkles,
  FlaskConical,
  Workflow,
  HeartPulse,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useApp, type TabType } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats, resetDatabase } = useApp();

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: <LayoutDashboard size={19} />,
    },
    {
      id: 'appointments',
      label: 'Appointments & Patients',
      icon: <CalendarCheck2 size={19} />,
      badge: stats?.pending_review_count,
    },
    {
      id: 'studio',
      label: 'AI Reminder Studio',
      icon: <Sparkles size={19} />,
    },
    {
      id: 'prompt-lab',
      label: 'Prompt Lab (Evaluation)',
      icon: <FlaskConical size={19} />,
    },
    {
      id: 'automation',
      label: 'Automation & n8n',
      icon: <Workflow size={19} />,
    },
  ];

  const isLive = stats?.ai_status?.gemini_api_configured ?? false;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-wrapper">
            <HeartPulse size={24} />
          </div>
          <div>
            <div className="brand-title">
              MediFlow<span style={{ color: '#38bdf8' }}>Ai</span>
            </div>
            <div className="brand-sub">Healthcare Follow-up</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* System Status & Footer */}
      <div className="sidebar-footer">
        <div className="mode-indicator-box">
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '6px' }}>
            System AI Engine:
          </div>
          <div className={`mode-indicator-pill ${isLive ? 'mode-live' : 'mode-demo'}`}>
            <span className="pulse-dot" />
            <span>{isLive ? 'Live Gemini 1.5 API' : 'Demo / Simulated AI'}</span>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginBottom: '14px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
          onClick={resetDatabase}
        >
          <RotateCcw size={13} />
          <span>Reset Demo Data</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
          <ShieldCheck size={14} style={{ color: '#10b981' }} />
          <span>Fictional Data &bull; HIPAA Safe</span>
        </div>
      </div>
    </aside>
  );
};
