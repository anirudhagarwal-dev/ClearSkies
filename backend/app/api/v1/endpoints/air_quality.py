"""
Air Quality API Endpoints:
- GET /air-quality/current (latest observation + pollutants + provenance)
- GET /air-quality/verdict (audience-specific verdict + explanation + rule cited)
- GET /air-quality/history (time-series points)
- GET /air-quality/hotspots (stations ranked by AQI descending)
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.db.models import Station, Observation, Location, ExternalDataSource
from app.core.cpcb_engine import Audience, CpcbCategory, evaluate_verdict, compute_aqi_from_pollutants
from app.core.errors import create_problem_response, ProblemException
from app.core.config import settings

router = APIRouter(prefix="/air-quality", tags=["Air Quality"])

def calculate_freshness(observed_at: datetime) -> str:
    """Returns FRESH if observed within FRESHNESS_THRESHOLD_HOURS, else STALE."""
    if not observed_at.tzinfo:
        observed_at = observed_at.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - observed_at
    return "FRESH" if age.total_seconds() <= (settings.FRESHNESS_THRESHOLD_HOURS * 3600) else "STALE"

@router.get("/current")
def get_current_air_quality(
    request: Request,
    locationId: Optional[int] = Query(None, description="Location ID"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    db: Session = Depends(get_db)
):
    if not locationId and (lat is None or lon is None):
        return create_problem_response(
            request=request,
            status_code=400,
            title="Missing Parameters",
            detail="Either 'locationId' or both 'lat' and 'lon' must be provided.",
            code="MISSING_LOCATION_PARAMS"
        )
    
    station = None
    if locationId:
        station = db.query(Station).filter(Station.location_id == locationId, Station.is_active == True).first()
    elif lat is not None and lon is not None:
        # Find closest station
        stations = db.query(Station).filter(Station.is_active == True).all()
        if stations:
            station = min(stations, key=lambda s: ((s.latitude - lat)**2 + (s.longitude - lon)**2))
            
    if not station:
        return create_problem_response(
            request=request,
            status_code=404,
            title="Station Not Found",
            detail="No active monitoring station found for the given location criteria.",
            code="STATION_NOT_FOUND"
        )
        
    latest_obs = (
        db.query(Observation)
        .filter(Observation.station_id == station.id)
        .order_by(desc(Observation.observed_at))
        .first()
    )
    
    if not latest_obs:
        return create_problem_response(
            request=request,
            status_code=404,
            title="No Observations Available",
            detail=f"No observations recorded yet for station {station.name}.",
            code="OBSERVATION_NOT_FOUND"
        )
        
    source = db.query(ExternalDataSource).filter(ExternalDataSource.id == station.source_id).first()
    
    pollutants_dict = {
        m.pollutant: {"value": m.value, "unit": m.unit}
        for m in latest_obs.measurements
    }
    
    return {
        "stationId": station.id,
        "stationName": station.name,
        "city": station.city,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "aqiValue": latest_obs.aqi_value,
        "aqiScale": latest_obs.aqi_scale,
        "aqiCategory": latest_obs.aqi_category,
        "dominantPollutant": latest_obs.dominant_pollutant,
        "dataKind": latest_obs.data_kind,
        "freshness": calculate_freshness(latest_obs.observed_at),
        "observedAt": latest_obs.observed_at.isoformat(),
        "ingestedAt": latest_obs.ingested_at.isoformat(),
        "source": {
            "id": source.code if source else "UNKNOWN",
            "name": source.name if source else "Unknown Source",
            "license": source.license_note if source else "Unknown"
        },
        "pollutants": pollutants_dict
    }

@router.get("/verdict")
def get_air_quality_verdict(
    request: Request,
    locationId: int = Query(..., description="Target Location ID"),
    audience: Audience = Query(Audience.CHILDREN_SCHOOL, description="Target demographic audience"),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.location_id == locationId, Station.is_active == True).first()
    if not station:
        return create_problem_response(
            request=request,
            status_code=404,
            title="Location Not Found",
            detail=f"No active station registered for locationId {locationId}.",
            code="LOCATION_NOT_FOUND"
        )
        
    latest_obs = (
        db.query(Observation)
        .filter(Observation.station_id == station.id)
        .order_by(desc(Observation.observed_at))
        .first()
    )
    if not latest_obs:
        return create_problem_response(
            request=request,
            status_code=404,
            title="Observation Missing",
            detail="Cannot determine verdict because no recent observations exist.",
            code="OBSERVATION_NOT_FOUND"
        )
        
    category = CpcbCategory(latest_obs.aqi_category)
    verdict_info = evaluate_verdict(category, audience)
    source = db.query(ExternalDataSource).filter(ExternalDataSource.id == station.source_id).first()
    
    pollutants_summary = {
        m.pollutant: m.value for m in latest_obs.measurements
    }

    return {
        "locationId": locationId,
        "stationId": station.id,
        "stationName": station.name,
        "aqiValue": latest_obs.aqi_value,
        "aqiScale": latest_obs.aqi_scale,
        "aqiCategory": latest_obs.aqi_category,
        "dominantPollutant": latest_obs.dominant_pollutant,
        "dataKind": latest_obs.data_kind,
        "freshness": calculate_freshness(latest_obs.observed_at),
        "observedAt": latest_obs.observed_at.isoformat(),
        "source": source.name if source else "AirTrack Station",
        "verdict": verdict_info["verdict"],
        "audience": verdict_info["audience"],
        "ruleFired": verdict_info["ruleFired"],
        "officialHealthStatement": verdict_info["officialHealthStatement"],
        "plainLanguageRecommendation": verdict_info["plainLanguageRecommendation"],
        "disclaimer": verdict_info["disclaimer"],
        "pollutantsUsed": pollutants_summary
    }

@router.get("/history")
def get_air_quality_history(
    request: Request,
    stationId: int = Query(..., description="Station ID"),
    interval: str = Query("hourly", pattern="^(hourly|daily)$"),
    limit: int = Query(24, ge=1, le=168, description="Number of historical points"),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == stationId).first()
    if not station:
        return create_problem_response(
            request=request,
            status_code=404,
            title="Station Not Found",
            detail=f"Station ID {stationId} does not exist.",
            code="STATION_NOT_FOUND"
        )
        
    observations = (
        db.query(Observation)
        .filter(Observation.station_id == stationId)
        .order_by(desc(Observation.observed_at))
        .limit(limit)
        .all()
    )
    
    # Return in chronological order
    observations.reverse()
    
    points = []
    for obs in observations:
        pm25 = next((m.value for m in obs.measurements if m.pollutant == "PM2.5"), None)
        pm10 = next((m.value for m in obs.measurements if m.pollutant == "PM10"), None)
        points.append({
            "observedAt": obs.observed_at.isoformat(),
            "aqi": obs.aqi_value,
            "category": obs.aqi_category,
            "dominantPollutant": obs.dominant_pollutant,
            "pm25": pm25,
            "pm10": pm10,
            "dataKind": obs.data_kind
        })
        
    return {
        "stationId": stationId,
        "stationName": station.name,
        "city": station.city,
        "count": len(points),
        "interval": interval,
        "history": points
    }

@router.get("/hotspots")
def get_city_hotspots(
    request: Request,
    city: str = Query("Delhi", min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    stations = db.query(Station).filter(Station.is_active == True).all()
    hotspot_list = []
    
    for station in stations:
        latest = (
            db.query(Observation)
            .filter(Observation.station_id == station.id)
            .order_by(desc(Observation.observed_at))
            .first()
        )
        if latest:
            hotspot_list.append({
                "stationId": station.id,
                "name": station.name,
                "city": station.city,
                "latitude": station.latitude,
                "longitude": station.longitude,
                "aqiValue": latest.aqi_value,
                "aqiCategory": latest.aqi_category,
                "dominantPollutant": latest.dominant_pollutant,
                "dataKind": latest.data_kind,
                "observedAt": latest.observed_at.isoformat(),
                "freshness": calculate_freshness(latest.observed_at)
            })
            
    # Sort descending by AQI
    hotspot_list.sort(key=lambda x: x["aqiValue"], reverse=True)
    return {
        "city": city,
        "totalStations": len(hotspot_list),
        "hotspots": hotspot_list[:limit]
    }
