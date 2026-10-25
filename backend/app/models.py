import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(120), nullable=False, index=True)
    patient_phone = Column(String(30), nullable=False)
    patient_email = Column(String(120), nullable=True)
    patient_age = Column(Integer, default=45)
    gender = Column(String(20), default="Unspecified")
    
    appointment_date = Column(String(30), nullable=False, index=True) # YYYY-MM-DD
    appointment_time = Column(String(20), default="10:00 AM")
    department = Column(String(80), nullable=False, index=True)       # Cardiology, Pediatrics, etc.
    doctor_name = Column(String(120), nullable=False)
    appointment_type = Column(String(80), default="Routine Follow-up") # Post-Op, Chronic Care, etc.
    
    status = Column(String(40), default="Scheduled", index=True)       # Scheduled, Completed, Missed, Cancelled
    follow_up_status = Column(String(40), default="Pending Review", index=True) # Pending Review, Approved, Sent, Flagged, Opted Out
    
    clinical_notes = Column(Text, nullable=True)
    discharge_instructions = Column(Text, nullable=True)
    risk_level = Column(String(20), default="Low", index=True)        # Low, Medium, High
    language_preference = Column(String(30), default="English")       # English, Spanish, French, Hindi
    reminder_channel = Column(String(30), default="SMS")              # SMS, WhatsApp, Email, Phone Script
    
    ai_generated_reminder = Column(Text, nullable=True)
    ai_model_used = Column(String(60), nullable=True)                 # gemini-1.5-flash, careflow-simulated
    ai_safety_flag = Column(Boolean, default=False)
    ai_safety_notes = Column(Text, nullable=True)
    
    staff_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(60), nullable=False)                  # reminder_dispatched, webhook_test, simulated_batch
    appointment_id = Column(Integer, nullable=True)
    patient_name = Column(String(120), nullable=True)
    channel = Column(String(30), default="SMS")
    status = Column(String(30), default="Success")                   # Success, Simulated, Failed
    target_endpoint = Column(String(255), nullable=True)
    request_payload = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    latency_ms = Column(Integer, default=120)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PromptLabTest(Base):
    __tablename__ = "prompt_lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(60), nullable=False)                    # Wound Care, Medication Query, Red Flag Emergency, Pediatrics, Language
    difficulty = Column(String(20), default="Standard")              # Standard, High Risk, Boundary Test
    patient_scenario = Column(Text, nullable=False)
    patient_name = Column(String(100), default="Fictional Patient")
    doctor_specialty = Column(String(80), default="General Medicine")
    
    basic_prompt = Column(Text, nullable=False)
    improved_prompt = Column(Text, nullable=False)
    safety_aware_prompt = Column(Text, nullable=False)
    
    expected_safety_behavior = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
