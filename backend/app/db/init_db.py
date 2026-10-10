"""
Database initialization and seed data generation.
Creates schema and seeds representative data for Delhi NCR monitoring stations.
"""
from datetime import datetime, timedelta, timezone
from app.db.session import engine, SessionLocal
from app.db.models import (
    Base, User, Location, UserLocation, ExternalDataSource, Station, Observation,
    PollutantMeasurement, AlertRule, Notification, IngestionRun
)
from app.core.security import get_password_hash
from app.core.cpcb_engine import CpcbCategory, compute_aqi_from_pollutants

def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Location).first() is not None:
            return

        now = datetime.now(timezone.utc)

        # 1. External Data Sources
        openaq_source = ExternalDataSource(
            code="OPENAQ",
            name="OpenAQ v3 Ground Station Feed (CPCB/DPCC)",
            base_url="https://api.openaq.org/v3",
            data_kind="MEASURED",
            license_note="Open Data Commons Attribution (ODC-BY)",
            enabled=True
        )
        openmeteo_source = ExternalDataSource(
            code="OPENMETEO",
            name="Open-Meteo Atmospheric Air Quality Model",
            base_url="https://air-quality-api.open-meteo.com/v1",
            data_kind="MODELED",
            license_note="Copernicus Atmosphere Monitoring Service (CAMS) Attribution",
            enabled=True
        )
        demo_source = ExternalDataSource(
            code="DEMO_SAMPLE",
            name="AirTrack Ground Truth Sample Simulator",
            base_url="local://sample-feed",
            data_kind="SAMPLE",
            license_note="Proprietary AirTrack Demo Harness",
            enabled=True
        )
        db.add_all([openaq_source, openmeteo_source, demo_source])
        db.flush()

        # 2. Users
        admin_user = User(
            email="admin@airtrack.org",
            password_hash=get_password_hash("Admin@1234"),
            display_name="AirTrack Operations",
            role="ADMIN"
        )
        demo_user = User(
            email="parent@delhischool.edu",
            password_hash=get_password_hash("Parent@1234"),
            display_name="Priya Sharma (School Coordinator)",
            role="USER"
        )
        db.add_all([admin_user, demo_user])
        db.flush()

        # 3. Locations (Major Delhi-NCR and Indian metro hubs)
        locations_data = [
            ("Anand Vihar, Delhi", "Delhi", "Delhi", 28.6468, 77.3150),
            ("Lodhi Road, Delhi", "Delhi", "Delhi", 28.5916, 77.2274),
            ("IGI Airport (T3), Delhi", "Delhi", "Delhi", 28.5562, 77.1000),
            ("RK Puram, Delhi", "Delhi", "Delhi", 28.5642, 77.1754),
            ("Punjabi Bagh, Delhi", "Delhi", "Delhi", 28.6720, 77.1310),
            ("Sector 62, Noida", "Noida", "Uttar Pradesh", 28.6276, 77.3653),
            ("Sector 51, Gurugram", "Gurugram", "Haryana", 28.4312, 77.0700),
            ("Connaught Place, Delhi", "Delhi", "Delhi", 28.6315, 77.2167),
        ]
        
        station_instances = []
        for name, city, state, lat, lon in locations_data:
            loc = Location(
                name=name,
                city=city,
                state=state,
                country="India",
                latitude=lat,
                longitude=lon
            )
            db.add(loc)
            db.flush()

            # Create corresponding monitoring station
            station = Station(
                source_id=demo_source.id,
                external_id=f"DEL-STA-{loc.id}",
                name=f"Continuous Ambient Air Station - {name}",
                city=city,
                latitude=lat,
                longitude=lon,
                is_active=True,
                location_id=loc.id,
                last_seen_at=now
            )
            db.add(station)
            station_instances.append((loc, station))
        
        db.flush()

        # 4. Generate Realistic History and Current Observations for each station
        # Preset realistic air levels:
        # Anand Vihar: Very Poor / Severe (Hotspot)
        # Lodhi Road: Moderate / Poor
        # IGI Airport: Poor
        # Gurugram: Very Poor
        station_profiles = {
            1: (348, CpcbCategory.VERY_POOR, 185.0, 320.0, 72.0, 38.0, 2.5, 34.0),   # Anand Vihar
            2: (164, CpcbCategory.MODERATE, 78.0, 142.0, 48.0, 52.0, 1.4, 22.0),     # Lodhi Road
            3: (235, CpcbCategory.POOR, 115.0, 228.0, 62.0, 44.0, 1.8, 28.0),        # IGI Airport
            4: (312, CpcbCategory.VERY_POOR, 162.0, 290.0, 68.0, 36.0, 2.2, 30.0),   # RK Puram
            5: (288, CpcbCategory.POOR, 138.0, 260.0, 64.0, 40.0, 1.9, 26.0),        # Punjabi Bagh
            6: (365, CpcbCategory.VERY_POOR, 198.0, 340.0, 80.0, 42.0, 2.8, 38.0),   # Noida 62
            7: (382, CpcbCategory.VERY_POOR, 215.0, 362.0, 85.0, 45.0, 3.1, 40.0),   # Gurugram 51
            8: (195, CpcbCategory.MODERATE, 88.0, 180.0, 54.0, 48.0, 1.6, 25.0),     # CP
        }

        for loc, station in station_instances:
            base_aqi, cat, pm25, pm10, no2, o3, co, so2 = station_profiles.get(
                loc.id, (200, CpcbCategory.POOR, 100.0, 200.0, 50.0, 50.0, 2.0, 30.0)
            )

            # Generate last 24 hours of data points
            for hours_back in range(24, -1, -1):
                obs_time = now - timedelta(hours=hours_back)
                # diurnal fluctuation: higher pollution in morning (8-10 AM) and evening (7-11 PM)
                hour = obs_time.hour
                diurnal_factor = 1.25 if (7 <= hour <= 10 or 19 <= hour <= 23) else 0.85
                point_pm25 = max(15.0, round(pm25 * diurnal_factor * (1.0 + (hours_back % 3 - 1) * 0.05), 1))
                point_pm10 = max(25.0, round(pm10 * diurnal_factor * (1.0 + (hours_back % 3 - 1) * 0.05), 1))
                
                computed_aqi, computed_cat, dominant = compute_aqi_from_pollutants({
                    "PM2.5": point_pm25,
                    "PM10": point_pm10,
                    "NO2": no2,
                    "CO": co,
                    "SO2": so2,
                    "O3": o3
                })

                obs = Observation(
                    station_id=station.id,
                    observed_at=obs_time,
                    ingested_at=obs_time + timedelta(minutes=5),
                    aqi_value=computed_aqi,
                    aqi_scale="CPCB_NAQI",
                    aqi_category=computed_cat.value,
                    dominant_pollutant=dominant,
                    data_kind="SAMPLE"
                )
                db.add(obs)
                db.flush()

                # Add individual pollutant measurements
                measurements = [
                    PollutantMeasurement(observation_id=obs.id, pollutant="PM2.5", value=point_pm25, unit="ug/m3"),
                    PollutantMeasurement(observation_id=obs.id, pollutant="PM10", value=point_pm10, unit="ug/m3"),
                    PollutantMeasurement(observation_id=obs.id, pollutant="NO2", value=no2, unit="ug/m3"),
                    PollutantMeasurement(observation_id=obs.id, pollutant="SO2", value=so2, unit="ug/m3"),
                    PollutantMeasurement(observation_id=obs.id, pollutant="CO", value=co, unit="mg/m3"),
                    PollutantMeasurement(observation_id=obs.id, pollutant="O3", value=o3, unit="ug/m3"),
                ]
                db.add_all(measurements)

        # 5. User Saved Location & Alert Rule
        anand_vihar_loc = station_instances[0][0]
        user_loc = UserLocation(
            user_id=demo_user.id,
            location_id=anand_vihar_loc.id,
            label="Delhi Public School Campus",
            audience="CHILDREN_SCHOOL"
        )
        db.add(user_loc)
        db.flush()

        alert_rule = AlertRule(
            user_id=demo_user.id,
            location_id=anand_vihar_loc.id,
            audience="CHILDREN_SCHOOL",
            trigger_verdict="AVOID_OUTDOOR",
            enabled=True,
            cooldown_minutes=180
        )
        db.add(alert_rule)
        db.flush()

        notif = Notification(
            user_id=demo_user.id,
            alert_rule_id=alert_rule.id,
            message="Alert: Anand Vihar reached VERY POOR (AQI 348). Children's Verdict is STAY_INDOORS. Outdoor sports suspended.",
            created_at=now - timedelta(hours=1),
            read_at=None
        )
        db.add(notif)

        # 6. Initial Ingestion Run log
        ingest_log = IngestionRun(
            source_id=demo_source.id,
            started_at=now - timedelta(minutes=15),
            finished_at=now - timedelta(minutes=14),
            status="SUCCESS",
            records_fetched=192,
            error_summary=None
        )
        db.add(ingest_log)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
