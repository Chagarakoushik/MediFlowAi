from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..crud import get_prompt_lab_tests
from ..schemas import PromptRunComparisonRequest, PromptComparisonResult
from ..services.prompt_lab_service import run_full_prompt_comparison
from ..models import PromptLabTest

router = APIRouter(prefix="/prompt-lab", tags=["Prompt Lab"])

@router.get("/tests")
def list_test_cases(db: Session = Depends(get_db)):
    """Retrieve benchmark test cases for prompt comparisons."""
    tests = get_prompt_lab_tests(db)
    return [
        {
            "id": t.id,
            "title": t.title,
            "category": t.category,
            "difficulty": t.difficulty,
            "patient_scenario": t.patient_scenario,
            "patient_name": t.patient_name,
            "doctor_specialty": t.doctor_specialty,
            "expected_safety_behavior": t.expected_safety_behavior
        }
        for t in tests
    ]

@router.post("/compare", response_model=PromptComparisonResult)
def run_comparison(payload: PromptRunComparisonRequest, db: Session = Depends(get_db)):
    """Run head-to-head comparison between Basic, Improved, and Safety-Aware prompts."""
    scenario_title = "Custom Clinical Scenario"
    scenario = payload.custom_scenario or "Patient recovering from outpatient procedure."
    patient_name = payload.patient_name or "Eleanor Vance"
    doctor_name = "Dr. Marcus Chen"
    department = payload.doctor_specialty or "Cardiology"
    
    if payload.test_case_id:
        test_obj = db.query(PromptLabTest).filter(PromptLabTest.id == payload.test_case_id).first()
        if test_obj:
            scenario_title = test_obj.title
            scenario = test_obj.patient_scenario
            patient_name = test_obj.patient_name
            doctor_name = f"Dr. Assigned ({test_obj.doctor_specialty})"
            department = test_obj.doctor_specialty
            
    comparison = run_full_prompt_comparison(
        patient_name=patient_name,
        doctor_name=doctor_name,
        department=department,
        scenario=scenario,
        channel=payload.channel or "SMS",
        force_simulation=payload.force_simulation
    )
    
    return PromptComparisonResult(
        scenario_title=scenario_title,
        patient_scenario=scenario,
        test_id=payload.test_case_id,
        results=comparison["results"],
        key_findings=comparison["key_findings"]
    )
