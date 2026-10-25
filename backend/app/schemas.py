from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Appointment Schemas ---

class AppointmentBase(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=120)
    patient_phone: str = Field(..., min_length=7, max_length=30)
    patient_email: Optional[str] = None
    patient_age: int = Field(default=45, ge=0, le=120)
    gender: str = Field(default="Unspecified")
    
    appointment_date: str = Field(..., description="YYYY-MM-DD")
    appointment_time: str = Field(default="10:00 AM")
    department: str = Field(..., min_length=2, max_length=80)
    doctor_name: str = Field(..., min_length=2, max_length=120)
    appointment_type: str = Field(default="Routine Follow-up")
    
    status: str = Field(default="Scheduled") # Scheduled, Completed, Missed, Cancelled
    follow_up_status: str = Field(default="Pending Review") # Pending Review, Approved, Sent, Flagged, Opted Out
    
    clinical_notes: Optional[str] = None
    discharge_instructions: Optional[str] = None
    risk_level: str = Field(default="Low") # Low, Medium, High
    language_preference: str = Field(default="English") # English, Spanish, French, Hindi
    reminder_channel: str = Field(default="SMS") # SMS, WhatsApp, Email, Phone Script

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    patient_age: Optional[int] = None
    gender: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    department: Optional[str] = None
    doctor_name: Optional[str] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    follow_up_status: Optional[str] = None
    clinical_notes: Optional[str] = None
    discharge_instructions: Optional[str] = None
    risk_level: Optional[str] = None
    language_preference: Optional[str] = None
    reminder_channel: Optional[str] = None
    staff_notes: Optional[str] = None

class AppointmentOut(AppointmentBase):
    id: int
    ai_generated_reminder: Optional[str] = None
    ai_model_used: Optional[str] = None
    ai_safety_flag: bool = False
    ai_safety_notes: Optional[str] = None
    staff_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- AI Reminder Studio Schemas ---

class ReminderGenerateRequest(BaseModel):
    appointment_id: int
    channel: str = Field(default="SMS") # SMS, WhatsApp, Email, Phone Script
    tone: str = Field(default="Empathetic & Professional") # Empathetic & Professional, Direct & Urgent, Warm & Reassuring
    language: str = Field(default="English")
    custom_instructions: Optional[str] = None
    force_simulation: bool = False

class ReminderGenerateResponse(BaseModel):
    appointment_id: int
    patient_name: str
    channel: str
    tone: str
    language: str
    reminder_text: str
    subject_line: Optional[str] = None # For email
    character_count: int
    estimated_reading_time_sec: int
    model_name: str
    is_simulated: bool
    safety_audit: Dict[str, Any]
    generated_at: str

class StaffReviewRequest(BaseModel):
    appointment_id: int
    approved_text: str
    reviewed_by: str = Field(..., min_length=2)
    staff_notes: Optional[str] = None
    decision: str = Field(default="Approved") # Approved, Flagged, Needs Correction

class StaffReviewResponse(BaseModel):
    appointment_id: int
    follow_up_status: str
    reviewed_by: str
    reviewed_at: str
    message: str

class ReminderDispatchPayload(BaseModel):
    appointment_id: int
    channel: str = Field(default="SMS")
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    message_content: str
    subject_line: Optional[str] = None
    webhook_url: Optional[str] = None
    simulate_only: bool = True

class ReminderDispatchResponse(BaseModel):
    success: bool
    log_id: int
    appointment_id: int
    channel: str
    status: str
    is_simulated: bool
    target_endpoint: str
    latency_ms: int
    message: str

# --- Prompt Lab Schemas ---

class PromptRunComparisonRequest(BaseModel):
    test_case_id: Optional[int] = None
    custom_scenario: Optional[str] = None
    patient_name: Optional[str] = "Eleanor Vance"
    doctor_specialty: Optional[str] = "Cardiology"
    channel: Optional[str] = "SMS"
    force_simulation: bool = False

class PromptMetric(BaseModel):
    prompt_type: str # "Basic", "Improved", "Safety-Aware"
    system_prompt: str
    generated_text: str
    character_count: int
    latency_ms: int
    adherence_score: int # 0-100
    medical_advice_detected: bool
    emergency_warning_included: bool
    tone_rating: str
    model_used: str
    is_simulated: bool

class PromptComparisonResult(BaseModel):
    scenario_title: str
    patient_scenario: str
    test_id: Optional[int] = None
    results: List[PromptMetric]
    key_findings: List[str]

# --- Automation Schemas ---

class AutomationWebhookConfig(BaseModel):
    webhook_url: str
    auth_token: Optional[str] = None
    simulation_mode: bool = True

class AutomationTriggerRequest(BaseModel):
    webhook_url: Optional[str] = None
    appointment_ids: Optional[List[int]] = None
    simulate_mode: bool = True

class AutomationLogOut(BaseModel):
    id: int
    event_type: str
    appointment_id: Optional[int] = None
    patient_name: Optional[str] = None
    channel: str
    status: str
    target_endpoint: Optional[str] = None
    request_payload: Optional[str] = None
    response_payload: Optional[str] = None
    latency_ms: int
    is_simulated: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Stats Schemas ---

class DashboardStats(BaseModel):
    total_appointments: int
    pending_review_count: int
    approved_count: int
    sent_count: int
    flagged_count: int
    risk_high_count: int
    risk_medium_count: int
    risk_low_count: int
    no_show_risk_rate: float
    channel_breakdown: Dict[str, int]
    department_breakdown: Dict[str, int]
    daily_trend: List[Dict[str, Any]]
    ai_status: Dict[str, Any]
