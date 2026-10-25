export type ChannelType = 'SMS' | 'WhatsApp' | 'Email' | 'Phone Script';
export type FollowUpStatus = 'Pending Review' | 'Approved' | 'Sent' | 'Flagged' | 'Opted Out';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Missed' | 'Cancelled';

export interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_email?: string | null;
  patient_age: number;
  gender: string;
  appointment_date: string;
  appointment_time: string;
  department: string;
  doctor_name: string;
  appointment_type: string;
  status: AppointmentStatus;
  follow_up_status: FollowUpStatus;
  clinical_notes?: string | null;
  discharge_instructions?: string | null;
  risk_level: RiskLevel;
  language_preference: string;
  reminder_channel: ChannelType;
  ai_generated_reminder?: string | null;
  ai_model_used?: string | null;
  ai_safety_flag?: boolean;
  ai_safety_notes?: string | null;
  staff_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentCreateInput {
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  patient_age: number;
  gender: string;
  appointment_date: string;
  appointment_time: string;
  department: string;
  doctor_name: string;
  appointment_type: string;
  status: AppointmentStatus;
  follow_up_status: FollowUpStatus;
  clinical_notes?: string;
  discharge_instructions?: string;
  risk_level: RiskLevel;
  language_preference: string;
  reminder_channel: ChannelType;
}

export interface SafetyAudit {
  passes_guardrails: boolean;
  score: number;
  flags: string[];
  emergency_redirect_present: boolean;
  diagnosis_attempted: boolean;
  medication_change_attempted: boolean;
  review_required: boolean;
  char_count: number;
  fallback_reason?: string;
}

export interface ReminderGenerateResponse {
  appointment_id: number;
  patient_name: string;
  channel: ChannelType;
  tone: string;
  language: string;
  reminder_text: string;
  subject_line?: string | null;
  character_count: number;
  estimated_reading_time_sec: number;
  model_name: string;
  is_simulated: boolean;
  safety_audit: SafetyAudit;
  generated_at: string;
}

export interface StaffReviewPayload {
  appointment_id: number;
  approved_text: string;
  reviewed_by: string;
  decision: 'Approved' | 'Flagged' | 'Needs Correction';
  staff_notes?: string;
}

export interface PromptMetric {
  prompt_type: 'Basic' | 'Improved' | 'Safety-Aware';
  system_prompt: string;
  generated_text: string;
  character_count: number;
  latency_ms: number;
  adherence_score: number;
  medical_advice_detected: boolean;
  emergency_warning_included: boolean;
  tone_rating: string;
  model_used: string;
  is_simulated: boolean;
}

export interface PromptComparisonResult {
  scenario_title: string;
  patient_scenario: string;
  test_id?: number | null;
  results: PromptMetric[];
  key_findings: string[];
}

export interface PromptTestCase {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  patient_scenario: string;
  patient_name: string;
  doctor_specialty: string;
  expected_safety_behavior: string;
}

export interface AutomationLog {
  id: number;
  event_type: string;
  appointment_id?: number | null;
  patient_name?: string | null;
  channel: string;
  status: string;
  target_endpoint?: string | null;
  request_payload?: string | null;
  response_payload?: string | null;
  latency_ms: number;
  is_simulated: boolean;
  created_at: string;
}

export interface DailyTrendItem {
  date: string;
  day: string;
  appointments: number;
}

export interface DashboardStats {
  total_appointments: number;
  pending_review_count: number;
  approved_count: number;
  sent_count: number;
  flagged_count: number;
  risk_high_count: number;
  risk_medium_count: number;
  risk_low_count: number;
  no_show_risk_rate: number;
  channel_breakdown: Record<string, number>;
  department_breakdown: Record<string, number>;
  daily_trend: DailyTrendItem[];
  ai_status: {
    gemini_api_configured: boolean;
    active_model: string;
    mode: string;
    human_review_enforced: boolean;
  };
}
