import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div className="clinical-safety-banner">
      <div className="safety-text">
        <ShieldAlert size={18} style={{ color: '#1d4ed8', flexShrink: 0 }} />
        <div>
          <span className="safety-pill">Clinical Safety Guardrail</span>
          <span style={{ fontWeight: 600, marginLeft: '6px' }}>
            Non-Diagnostic Mandate:
          </span>{' '}
          MediFlowAi strictly generates operational reminders and discharge care prompts. It{' '}
          <strong>never provides medical diagnoses or alters prescriptions</strong>. All communications require{' '}
          <strong>licensed staff review & sign-off</strong> before transmission.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#1e40af', fontWeight: 600 }}>
        <AlertCircle size={14} />
        <span>Fictional Patient Sandbox</span>
      </div>
    </div>
  );
};
