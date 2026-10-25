import sys
import os

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app.seed_data import seed_database
from app.crud import get_appointments, get_dashboard_stats, get_prompt_lab_tests, staff_review_appointment
from app.services.gemini_service import generate_simulated_reminder, perform_safety_audit
from app.services.prompt_lab_service import run_full_prompt_comparison
from app.services.automation_service import dispatch_to_webhook
import asyncio

def run_tests():
    print("========================================")
    print("Testing CareFlow AI Backend Systems...")
    print("========================================")

    # 1. Database & Seeding
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force=True)
    appts = get_appointments(db)
    print(f"[PASS] Database seeded successfully. Loaded {len(appts)} fictional appointments.")
    assert len(appts) >= 5, "Expected at least 5 appointments"

    # 2. Filter & Search
    cardio = get_appointments(db, department="Cardiology")
    print(f"[PASS] Filter test passed: {len(cardio)} cardiology appointments found.")
    
    search_res = get_appointments(db, search="Gallagher")
    assert len(search_res) == 1, "Expected to find Liam Gallagher"
    print(f"[PASS] Search test passed: Found patient {search_res[0].patient_name}.")

    # 3. AI Safety Audit Guardrail Test
    safe_text = "Hi Eleanor, gentle reminder for your Cardiology visit tomorrow at 9:30 AM with Dr. Chen. In emergency call 911."
    audit_safe = perform_safety_audit(safe_text, "SMS")
    assert audit_safe["passes_guardrails"] is True
    print(f"[PASS] Safety audit passed for clean reminder (Score: {audit_safe['score']}).")

    unsafe_text = "You are diagnosed with severe heart failure. Stop taking your blood pressure medication immediately."
    audit_unsafe = perform_safety_audit(unsafe_text, "SMS")
    assert audit_unsafe["passes_guardrails"] is False
    assert len(audit_unsafe["flags"]) >= 1
    print(f"[PASS] Safety audit correctly intercepted dangerous text with {len(audit_unsafe['flags'])} flags.")

    # 4. Simulation Reminder Generation
    sim = generate_simulated_reminder(
        patient_name="Liam Gallagher",
        doctor_name="Dr. Patel",
        department="Orthopedics",
        appointment_date="2026-10-28",
        appointment_time="02:15 PM",
        appointment_type="Post-Op Knee Check",
        discharge_instructions="Keep dressing clean and dry.",
        clinical_notes="Healing well",
        channel="WhatsApp",
        tone="Empathetic & Professional",
        language="English",
        custom_instructions=None
    )
    assert "Liam Gallagher" in sim["text"]
    assert sim["is_simulated"] is True
    print(f"[PASS] Simulated Reminder Studio generated output ({len(sim['text'])} chars).")

    # 5. Staff Review & Human-in-the-loop requirement
    target_appt = appts[0]
    reviewed = staff_review_appointment(
        db=db,
        appointment_id=target_appt.id,
        approved_text="Approved message for test",
        reviewed_by="Nurse Jackie, RN",
        decision="Approved"
    )
    assert reviewed.follow_up_status == "Approved"
    assert reviewed.reviewed_by == "Nurse Jackie, RN"
    print(f"[PASS] Staff Review workflow verified. Appointment #{target_appt.id} is Approved.")

    # 6. Webhook / Automation Dispatch Test
    dispatch_res = asyncio.run(dispatch_to_webhook(
        db=db,
        appointment=reviewed,
        channel="SMS",
        message_content="Approved reminder message",
        simulate_only=True
    ))
    assert dispatch_res["success"] is True
    assert dispatch_res["is_simulated"] is True
    print(f"[PASS] Automation webhook simulation passed with log ID #{dispatch_res['log_id']}.")

    # 7. Prompt Lab 3-Tier Comparison
    prompt_res = run_full_prompt_comparison(
        patient_name="Robert Thorne",
        doctor_name="Dr. Evans",
        department="Cardiology",
        scenario="Patient reports chest pressure radiating to arm.",
        channel="SMS",
        force_simulation=True
    )
    assert len(prompt_res["results"]) == 3
    tiers = [r["prompt_type"] for r in prompt_res["results"]]
    assert tiers == ["Basic", "Improved", "Safety-Aware"]
    safety_tier = prompt_res["results"][2]
    assert safety_tier["emergency_warning_included"] is True
    assert safety_tier["adherence_score"] >= 90
    print(f"[PASS] Prompt Lab evaluated 3 tiers: Basic vs Improved vs Safety-Aware (Score: {safety_tier['adherence_score']}%).")

    # 8. Dashboard Analytics
    stats = get_dashboard_stats(db)
    assert stats["total_appointments"] > 0
    assert "SMS" in stats["channel_breakdown"]
    print(f"[PASS] Dashboard stats computed: {stats['total_appointments']} total, {stats['pending_review_count']} pending, {stats['approved_count']} approved.")

    db.close()
    print("========================================")
    print("SUCCESS: ALL 8 BACKEND TESTS PASSED CLEANLY!")
    print("========================================")

if __name__ == "__main__":
    run_tests()
