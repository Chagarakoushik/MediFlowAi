import time
import json
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from ..config import settings
from ..models import AutomationLog, Appointment

async def dispatch_to_webhook(
    db: Session,
    appointment: Appointment,
    channel: str,
    message_content: str,
    subject_line: Optional[str] = None,
    webhook_url: Optional[str] = None,
    simulate_only: bool = True
) -> Dict[str, Any]:
    """Dispatches a follow-up reminder payload to an n8n webhook or simulates execution."""
    start_time = time.time()
    url = webhook_url or settings.N8N_DEFAULT_WEBHOOK_URL
    
    payload = {
        "event": "patient.reminder.approved",
        "timestamp": datetime.utcnow().isoformat(),
        "appointment_id": appointment.id,
        "patient": {
            "name": appointment.patient_name,
            "phone": appointment.patient_phone,
            "email": appointment.patient_email,
            "language": appointment.language_preference,
            "risk_level": appointment.risk_level
        },
        "appointment": {
            "date": appointment.appointment_date,
            "time": appointment.appointment_time,
            "department": appointment.department,
            "doctor": appointment.doctor_name,
            "type": appointment.appointment_type
        },
        "reminder": {
            "channel": channel,
            "subject": subject_line,
            "message": message_content,
            "reviewed_by": appointment.reviewed_by or "Staff Reviewer",
            "ai_model": appointment.ai_model_used or "careflow-ai"
        },
        "metadata": {
            "source": "CareFlow AI Automation Engine",
            "workflow_compatible": "n8n-healthcare-followup-v1"
        }
    }
    
    if simulate_only or "demo.internal" in url or not url.startswith("http"):
        # Simulated run
        time.sleep(0.2)
        latency = int((time.time() - start_time) * 1000)
        
        simulated_response = {
            "status": "200_OK_SIMULATED",
            "message": f"Webhook payload received and queued in n8n execution queue for channel {channel}",
            "execution_id": f"sim_exec_{int(time.time()*1000)}",
            "dispatched_to": appointment.patient_phone if channel in ["SMS", "WhatsApp"] else appointment.patient_email,
            "delivery_status": "queued"
        }
        
        log_entry = AutomationLog(
            event_type="reminder_dispatched",
            appointment_id=appointment.id,
            patient_name=appointment.patient_name,
            channel=channel,
            status="Simulated",
            target_endpoint=url,
            request_payload=json.dumps(payload, indent=2),
            response_payload=json.dumps(simulated_response, indent=2),
            latency_ms=latency,
            is_simulated=True
        )
        db.add(log_entry)
        
        # Update appointment status to Sent
        appointment.follow_up_status = "Sent"
        appointment.sent_at = datetime.utcnow()
        db.commit()
        db.refresh(log_entry)
        
        return {
            "success": True,
            "log_id": log_entry.id,
            "appointment_id": appointment.id,
            "channel": channel,
            "status": "Simulated",
            "is_simulated": True,
            "target_endpoint": url,
            "latency_ms": latency,
            "message": "Reminder simulated successfully via n8n mock dispatcher."
        }

    # Real HTTP dispatch
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            latency = int((time.time() - start_time) * 1000)
            
            resp_text = resp.text
            status_str = "Success" if resp.is_success else f"Error ({resp.status_code})"
            
            log_entry = AutomationLog(
                event_type="reminder_dispatched",
                appointment_id=appointment.id,
                patient_name=appointment.patient_name,
                channel=channel,
                status=status_str,
                target_endpoint=url,
                request_payload=json.dumps(payload, indent=2),
                response_payload=resp_text,
                latency_ms=latency,
                is_simulated=False
            )
            db.add(log_entry)
            
            if resp.is_success:
                appointment.follow_up_status = "Sent"
                appointment.sent_at = datetime.utcnow()
                
            db.commit()
            db.refresh(log_entry)
            
            return {
                "success": resp.is_success,
                "log_id": log_entry.id,
                "appointment_id": appointment.id,
                "channel": channel,
                "status": status_str,
                "is_simulated": False,
                "target_endpoint": url,
                "latency_ms": latency,
                "message": f"Webhook returned status code {resp.status_code}."
            }
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        log_entry = AutomationLog(
            event_type="reminder_dispatched",
            appointment_id=appointment.id,
            patient_name=appointment.patient_name,
            channel=channel,
            status="Failed",
            target_endpoint=url,
            request_payload=json.dumps(payload, indent=2),
            response_payload=json.dumps({"error": str(e)}),
            latency_ms=latency,
            is_simulated=False
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return {
            "success": False,
            "log_id": log_entry.id,
            "appointment_id": appointment.id,
            "channel": channel,
            "status": "Failed",
            "is_simulated": False,
            "target_endpoint": url,
            "latency_ms": latency,
            "message": f"Webhook connection failed: {str(e)[:120]}"
        }
