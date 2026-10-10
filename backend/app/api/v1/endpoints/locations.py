"""
Location and Station Endpoints:
- GET /locations/search?q= : Search supported locations
- GET /stations?lat&lon&radiusKm : Nearby monitoring stations
"""
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Location, Station, ExternalDataSource
from app.core.errors import create_problem_response

router = APIRouter(tags=["Locations & Stations"])

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("/locations/search")
def search_locations(
    request: Request,
    q: str = Query(..., min_length=2, max_length=100, description="Search term (e.g. Anand Vihar, Delhi)"),
    db: Session = Depends(get_db)
):
    query_pattern = f"%{q.strip()}%"
    results = (
        db.query(Location)
        .filter((Location.name.ilike(query_pattern)) | (Location.city.ilike(query_pattern)))
        .limit(20)
        .all()
    )
    
    return [
        {
            "id": loc.id,
            "name": loc.name,
            "city": loc.city,
            "state": loc.state,
            "country": loc.country,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
        }
        for loc in results
    ]

@router.get("/stations")
def get_nearby_stations(
    request: Request,
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radiusKm: float = Query(25.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db)
):
    all_stations = db.query(Station).filter(Station.is_active == True).all()
    nearby = []
    
    for s in all_stations:
        dist = haversine_km(lat, lon, s.latitude, s.longitude)
        if dist <= radiusKm:
            source = db.query(ExternalDataSource).filter(ExternalDataSource.id == s.source_id).first()
            nearby.append({
                "id": s.id,
                "name": s.name,
                "city": s.city,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "distanceKm": round(dist, 2),
                "source": source.code if source else "UNKNOWN",
                "lastSeenAt": s.last_seen_at.isoformat() if s.last_seen_at else None
            })
            
    nearby.sort(key=lambda x: x["distanceKm"])
    return {
        "center": {"latitude": lat, "longitude": lon},
        "radiusKm": radiusKm,
        "count": len(nearby),
        "stations": nearby
    }
