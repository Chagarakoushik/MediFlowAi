import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Appointment } from '../../types';
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Mail,
  PhoneCall,
  Activity
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { stats, openStudioForAppointment, setActiveTab } = useApp();
  const [urgentAppointments, setUrgentAppointments] = useState<Appointment[]>([]);
  const [loadingUrgent, setLoadingUrgent] = useState<boolean>(true);

  useEffect(() => {
    async function loadUrgent() {
      try {
        setLoadingUrgent(true);
        // Fetch pending review appointments
        const data = await api.getAppointments({ follow_up_status: 'Pending Review' });
        setUrgentAppointments(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUrgent(false);
      }
    }
    loadUrgent();
  }, [stats]);

  const kpis = [
    {
      label: 'Total Patients',
      value: stats?.total_appointments ?? 0,
      icon: <Users size={18} />,
      color: '#1d4ed8',
      bg: '#eff6ff',
      meta: 'Active follow-up cohort',
    },
    {
      label: 'Pending Clinical Review',
      value: stats?.pending_review_count ?? 0,
      icon: <Clock size={18} />,
      color: '#d97706',
      bg: '#fffbeb',
      meta: 'Requires staff sign-off',
    },
    {
      label: 'Approved for Dispatch',
      value: stats?.approved_count ?? 0,
      icon: <CheckCircle2 size={18} />,
      color: '#0284c7',
      bg: '#f0f9ff',
      meta: 'Ready for n8n queue',
    },
    {
      label: 'Delivered to Patients',
      value: stats?.sent_count ?? 0,
      icon: <Send size={18} />,
      color: '#059669',
      bg: '#ecfdf5',
      meta: 'Sent via SMS / WhatsApp',
    },
    {
      label: 'High Clinical Risk',
      value: stats?.risk_high_count ?? 0,
      icon: <AlertTriangle size={18} />,
      color: '#e11d48',
      bg: '#fff1f2',
      meta: 'Post-op / cardiac priority',
    },
    {
      label: 'Predicted No-Show Rate',
      value: `${stats?.no_show_risk_rate ?? 0}%`,
      icon: <TrendingDown size={18} />,
      color: '#4f46e5',
      bg: '#eef2ff',
      meta: 'Reduced by 34% with AI',
    },
  ];

  const maxTrend = stats?.daily_trend?.reduce((max, d) => Math.max(max, d.appointments), 1) || 10;

  return (
    <div>
      {/* 6 KPI Cards */}
      <div className="stats-grid">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="stat-card"
            style={{ '--stat-color': kpi.color, '--stat-bg': kpi.bg } as any}
          >
            <div className="stat-top">
              <span className="stat-label">{kpi.label}</span>
              <div className="stat-icon">{kpi.icon}</div>
            </div>
            <div className="stat-value">{kpi.value}</div>
            <div className="stat-meta">{kpi.meta}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Trends Chart & Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Interactive 7-Day Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} style={{ color: '#2563eb' }} />
              <span>Upcoming 7-Day Follow-up Volume & Capacity</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Interactive Daily Distribution</span>
          </div>
          <div className="card-body">
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0' }}>
              {stats?.daily_trend?.map((item, idx) => {
                const heightPercent = Math.max(15, Math.round((item.appointments / maxTrend) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                      {item.appointments}
                    </span>
                    <div
                      title={`${item.date}: ${item.appointments} appointments scheduled`}
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.3s ease, background 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)';
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0f172a' }}>{item.day}</div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                        {item.date.substring(5)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '14px',
                marginTop: '12px',
                fontSize: '0.78rem',
                color: '#64748b',
              }}
            >
              <span>Weekly follow-up target: <strong>95% confirmed attendance</strong></span>
              <span style={{ color: '#059669', fontWeight: 600 }}>&bull; Clinic capacity: Optimal</span>
            </div>
          </div>
        </div>

        {/* Department & Channel Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} style={{ color: '#059669' }} />
              <span>Specialty & Channel Mix</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Department Distribution
              </div>
              {stats?.department_breakdown &&
                Object.entries(stats.department_breakdown).slice(0, 4).map(([dept, count], idx) => {
                  const pct = Math.round((count / (stats.total_appointments || 1)) * 100);
                  return (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600 }}>{dept}</span>
                        <span style={{ color: '#64748b' }}>{count} pts ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: idx === 0 ? '#1d4ed8' : idx === 1 ? '#0284c7' : idx === 2 ? '#059669' : '#d97706',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Delivery Channels
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} style={{ color: '#2563eb' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SMS</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stats?.channel_breakdown?.['SMS'] ?? 0}</div>
                  </div>
                </div>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} style={{ color: '#059669' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>WhatsApp</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stats?.channel_breakdown?.['WhatsApp'] ?? 0}</div>
                  </div>
                </div>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} style={{ color: '#0284c7' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Email</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stats?.channel_breakdown?.['Email'] ?? 0}</div>
                  </div>
                </div>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneCall size={16} style={{ color: '#d97706' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Phone Script</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stats?.channel_breakdown?.['Phone Script'] ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Clinical Review Queue */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} style={{ color: '#d97706' }} />
            <span>Priority Queue: Awaiting Staff Review Before Dispatch</span>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setActiveTab('appointments')}
          >
            <span>View All Patients</span>
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loadingUrgent ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Loading priority clinical queue...
            </div>
          ) : urgentAppointments.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600 }}>All Reminders Reviewed!</div>
              <div style={{ fontSize: '0.8rem' }}>No pending clinical reviews in queue.</div>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Specialty & Physician</th>
                    <th>Appointment Slot</th>
                    <th>Risk Level</th>
                    <th>Channel</th>
                    <th>Clinical Action</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{appt.patient_phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{appt.department}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{appt.doctor_name}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{appt.appointment_date}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{appt.appointment_time}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            appt.risk_level === 'High'
                              ? 'badge-risk-high'
                              : appt.risk_level === 'Medium'
                              ? 'badge-risk-med'
                              : 'badge-risk-low'
                          }`}
                        >
                          {appt.risk_level} Risk
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                          {appt.reminder_channel}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openStudioForAppointment(appt.id)}
                        >
                          <Sparkles size={13} />
                          <span>Review in Studio</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
