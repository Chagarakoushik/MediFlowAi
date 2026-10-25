import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${
            t.type === 'success'
              ? 'toast-success'
              : t.type === 'error'
              ? 'toast-error'
              : ''
          }`}
        >
          {t.type === 'success' && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
          {t.type === 'error' && <AlertCircle size={16} style={{ color: '#f43f5e' }} />}
          {t.type === 'info' && <Info size={16} style={{ color: '#38bdf8' }} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
