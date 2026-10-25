import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { PromptTestCase, PromptComparisonResult } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  FlaskConical,
  Play,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';

export const PromptLabView: React.FC = () => {
  const { showToast } = useApp();

  const [testCases, setTestCases] = useState<PromptTestCase[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | 'custom'>('custom');
  const [customScenario, setCustomScenario] = useState<string>(
    'Patient with a history of hypertension reports morning systolic reading of 195 mmHg with a dull throbbing headache. Follow-up is in 3 days.'
  );
  const [patientName, setPatientName] = useState<string>('Robert Thorne');
  const [specialty, setSpecialty] = useState<string>('Cardiology');
  const [channel, setChannel] = useState<string>('SMS');
  const [forceSim, setForceSim] = useState<boolean>(false);

  const [running, setRunning] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<PromptComparisonResult | null>(null);

  useEffect(() => {
    async function loadTests() {
      try {
        const tests = await api.getPromptLabTests();
        setTestCases(tests);
        if (tests.length > 0) {
          setSelectedTestId(tests[0].id);
          // auto run first benchmark comparison
          runBenchmark(tests[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTests();
  }, []);

  const runBenchmark = async (testId?: number | 'custom') => {
    try {
      setRunning(true);
      const targetId = testId ?? selectedTestId;
      const isCustom = targetId === 'custom';

      const res = await api.runPromptComparison({
        test_case_id: isCustom ? undefined : (targetId as number),
        custom_scenario: isCustom ? customScenario : undefined,
        patient_name: patientName,
        doctor_specialty: specialty,
        channel,
        force_simulation: forceSim,
      });

      setComparisonResult(res);
      showToast('Prompt comparison completed across all 3 tiers!', 'success');
    } catch (err: any) {
      showToast('Prompt lab evaluation failed: ' + err.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleTestSelect = (id: string) => {
    if (id === 'custom') {
      setSelectedTestId('custom');
    } else {
      const numId = Number(id);
      setSelectedTestId(numId);
      const tc = testCases.find((t) => t.id === numId);
      if (tc) {
        setPatientName(tc.patient_name);
        setSpecialty(tc.doctor_specialty);
      }
      runBenchmark(numId);
    }
  };

  return (
    <div>
      {/* Test Case Selector & Controls Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <FlaskConical size={18} style={{ color: '#4f46e5' }} />
            <span>Healthcare Prompt Engineering Benchmark Lab</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            A/B/C Clinical Safety Evaluation
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Clinical Benchmark Scenario</label>
              <select
                className="form-control"
                value={selectedTestId}
                onChange={(e) => handleTestSelect(e.target.value)}
              >
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    [{tc.category} - {tc.difficulty}] {tc.title}
                  </option>
                ))}
                <option value="custom">Custom Clinical Test Scenario...</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Channel</label>
              <select
                className="form-control"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="SMS">SMS (Character-Constrained)</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={forceSim}
                  onChange={(e) => setForceSim(e.target.checked)}
                />
                <span>Simulation Mode</span>
              </label>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '38px' }}
                onClick={() => runBenchmark()}
                disabled={running}
              >
                <Play size={14} />
                <span>{running ? 'Running 3 Tiers...' : 'Evaluate All 3 Tiers'}</span>
              </button>
            </div>
          </div>

          {selectedTestId === 'custom' && (
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Custom Scenario Clinical Text</label>
              <textarea
                className="form-control"
                rows={2}
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe patient condition, inquiries, or red flag symptoms..."
              />
            </div>
          )}

          {/* Active Scenario Banner */}
          {comparisonResult && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '12px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Active Case: {comparisonResult.scenario_title}
              </div>
              <div style={{ color: '#475569' }}>
                <strong>Scenario:</strong> {comparisonResult.patient_scenario}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3-Column Side-by-Side Comparison */}
      {comparisonResult && (
        <div className="prompt-grid" style={{ marginBottom: '24px' }}>
          {comparisonResult.results.map((result, idx) => {
            const isBasic = result.prompt_type === 'Basic';
            const isImproved = result.prompt_type === 'Improved';
            const isSafety = result.prompt_type === 'Safety-Aware';

            return (
              <div key={idx} className="prompt-col">
                {/* Header */}
                <div
                  className={`prompt-col-header ${
                    isBasic ? 'col-tier-basic' : isImproved ? 'col-tier-improved' : 'col-tier-safety'
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isBasic && <AlertTriangle size={17} />}
                    {isImproved && <Activity size={17} />}
                    {isSafety && <ShieldCheck size={17} />}
                    <span>{result.prompt_type} Prompt</span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: '#ffffff',
                      color: isBasic ? '#9f1239' : isImproved ? '#1e40af' : '#065f46',
                      fontWeight: 700,
                    }}
                  >
                    Score: {result.adherence_score}%
                  </span>
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Performance metrics pill bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                    <span>Latency: <strong>{result.latency_ms} ms</strong></span>
                    <span>Length: <strong>{result.character_count} chars</strong></span>
                    <span style={{ color: result.is_simulated ? '#d97706' : '#059669', fontWeight: 600 }}>
                      {result.is_simulated ? 'Simulated' : 'Gemini 1.5'}
                    </span>
                  </div>

                  {/* System Instruction / Prompt Snippet */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Prompt Strategy
                    </div>
                    <div
                      style={{
                        background: '#f1f5f9',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        color: '#334155',
                        lineHeight: '1.4',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {result.system_prompt}
                    </div>
                  </div>

                  {/* Generated Patient Message */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Generated Output
                    </div>
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        background: isBasic ? '#fff5f5' : isImproved ? '#f8fafc' : '#f0fdf4',
                        fontSize: '0.82rem',
                        lineHeight: '1.5',
                        color: '#0f172a',
                        minHeight: '130px',
                      }}
                    >
                      {result.generated_text}
                    </div>
                  </div>

                  {/* Safety & Compliance Checklist */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Clinical Safety Verification
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {result.medical_advice_detected ? (
                          <XCircle size={14} style={{ color: '#e11d48' }} />
                        ) : (
                          <CheckCircle2 size={14} style={{ color: '#059669' }} />
                        )}
                        <span>
                          {result.medical_advice_detected
                            ? 'VIOLATION: Unvetted Medical Advice / Dosage given'
                            : 'PASSED: Non-diagnostic boundary respected'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {result.emergency_warning_included ? (
                          <CheckCircle2 size={14} style={{ color: '#059669' }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#e11d48' }} />
                        )}
                        <span>
                          {result.emergency_warning_included
                            ? 'PASSED: Emergency 911 / triage redirection active'
                            : 'RISK: No emergency escalation instructions'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                        <Clock size={14} />
                        <span>Tone: <strong>{result.tone_rating}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Findings Card */}
      {comparisonResult && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} style={{ color: '#2563eb' }} />
              <span>Prompt Engineering Insights & Clinical Takeaways</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {comparisonResult.key_findings.map((finding, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                  }}
                >
                  <strong style={{ color: idx === 0 ? '#e11d48' : idx === 1 ? '#0284c7' : '#059669' }}>
                    Insight {idx + 1}:
                  </strong>{' '}
                  <span style={{ color: '#334155' }}>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
