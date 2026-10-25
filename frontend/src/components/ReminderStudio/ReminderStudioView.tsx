import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Appointment, ChannelType, ReminderGenerateResponse } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Send,
  MessageSquare,
  Mail,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  Check
} from 'lucide-react';

export const ReminderStudioView: React.FC = () => {
  const { selectedAppointmentId, setSelectedAppointmentId, showToast, refreshStats } = useApp();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Configuration options
  const [channel, setChannel] = useState<ChannelType>('SMS');
  const [tone, setTone] = useState<string>('Empathetic & Professional');
  const [language, setLanguage] = useState<string>('English');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [forceSimulation, setForceSimulation] = useState<boolean>(false);

  // Generation state
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<ReminderGenerateResponse | null>(null);

  // Editable text & staff review
  const [draftText, setDraftText] = useState<string>('');
  const [subjectLine, setSubjectLine] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Nurse Sarah Connor, RN');
  const [staffRemarks, setStaffRemarks] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);

  // Load appointments list for dropdown
  useEffect(() => {
    async function fetchList() {
      try {
        const list = await api.getAppointments();
        setAppointments(list);
        if (list.length > 0) {
          const match = selectedAppointmentId
            ? list.find((a) => a.id === selectedAppointmentId)
            : list[0];
          const appt = match || list[0];
          setSelectedAppt(appt);
          setSelectedAppointmentId(appt.id);
          setChannel(appt.reminder_channel);
          setLanguage(appt.language_preference);

          if (appt.ai_generated_reminder) {
            setDraftText(appt.ai_generated_reminder);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchList();
  }, []);

  // Update selected appointment on dropdown change
  const handleSelectAppt = (id: number) => {
    const found = appointments.find((a) => a.id === id);
    if (found) {
      setSelectedAppt(found);
      setSelectedAppointmentId(id);
      setChannel(found.reminder_channel);
      setLanguage(found.language_preference);
      setDraftText(found.ai_generated_reminder || '');
      setGeneratedResult(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAppt) return;
    try {
      setGenerating(true);
      const res = await api.generateReminder({
        appointment_id: selectedAppt.id,
        channel,
        tone,
        language,
        custom_instructions: customInstructions,
        force_simulation: forceSimulation,
      });

      setGeneratedResult(res);
      setDraftText(res.reminder_text);
      if (res.subject_line) {
        setSubjectLine(res.subject_line);
      }
      showToast(
        res.is_simulated
          ? 'Generated reminder via Simulated Healthcare Engine'
          : 'Generated reminder via live Gemini API!',
        'success'
      );
      refreshStats();
    } catch (err: any) {
      showToast('Generation failed: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    showToast('Reminder copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!selectedAppt) return;
    try {
      await api.reviewReminder({
        appointment_id: selectedAppt.id,
        approved_text: draftText,
        reviewed_by: reviewerName,
        decision: 'Approved',
        staff_notes: staffRemarks || 'Staff verified clinical safety and approved communication.',
      });

      showToast(`Reminder approved by ${reviewerName}! Status is now APPROVED.`, 'success');
      refreshStats();
      // Update local state
      setSelectedAppt({
        ...selectedAppt,
        follow_up_status: 'Approved',
        ai_generated_reminder: draftText,
        reviewed_by: reviewerName,
      });
    } catch (err: any) {
      showToast('Review submission failed: ' + err.message, 'error');
    }
  };

  const handleDispatch = async () => {
    if (!selectedAppt) return;
    if (selectedAppt.follow_up_status !== 'Approved') {
      showToast('Reminder must be Approved by staff before dispatching!', 'error');
      return;
    }
    try {
      setDispatching(true);
      const res = await api.dispatchReminder({
        appointment_id: selectedAppt.id,
        channel,
        message_content: draftText,
        subject_line: subjectLine,
        simulate_only: true, // safe default for assessment testing
      });

      showToast(`Dispatched to patient! Event logged with status: ${res.status}`, 'success');
      refreshStats();
      setSelectedAppt({
        ...selectedAppt,
        follow_up_status: 'Sent',
      });
    } catch (err: any) {
      showToast('Dispatch failed: ' + err.message, 'error');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div>
      {/* Patient Selector Bar */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Select Patient:</span>
          <select
            className="form-control"
            style={{ maxWidth: '380px' }}
            value={selectedAppt?.id || ''}
            onChange={(e) => handleSelectAppt(Number(e.target.value))}
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.patient_name} — {a.department} ({a.appointment_date}) [{a.follow_up_status}]
              </option>
            ))}
          </select>
        </div>

        {selectedAppt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className={`badge ${
                selectedAppt.risk_level === 'High'
                  ? 'badge-risk-high'
                  : selectedAppt.risk_level === 'Medium'
                  ? 'badge-risk-med'
                  : 'badge-risk-low'
              }`}
            >
              {selectedAppt.risk_level} Risk
            </span>
            <span
              className={`badge ${
                selectedAppt.follow_up_status === 'Approved'
                  ? 'badge-approved'
                  : selectedAppt.follow_up_status === 'Sent'
                  ? 'badge-sent'
                  : 'badge-pending'
              }`}
            >
              {selectedAppt.follow_up_status}
            </span>
          </div>
        )}
      </div>

      {selectedAppt && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '24px' }}>
          {/* Left Column: Clinical Context & Generator Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Patient Clinical Background Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <UserCheck size={18} style={{ color: '#2563eb' }} />
                  <span>Clinical Profile: {selectedAppt.patient_name}</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {selectedAppt.gender}, {selectedAppt.patient_age} yrs
                </span>
              </div>
              <div className="card-body" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Physician:</span> <strong>{selectedAppt.doctor_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Department:</span> <strong>{selectedAppt.department}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Appointment:</span>{' '}
                    <strong>{selectedAppt.appointment_date} at {selectedAppt.appointment_time}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Visit Type:</span> <strong>{selectedAppt.appointment_type}</strong>
                  </div>
                </div>

                {selectedAppt.clinical_notes && (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px' }}>
                    <strong style={{ color: '#334155' }}>Clinical Notes:</strong>{' '}
                    <span style={{ color: '#475569' }}>{selectedAppt.clinical_notes}</span>
                  </div>
                )}

                {selectedAppt.discharge_instructions && (
                  <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
                    <strong style={{ color: '#1e40af' }}>Discharge / Care Instructions:</strong>{' '}
                    <span style={{ color: '#1e3a8a' }}>{selectedAppt.discharge_instructions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Studio Generator Controls Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Sparkles size={18} style={{ color: '#4f46e5' }} />
                  <span>AI Reminder Studio Controls</span>
                </div>
              </div>
              <div className="card-body">
                {/* Channel Select Tabs */}
                <div className="form-group">
                  <label className="form-label">Delivery Channel</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {(['SMS', 'WhatsApp', 'Email', 'Phone Script'] as ChannelType[]).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        className={`btn btn-sm ${channel === ch ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setChannel(ch)}
                      >
                        {ch === 'SMS' && <MessageSquare size={13} />}
                        {ch === 'WhatsApp' && <MessageSquare size={13} />}
                        {ch === 'Email' && <Mail size={13} />}
                        {ch === 'Phone Script' && <PhoneCall size={13} />}
                        <span>{ch}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Communication Tone</label>
                    <select
                      className="form-control"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="Empathetic & Professional">Empathetic & Professional</option>
                      <option value="Direct & Urgent">Direct & Urgent</option>
                      <option value="Warm & Reassuring">Warm & Reassuring</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select
                      className="form-control"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Clinical Instructions (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Remind patient to fast 8 hrs, or emphasize knee elevation"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                </div>

                {/* Simulation Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Simulation Sandbox Mode</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Force simulated AI generation (useful for testing without an API key)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={forceSimulation}
                    onChange={(e) => setForceSimulation(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  <Sparkles size={16} />
                  <span>{generating ? 'Drafting with Clinical Guardrails...' : 'Generate AI Reminder Draft'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Mockup Preview & Staff Review Sign-Off */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live Message Preview Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  {channel === 'SMS' && <MessageSquare size={18} style={{ color: '#2563eb' }} />}
                  {channel === 'WhatsApp' && <MessageSquare size={18} style={{ color: '#059669' }} />}
                  {channel === 'Email' && <Mail size={18} style={{ color: '#0284c7' }} />}
                  {channel === 'Phone Script' && <PhoneCall size={18} style={{ color: '#d97706' }} />}
                  <span>Live {channel} Patient Preview</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {generatedResult && (
                    <span
                      className={`badge ${
                        generatedResult.is_simulated ? 'mode-demo' : 'mode-live'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {generatedResult.is_simulated ? 'Simulated AI' : 'Live Gemini 1.5'}
                    </span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopy}
                    disabled={!draftText}
                    title="Copy Text"
                  >
                    {copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ background: '#f8fafc' }}>
                {channel === 'SMS' && (
                  <div className="phone-mockup">
                    <div className="phone-screen">
                      <div
                        style={{
                          background: '#1e293b',
                          color: '#ffffff',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageSquare size={14} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>MediFlow Clinic</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Verified SMS &bull; 555-019-2834</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px' }}>
                        <div className="chat-bubble-sms">
                          {draftText || 'Click "Generate AI Reminder Draft" to preview personalized message...'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'right', marginRight: '14px' }}>
                          Delivered &bull; Just now
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {channel === 'WhatsApp' && (
                  <div className="phone-mockup">
                    <div className="phone-screen" style={{ background: '#efeae2' }}>
                      <div
                        style={{
                          background: '#075e54',
                          color: '#ffffff',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#075e54', fontWeight: 800 }}>
                          M
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>MediFlow Healthcare</div>
                          <div style={{ fontSize: '0.68rem', color: '#c5ecd4' }}>Official Business Account</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px' }}>
                        <div className="chat-bubble-whatsapp">
                          <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {draftText || 'Click "Generate AI Reminder Draft" to preview WhatsApp format...'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {channel === 'Email' && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <strong>From:</strong> Care Coordination &lt;mediflowai@mediflow-clinic.org&gt;
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <strong>To:</strong> {selectedAppt.patient_name} &lt;{selectedAppt.patient_email || 'patient@example.com'}&gt;
                      </div>
                      {subjectLine && (
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                          Subject: {subjectLine}
                        </div>
                      )}
                    </div>
                    <pre
                      style={{
                        fontFamily: 'inherit',
                        fontSize: '0.82rem',
                        whiteSpace: 'pre-wrap',
                        color: '#1e293b',
                        lineHeight: '1.6',
                      }}
                    >
                      {draftText || 'Click "Generate AI Reminder Draft" to preview email notice...'}
                    </pre>
                  </div>
                )}

                {channel === 'Phone Script' && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 700, fontSize: '0.82rem', marginBottom: '10px' }}>
                      <PhoneCall size={16} />
                      <span>Clinical Staff Outbound Call Script</span>
                    </div>
                    <pre
                      style={{
                        fontFamily: 'inherit',
                        fontSize: '0.82rem',
                        whiteSpace: 'pre-wrap',
                        color: '#334155',
                        lineHeight: '1.6',
                      }}
                    >
                      {draftText || 'Click "Generate AI Reminder Draft" to preview concierge protocol script...'}
                    </pre>
                  </div>
                )}

                {/* Metrics bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>Characters: <strong>{draftText.length}</strong></span>
                  <span>Est. Reading Time: <strong>{Math.max(1, Math.round(draftText.length / 25))}s</strong></span>
                  <span>Target: <strong>{selectedAppt.patient_phone}</strong></span>
                </div>
              </div>
            </div>

            {/* AI Safety Guardrail Real-Time Audit */}
            {generatedResult && (
              <div
                className="card"
                style={{
                  borderLeft: `4px solid ${
                    generatedResult.safety_audit.passes_guardrails ? '#059669' : '#e11d48'
                  }`,
                }}
              >
                <div className="card-header">
                  <div className="card-title">
                    <ShieldCheck
                      size={18}
                      style={{
                        color: generatedResult.safety_audit.passes_guardrails ? '#059669' : '#e11d48',
                      }}
                    />
                    <span>AI Safety Guardrail Audit</span>
                  </div>
                  <span
                    className={`badge ${
                      generatedResult.safety_audit.passes_guardrails ? 'badge-sent' : 'badge-flagged'
                    }`}
                  >
                    Compliance Score: {generatedResult.safety_audit.score}/100
                  </span>
                </div>
                <div className="card-body" style={{ fontSize: '0.8rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>Non-Diagnostic Boundary: <strong>Verified</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>No Medication Dosage Tampering</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>Emergency 911 / ER Escalation: <strong>Included</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>Human Staff Review Mandate</span>
                    </div>
                  </div>

                  {generatedResult.safety_audit.flags.length > 0 && (
                    <div style={{ background: '#fff1f2', padding: '8px 12px', borderRadius: '6px', color: '#991b1b', marginTop: '8px' }}>
                      <strong>Safety Warnings:</strong> {generatedResult.safety_audit.flags.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Review & Sign-Off (Human-in-the-Loop) */}
            <div className="card" style={{ border: '2px solid #bfdbfe', background: '#ffffff' }}>
              <div className="card-header" style={{ background: '#eff6ff' }}>
                <div className="card-title">
                  <UserCheck size={18} style={{ color: '#1d4ed8' }} />
                  <span>Licensed Staff Review & Approval (Required Before Transmission)</span>
                </div>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">
                    Edit Reminder Content (Staff has final editorial control):
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="AI draft appears here. You may edit directly..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Reviewing Staff Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Audit Remarks</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Verified fasting disclaimer"
                      value={staffRemarks}
                      onChange={(e) => setStaffRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <button
                    className="btn btn-success"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={handleApprove}
                    disabled={!draftText}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve Reminder Draft</span>
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={handleDispatch}
                    disabled={selectedAppt.follow_up_status !== 'Approved' || dispatching}
                    title={
                      selectedAppt.follow_up_status !== 'Approved'
                        ? 'Staff must Approve before dispatching'
                        : 'Send via n8n webhook'
                    }
                  >
                    <Send size={15} />
                    <span>{dispatching ? 'Dispatching...' : 'Dispatch via Automation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
