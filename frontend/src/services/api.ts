import type {
  Appointment,
  AppointmentCreateInput,
  DashboardStats,
  ReminderGenerateResponse,
  StaffReviewPayload,
  PromptTestCase,
  PromptComparisonResult,
  AutomationLog
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Appointments
  async getAppointments(filters?: {
    search?: string;
    department?: string;
    status?: string;
    follow_up_status?: string;
    risk_level?: string;
  }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department && filters.department !== 'All') params.append('department', filters.department);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.follow_up_status && filters.follow_up_status !== 'All') params.append('follow_up_status', filters.follow_up_status);
    if (filters?.risk_level && filters.risk_level !== 'All') params.append('risk_level', filters.risk_level);
    
    const qs = params.toString();
    return fetchJson<Appointment[]>(`${API_BASE}/appointments${qs ? `?${qs}` : ''}`);
  },

  async getAppointment(id: number): Promise<Appointment> {
    return fetchJson<Appointment>(`${API_BASE}/appointments/${id}`);
  },

  async createAppointment(data: AppointmentCreateInput): Promise<Appointment> {
    return fetchJson<Appointment>(`${API_BASE}/appointments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
    return fetchJson<Appointment>(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAppointment(id: number): Promise<{ message: string; id: number }> {
    return fetchJson<{ message: string; id: number }>(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  async resetSeedData(): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/appointments/seed/reset`, {
      method: 'POST',
    });
  },

  // Reminder Studio
  async generateReminder(payload: {
    appointment_id: number;
    channel: string;
    tone: string;
    language: string;
    custom_instructions?: string;
    force_simulation?: boolean;
  }): Promise<ReminderGenerateResponse> {
    return fetchJson<ReminderGenerateResponse>(`${API_BASE}/reminders/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async reviewReminder(payload: StaffReviewPayload): Promise<{
    appointment_id: number;
    follow_up_status: string;
    reviewed_by: string;
    reviewed_at: string;
    message: string;
  }> {
    return fetchJson(`${API_BASE}/reminders/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async dispatchReminder(payload: {
    appointment_id: number;
    channel: string;
    message_content: string;
    subject_line?: string | null;
    webhook_url?: string;
    simulate_only: boolean;
  }): Promise<any> {
    return fetchJson(`${API_BASE}/reminders/dispatch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Prompt Lab
  async getPromptLabTests(): Promise<PromptTestCase[]> {
    return fetchJson<PromptTestCase[]>(`${API_BASE}/prompt-lab/tests`);
  },

  async runPromptComparison(payload: {
    test_case_id?: number;
    custom_scenario?: string;
    patient_name?: string;
    doctor_specialty?: string;
    channel?: string;
    force_simulation?: boolean;
  }): Promise<PromptComparisonResult> {
    return fetchJson<PromptComparisonResult>(`${API_BASE}/prompt-lab/compare`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Automation & n8n
  async getAutomationLogs(): Promise<AutomationLog[]> {
    return fetchJson<AutomationLog[]>(`${API_BASE}/automation/logs`);
  },

  async getAutomationConfig(): Promise<{
    default_webhook_url: string;
    is_simulation_mode: boolean;
    supported_channels: string[];
    workflow_doc: string;
  }> {
    return fetchJson(`${API_BASE}/automation/config`);
  },

  async testWebhook(webhookUrl?: string, simulate: boolean = true): Promise<any> {
    const params = new URLSearchParams();
    if (webhookUrl) params.append('webhook_url', webhookUrl);
    params.append('simulate', String(simulate));
    return fetchJson(`${API_BASE}/automation/test-webhook?${params.toString()}`, {
      method: 'POST',
    });
  },

  async triggerBatchAutomation(payload: {
    webhook_url?: string;
    appointment_ids?: number[];
    simulate_mode: boolean;
  }): Promise<any> {
    return fetchJson(`${API_BASE}/automation/trigger-batch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>(`${API_BASE}/stats/dashboard`);
  },
};
