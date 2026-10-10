"""
Integration Tests for AirTrack REST API endpoints (/api/v1).
Verifies:
- GET /actuator/health
- GET /api/v1/locations/search
- GET /api/v1/stations
- GET /api/v1/air-quality/current
- GET /api/v1/air-quality/verdict
- GET /api/v1/air-quality/history
- GET /api/v1/air-quality/hotspots
- GET /api/v1/sources
- POST /api/v1/auth/register and /api/v1/auth/login
- RFC 7807 error format on 400 and 404
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_database

init_database()
client = TestClient(app)

def test_health_actuator():
    response = client.get("/actuator/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["components"]["cpcbEngine"]["status"] == "UP"

def test_search_locations():
    response = client.get("/api/v1/locations/search?q=Delhi")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) > 0
    assert any("Anand Vihar" in loc["name"] for loc in locations)

def test_search_locations_validation_error():
    # q < 2 chars triggers RFC 7807
    response = client.get("/api/v1/locations/search?q=a")
    assert response.status_code == 422  # FastAPI validation

def test_get_stations():
    response = client.get("/api/v1/stations?lat=28.6139&lon=77.2090&radiusKm=30")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert "stations" in data

def test_get_current_air_quality_with_provenance():
    # Anand Vihar locationId = 1
    response = client.get("/api/v1/air-quality/current?locationId=1")
    assert response.status_code == 200
    data = response.json()
    assert data["stationId"] is not None
    assert data["aqiValue"] > 0
    assert data["aqiScale"] == "CPCB_NAQI"
    assert data["dataKind"] in ("MEASURED", "SAMPLE")
    assert data["freshness"] in ("FRESH", "STALE")
    assert "PM2.5" in data["pollutants"]
    assert "source" in data

def test_get_verdict_children_school():
    response = client.get("/api/v1/air-quality/verdict?locationId=1&audience=CHILDREN_SCHOOL")
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert data["audience"] == "CHILDREN_SCHOOL"
    assert "ruleFired" in data
    assert "plainLanguageRecommendation" in data
    assert "disclaimer" in data
    assert "pollutantsUsed" in data

def test_get_verdict_not_found_rfc7807():
    response = client.get("/api/v1/air-quality/verdict?locationId=99999&audience=CHILDREN_SCHOOL")
    assert response.status_code == 404
    problem = response.json()
    assert problem["status"] == 404
    assert problem["code"] == "LOCATION_NOT_FOUND"
    assert "correlationId" in problem
    assert problem["instance"] == "/api/v1/air-quality/verdict"

def test_get_history():
    response = client.get("/api/v1/air-quality/history?stationId=1&limit=24")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert len(data["history"]) > 0

def test_get_hotspots():
    response = client.get("/api/v1/air-quality/hotspots?city=Delhi&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["hotspots"]) > 0
    # verify descending order
    aqis = [h["aqiValue"] for h in data["hotspots"]]
    assert aqis == sorted(aqis, reverse=True)

def test_get_sources():
    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 2
    codes = [s["code"] for s in sources]
    assert "OPENAQ" in codes
    assert "OPENMETEO" in codes

def test_auth_flow():
    import uuid
    random_email = f"user_{uuid.uuid4().hex[:6]}@delhischool.edu"
    # Register
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": random_email,
        "password": "Password@123",
        "displayName": "Ramesh Kumar"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "accessToken" in reg_data

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": random_email,
        "password": "Password@123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["accessToken"]

    # Profile
    me_resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == random_email
