from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..crud import get_appointment, staff_review_appointment
from ..schemas import (
    ReminderGenerateRequest, ReminderGenerateResponse,
    StaffReviewRequest, StaffReviewResponse,
    ReminderDispatchPayload, ReminderDispatchResponse
)
from ..services.gemini_service import generate_gemini_reminder, generate_simulated_reminder
from ..services.automation_service import dispatch_to_webhook
from ..config import settings

router = APIRouter(prefix="/reminders", tags=["AI Reminders"])

@router.post("/generate", response_model=ReminderGenerateResponse)
def generate_reminder(payload: ReminderGenerateRequest, db: Session = Depends(get_db)):
    """Generate personalized appointment follow-up reminder using Gemini API or Simulated Engine."""
    appt = get_appointment(db, payload.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    use_simulation = payload.force_simulation or not settings.has_gemini_key
    
    if use_simulation:
        gen_result = generate_simulated_reminder(
            patient_name=appt.patient_name,
            doctor_name=appt.doctor_name,
            department=appt.department,
            appointment_date=appt.appointment_date,
            appointment_time=appt.appointment_time,
            appointment_type=appt.appointment_type,
            discharge_instructions=appt.discharge_instructions,
            clinical_notes=appt.clinical_notes,
            channel=payload.channel,
            tone=payload.tone,
            language=payload.language,
            custom_instructions=payload.custom_instructions
        )
    else:
        gen_result = generate_gemini_reminder(
            patient_name=appt.patient_name,
            doctor_name=appt.doctor_name,
            department=appt.department,
            appointment_date=appt.appointment_date,
            appointment_time=appt.appointment_time,
            appointment_type=appt.appointment_type,
            discharge_instructions=appt.discharge_instructions,
            clinical_notes=appt.clinical_notes,
            channel=payload.channel,
            tone=payload.tone,
            language=payload.language,
            custom_instructions=payload.custom_instructions
        )
        
    # Store draft in appointment record
    appt.ai_generated_reminder = gen_result["text"]
    appt.ai_model_used = gen_result["model"]
    appt.reminder_channel = payload.channel
    appt.language_preference = payload.language
    appt.ai_safety_flag = not gen_result["safety_audit"]["passes_guardrails"]
    if gen_result["safety_audit"]["flags"]:
        appt.ai_safety_notes = "; ".join(gen_result["safety_audit"]["flags"])
        
    db.commit()
    db.refresh(appt)
    
    char_count = len(gen_result["text"])
    reading_time = max(1, round(char_count / 25))
    
    return ReminderGenerateResponse(
        appointment_id=appt.id,
        patient_name=appt.patient_name,
        channel=payload.channel,
        tone=payload.tone,
        language=payload.language,
        reminder_text=gen_result["text"],
        subject_line=gen_result.get("subject"),
        character_count=char_count,
        estimated_reading_time_sec=reading_time,
        model_name=gen_result["model"],
        is_simulated=gen_result["is_simulated"],
        safety_audit=gen_result["safety_audit"],
        generated_at=datetime.utcnow().isoformat()
    )

@router.post("/review", response_model=StaffReviewResponse)
def submit_staff_review(payload: StaffReviewRequest, db: Session = Depends(get_db)):
    """Clinical staff review requirement before dispatch (Human-in-the-loop validation)."""
    appt = staff_review_appointment(
        db=db,
        appointment_id=payload.appointment_id,
        approved_text=payload.approved_text,
        reviewed_by=payload.reviewed_by,
        decision=payload.decision,
        staff_notes=payload.staff_notes
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    return StaffReviewResponse(
        appointment_id=appt.id,
        follow_up_status=appt.follow_up_status,
        reviewed_by=appt.reviewed_by,
        reviewed_at=appt.reviewed_at.isoformat() if appt.reviewed_at else datetime.utcnow().isoformat(),
        message=f"Reminder review status updated to '{appt.follow_up_status}' by {appt.reviewed_by}."
    )

@router.post("/dispatch", response_model=ReminderDispatchResponse)
async def dispatch_reminder(payload: ReminderDispatchPayload, db: Session = Depends(get_db)):
    """Dispatch reviewed and approved reminder to n8n webhook or simulated dispatcher."""
    appt = get_appointment(db, payload.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if appt.follow_up_status not in ["Approved", "Sent"]:
        raise HTTPException(
            status_code=400,
            detail="Clinical safety violation: Reminders MUST be reviewed and approved by clinical staff before dispatch."
        )
        
    res = await dispatch_to_webhook(
        db=db,
        appointment=appt,
        channel=payload.channel,
        message_content=payload.message_content,
        subject_line=payload.subject_line,
        webhook_url=payload.webhook_url,
        simulate_only=payload.simulate_only
    )
    
    return ReminderDispatchResponse(**res)
