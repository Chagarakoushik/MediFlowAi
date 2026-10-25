import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import type { AutomationLog } from '../../types';
import {
  Workflow,
  Send,
  Download,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  X
} from 'lucide-react';

export const AutomationView: React.FC = () => {
  const { stats, showToast, refreshStats } = useApp();

  const [webhookUrl, setWebhookUrl] = useState<string>('https://n8n.mediflowai-demo.internal/webhook/healthcare-followup');
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [testingPing, setTestingPing] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<any>(null);

  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);

  // Payload Inspection Modal
  const [inspectLog, setInspectLog] = useState<AutomationLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await api.getAutomationLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleTestPing = async () => {
    try {
      setTestingPing(true);
      const res = await api.testWebhook(webhookUrl, simulationMode);
      setPingResult(res);
      showToast(
        res.success
          ? `Webhook ping test succeeded! (${res.latency_ms}ms)`
          : `Ping failed: ${res.status}`,
        res.success ? 'success' : 'error'
      );
      loadLogs();
    } catch (err: any) {
      showToast('Ping failed: ' + err.message, 'error');
    } finally {
      setTestingPing(false);
    }
  };

  const handleBatchTrigger = async () => {
    try {
      setBatchRunning(true);
      const res = await api.triggerBatchAutomation({
        webhook_url: webhookUrl,
        simulate_mode: simulationMode,
      });

      showToast(res.message, 'success');
      loadLogs();
      refreshStats();
    } catch (err: any) {
      showToast('Batch trigger failed: ' + err.message, 'error');
    } finally {
      setBatchRunning(false);
    }
  };

  const handleDownloadWorkflow = () => {
    const workflowObj = {
      name: "MediFlowAi — Healthcare Follow-up Dispatch Workflow",
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path: "healthcare-followup",
            responseMode: "onReceived",
            responseData: "allEntries"
          },
          name: "MediFlowAi Webhook Trigger",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [250, 300]
        },
        {
          parameters: {
            conditions: {
              string: [
                {
                  value1: "={{$json[\"reminder\"][\"reviewed_by\"]}}",
                  operation: "isNotEmpty"
                }
              ]
            }
          },
          name: "Verify Staff Review Sign-off",
          type: "n8n-nodes-base.if",
          typeVersion: 1,
          position: [500, 300]
        },
        {
          parameters: {
            dataType: "string",
            value1: "={{$json[\"reminder\"][\"channel\"]}}",
            rules: {
              rules: [
                { value2: "SMS", output: 0 },
                { value2: "WhatsApp", output: 1 },
                { value2: "Email", output: 2 }
              ]
            }
          },
          name: "Channel Router",
          type: "n8n-nodes-base.switch",
          typeVersion: 1,
          position: [750, 300]
        },
        {
          parameters: {
            message: "={{$json[\"reminder\"][\"message\"]}}",
            to: "={{$json[\"patient\"][\"phone\"]}}"
          },
          name: "Twilio SMS Dispatcher",
          type: "n8n-nodes-base.twilio",
          typeVersion: 1,
          position: [1000, 200]
        },
        {
          parameters: {
            fromEmail: "mediflowai@mediflow-clinic.org",
            toEmail: "={{$json[\"patient\"][\"email\"]}}",
            subject: "={{$json[\"reminder\"][\"subject\"]}}",
            text: "={{$json[\"reminder\"][\"message\"]}}"
          },
          name: "SendGrid Email Dispatcher",
          type: "n8n-nodes-base.sendGrid",
          typeVersion: 1,
          position: [1000, 400]
        }
      ],
      connections: {
        "MediFlowAi Webhook Trigger": {
          main: [[{ node: "Verify Staff Review Sign-off", type: "main", index: 0 }]]
        },
        "Verify Staff Review Sign-off": {
          main: [[{ node: "Channel Router", type: "main", index: 0 }]]
        },
        "Channel Router": {
          main: [
            [{ node: "Twilio SMS Dispatcher", type: "main", index: 0 }],
            [{ node: "Twilio SMS Dispatcher", type: "main", index: 0 }],
            [{ node: "SendGrid Email Dispatcher", type: "main", index: 0 }]
          ]
        }
      }
    };

    const blob = new Blob([JSON.stringify(workflowObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'n8n_mediflowai_workflow.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('n8n Workflow JSON downloaded successfully!', 'success');
  };

  return (
    <div>
      {/* Top Configuration & Dispatch Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Webhook Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Workflow size={18} style={{ color: '#2563eb' }} />
              <span>n8n Webhook Outbound Configuration</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>HTTP POST REST Protocol</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">n8n Webhook Target URL</label>
              <input
                type="text"
                className="form-control"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.your-domain.com/webhook/healthcare-followup"
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Simulation & Mock Queue Mode</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Simulates full webhook latency and logs without needing an active live n8n instance.
                </div>
              </div>
              <input
                type="checkbox"
                checked={simulationMode}
                onChange={(e) => setSimulationMode(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handleTestPing}
                disabled={testingPing}
              >
                <Activity size={14} />
                <span>{testingPing ? 'Pinging Webhook...' : 'Test Webhook Ping'}</span>
              </button>
            </div>

            {pingResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: pingResult.success ? '#ecfdf5' : '#fff1f2',
                  border: `1px solid ${pingResult.success ? '#a7f3d0' : '#fecdd3'}`,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {pingResult.success ? (
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                ) : (
                  <XCircle size={16} style={{ color: '#e11d48' }} />
                )}
                <span>
                  Status: <strong>{pingResult.status}</strong> &bull; Latency: <strong>{pingResult.latency_ms}ms</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Batch Dispatch & Workflow Download */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} style={{ color: '#059669' }} />
              <span>Batch Automation Pipeline</span>
            </div>
            <span
              className="badge badge-approved"
              style={{ fontSize: '0.7rem' }}
            >
              {stats?.approved_count ?? 0} In Queue
            </span>
          </div>
          <div className="card-body">
            <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.5', marginBottom: '16px' }}>
              Batch dispatch scans all appointments marked <strong>Approved</strong> by clinical staff and triggers the n8n webhook pipeline in sequence.
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '14px', padding: '11px' }}
              onClick={handleBatchTrigger}
              disabled={batchRunning || (stats?.approved_count ?? 0) === 0}
            >
              <Send size={15} />
              <span>
                {batchRunning
                  ? 'Dispatching Outbound Queue...'
                  : `Dispatch All ${stats?.approved_count ?? 0} Approved Reminders`}
              </span>
            </button>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Importable n8n Template
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={handleDownloadWorkflow}
              >
                <Download size={14} />
                <span>Download n8n Workflow JSON (.json)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Audit Logs Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} style={{ color: '#64748b' }} />
            <span>Outbound Webhook Execution & Delivery Audit Log</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadLogs}>
            <RefreshCw size={13} className={loadingLogs ? 'spin-icon' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loadingLogs ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              Loading execution logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              No automation events dispatched yet.
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Event Type</th>
                    <th>Patient Target</th>
                    <th>Channel</th>
                    <th>Target Endpoint</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Timestamp</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                        #{log.id}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{log.event_type}</strong>
                      </td>
                      <td>{log.patient_name || 'System Ping'}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{log.channel}</span>
                      </td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#64748b' }}>
                        {log.target_endpoint}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.status === 'Success'
                              ? 'badge-sent'
                              : log.status === 'Simulated'
                              ? 'mode-demo'
                              : 'badge-flagged'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>{log.latency_ms} ms</td>
                      <td style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => setInspectLog(log)}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
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

      {/* Payload Inspection Modal */}
      {inspectLog && (
        <div className="modal-overlay" onClick={() => setInspectLog(null)}>
          <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">
                <Layers size={18} style={{ color: '#2563eb' }} />
                <span>Execution Payload Inspector — Log #{inspectLog.id}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setInspectLog(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Outbound Request JSON Payload (Sent to n8n Webhook):
                </div>
                <pre className="code-viewer">
                  {inspectLog.request_payload || 'No request payload recorded.'}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Response Body Received:
                </div>
                <pre className="code-viewer">
                  {inspectLog.response_payload || 'No response payload recorded.'}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInspectLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
