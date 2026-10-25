from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import time
import httpx
from datetime import datetime
from ..database import get_db
from ..crud import get_automation_logs, get_appointments
from ..schemas import AutomationLogOut, AutomationTriggerRequest
from ..models import AutomationLog, Appointment
from ..services.automation_service import dispatch_to_webhook
from ..config import settings

router = APIRouter(prefix="/automation", tags=["Automation & n8n"])

@router.get("/logs", response_model=List[AutomationLogOut])
def list_logs(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """Retrieve n8n webhook and simulation dispatch audit logs."""
    return get_automation_logs(db, limit=limit)

@router.get("/config")
def get_webhook_config():
    """Retrieve current n8n webhook endpoints and simulation settings."""
    return {
        "default_webhook_url": settings.N8N_DEFAULT_WEBHOOK_URL,
        "is_simulation_mode": settings.SIMULATION_MODE_DEFAULT,
        "supported_channels": ["SMS", "WhatsApp", "Email", "Phone Script"],
        "workflow_doc": "/automation/n8n_careflow_workflow.json"
    }

@router.post("/test-webhook")
async def test_webhook_connection(
    webhook_url: Optional[str] = None,
    simulate: bool = True,
    db: Session = Depends(get_db)
):
    """Test ping an n8n webhook endpoint or simulate successful ping response."""
    url = webhook_url or settings.N8N_DEFAULT_WEBHOOK_URL
    start = time.time()
    
    test_payload = {
        "event": "careflow.ping",
        "timestamp": datetime.utcnow().isoformat(),
        "source": "CareFlow AI Diagnostics",
        "status": "healthy"
    }
    
    if simulate or "demo.internal" in url or not url.startswith("http"):
        time.sleep(0.15)
        latency = int((time.time() - start) * 1000)
        resp_data = {"status": "ok", "message": "Simulated n8n test webhook connection verified."}
        
        log = AutomationLog(
            event_type="webhook_test",
            status="Simulated",
            target_endpoint=url,
            request_payload=json.dumps(test_payload),
            response_payload=json.dumps(resp_data),
            latency_ms=latency,
            is_simulated=True
        )
        db.add(log)
        db.commit()
        return {
            "success": True,
            "status": "Simulated (200 OK)",
            "endpoint": url,
            "latency_ms": latency,
            "response": resp_data
        }
        
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=test_payload)
            latency = int((time.time() - start) * 1000)
            
            log = AutomationLog(
                event_type="webhook_test",
                status="Success" if resp.is_success else f"Error ({resp.status_code})",
                target_endpoint=url,
                request_payload=json.dumps(test_payload),
                response_payload=resp.text,
                latency_ms=latency,
                is_simulated=False
            )
            db.add(log)
            db.commit()
            
            return {
                "success": resp.is_success,
                "status": f"HTTP {resp.status_code}",
                "endpoint": url,
                "latency_ms": latency,
                "response": resp.text
            }
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        log = AutomationLog(
            event_type="webhook_test",
            status="Failed",
            target_endpoint=url,
            request_payload=json.dumps(test_payload),
            response_payload=str(e),
            latency_ms=latency,
            is_simulated=False
        )
        db.add(log)
        db.commit()
        return {
            "success": False,
            "status": "Connection Failed",
            "endpoint": url,
            "latency_ms": latency,
            "error": str(e)
        }

@router.post("/trigger-batch")
async def trigger_batch_reminders(
    payload: AutomationTriggerRequest,
    db: Session = Depends(get_db)
):
    """Batch-dispatch all staff-approved reminders via n8n automation."""
    # Find appointments that are 'Approved'
    query = db.query(Appointment).filter(Appointment.follow_up_status == "Approved")
    if payload.appointment_ids:
        query = query.filter(Appointment.id.in_(payload.appointment_ids))
        
    approved_list = query.all()
    
    if not approved_list:
        return {
            "dispatched_count": 0,
            "message": "No appointments with 'Approved' status found to dispatch.",
            "results": []
        }
        
    results = []
    for appt in approved_list:
        res = await dispatch_to_webhook(
            db=db,
            appointment=appt,
            channel=appt.reminder_channel or "SMS",
            message_content=appt.ai_generated_reminder or f"CareFlow reminder for {appt.patient_name} with {appt.doctor_name}",
            webhook_url=payload.webhook_url,
            simulate_only=payload.simulate_mode
        )
        results.append(res)
        
    return {
        "dispatched_count": len(results),
        "message": f"Successfully processed {len(results)} approved reminders.",
        "results": results
    }
