"""
User-scoped Endpoints (P1):
- /me/locations (Saved school/home locations)
- /me/alert-rules (Personalized threshold alerts with server-side ownership enforcement)
- /me/notifications (In-app notifications)
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import UserLocation, AlertRule, Notification, Location
from app.core.security import oauth2_scheme, decode_access_token
from app.core.errors import create_problem_response

router = APIRouter(prefix="/me", tags=["User Saved Data & Alerts"])

def get_auth_user_id(request: Request, token: Optional[str]) -> Optional[int]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return int(payload["sub"])

class SaveLocationRequest(BaseModel):
    locationId: int
    label: str
    audience: str = "CHILDREN_SCHOOL"

class AlertRuleRequest(BaseModel):
    locationId: int
    audience: str = "CHILDREN_SCHOOL"
    triggerVerdict: str = "AVOID_OUTDOOR"
    cooldownMinutes: int = 180

# Saved Locations
@router.get("/locations")
def list_saved_locations(request: Request, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
    
    saved = db.query(UserLocation).filter(UserLocation.user_id == uid).all()
    res = []
    for s in saved:
        loc = db.query(Location).filter(Location.id == s.location_id).first()
        res.append({
            "id": s.id,
            "locationId": s.location_id,
            "label": s.label,
            "audience": s.audience,
            "locationName": loc.name if loc else "Unknown",
            "city": loc.city if loc else "Unknown",
            "latitude": loc.latitude if loc else 0,
            "longitude": loc.longitude if loc else 0,
        })
    return res

@router.post("/locations")
def add_saved_location(request: Request, body: SaveLocationRequest, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
    
    loc = db.query(Location).filter(Location.id == body.locationId).first()
    if not loc:
        return create_problem_response(request, 404, "Location Not Found", "Target location does not exist.", "LOCATION_NOT_FOUND")
        
    existing = db.query(UserLocation).filter(UserLocation.user_id == uid, UserLocation.location_id == body.locationId).first()
    if existing:
        return create_problem_response(request, 400, "Already Saved", "Location is already saved in your favorites.", "ALREADY_SAVED")
        
    entry = UserLocation(
        user_id=uid,
        location_id=body.locationId,
        label=body.label,
        audience=body.audience
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Location saved successfully", "id": entry.id}

@router.delete("/locations/{id}")
def delete_saved_location(request: Request, id: int, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
    
    entry = db.query(UserLocation).filter(UserLocation.id == id, UserLocation.user_id == uid).first()
    if not entry:
        return create_problem_response(request, 404, "Not Found", "Saved location not found or not owned by you.", "NOT_FOUND")
    
    db.delete(entry)
    db.commit()
    return {"message": "Location removed successfully"}

# Alert Rules
@router.get("/alert-rules")
def list_alert_rules(request: Request, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
    
    rules = db.query(AlertRule).filter(AlertRule.user_id == uid).all()
    res = []
    for r in rules:
        loc = db.query(Location).filter(Location.id == r.location_id).first()
        res.append({
            "id": r.id,
            "locationId": r.location_id,
            "locationName": loc.name if loc else "Unknown",
            "audience": r.audience,
            "triggerVerdict": r.trigger_verdict,
            "enabled": r.enabled,
            "cooldownMinutes": r.cooldown_minutes,
            "createdAt": r.created_at.isoformat()
        })
    return res

@router.post("/alert-rules")
def create_alert_rule(request: Request, body: AlertRuleRequest, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
        
    rule = AlertRule(
        user_id=uid,
        location_id=body.locationId,
        audience=body.audience,
        trigger_verdict=body.triggerVerdict,
        cooldown_minutes=body.cooldownMinutes,
        enabled=True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"message": "Alert rule configured successfully", "id": rule.id}

@router.delete("/alert-rules/{id}")
def delete_alert_rule(request: Request, id: int, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
        
    rule = db.query(AlertRule).filter(AlertRule.id == id, AlertRule.user_id == uid).first()
    if not rule:
        return create_problem_response(request, 404, "Not Found", "Rule not found or not owned by you.", "NOT_FOUND")
        
    db.delete(rule)
    db.commit()
    return {"message": "Alert rule deleted successfully"}

# Notifications
@router.get("/notifications")
def list_notifications(request: Request, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
        
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == uid)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "message": n.message,
            "createdAt": n.created_at.isoformat(),
            "read": n.read_at is not None
        }
        for n in notifs
    ]

@router.patch("/notifications/{id}/read")
def mark_notification_read(request: Request, id: int, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    uid = get_auth_user_id(request, token)
    if not uid:
        return create_problem_response(request, 401, "Unauthorized", "Valid JWT token required.", "UNAUTHORIZED")
        
    n = db.query(Notification).filter(Notification.id == id, Notification.user_id == uid).first()
    if not n:
        return create_problem_response(request, 404, "Not Found", "Notification not found.", "NOT_FOUND")
        
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notification marked as read"}
