from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import AppointmentOut, AppointmentCreate, AppointmentUpdate
from ..crud import get_appointments, get_appointment, create_appointment, update_appointment, delete_appointment
from ..seed_data import seed_database

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    search: Optional[str] = Query(None, description="Search by patient, doctor, phone or department"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (Scheduled, Completed, Missed, Cancelled)"),
    follow_up_status: Optional[str] = Query(None, description="Filter by follow-up status (Pending Review, Approved, Sent, Flagged)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk (Low, Medium, High)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve list of appointments with multi-parameter search and filtering."""
    return get_appointments(
        db=db,
        search=search,
        department=department,
        status=status,
        follow_up_status=follow_up_status,
        risk_level=risk_level,
        skip=skip,
        limit=limit
    )

@router.get("/{appointment_id}", response_model=AppointmentOut)
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Retrieve specific appointment details."""
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

@router.post("", response_model=AppointmentOut, status_code=201)
def add_appointment(appointment_in: AppointmentCreate, db: Session = Depends(get_db)):
    """Create a new appointment with validation."""
    return create_appointment(db, appointment_in)

@router.put("/{appointment_id}", response_model=AppointmentOut)
def edit_appointment(appointment_id: int, appointment_in: AppointmentUpdate, db: Session = Depends(get_db)):
    """Update existing appointment."""
    appt = get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return update_appointment(db, appt, appointment_in)

@router.delete("/{appointment_id}")
def remove_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Delete an appointment."""
    success = delete_appointment(db, appointment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully", "id": appointment_id}

@router.post("/seed/reset")
def reset_seed_data(db: Session = Depends(get_db)):
    """Resets and re-populates the database with fresh fictional clinical sample data."""
    seed_database(db, force=True)
    return {"message": "Fictional clinical database successfully reset with fresh sample records."}
