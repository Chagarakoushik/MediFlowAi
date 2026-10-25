from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import get_dashboard_stats
from ..schemas import DashboardStats

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/dashboard", response_model=DashboardStats)
def fetch_dashboard_statistics(db: Session = Depends(get_db)):
    """Retrieve summarized dashboard metrics, risk counts, channel breakdown, and trend data."""
    return get_dashboard_stats(db)
