"""
SQLAlchemy Database Models for AirTrack.
Implements the 10 justified tables specified in section 8 of prompt.md.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # USER | ADMIN
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    saved_locations = relationship("UserLocation", back_populates="user", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    country = Column(String(50), default="India", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    stations = relationship("Station", back_populates="location")
    user_locations = relationship("UserLocation", back_populates="location")
    alert_rules = relationship("AlertRule", back_populates="location")


class UserLocation(Base):
    __tablename__ = "user_locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), nullable=False)  # e.g., "Kids' School", "Home"
    audience = Column(String(50), default="CHILDREN_SCHOOL", nullable=False)

    user = relationship("User", back_populates="saved_locations")
    location = relationship("Location", back_populates="user_locations")

    __table_args__ = (
        UniqueConstraint("user_id", "location_id", name="uq_user_location"),
    )


class ExternalDataSource(Base):
    __tablename__ = "external_data_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # OPENAQ, OPENMETEO, DEMO_SAMPLE
    name = Column(String(100), nullable=False)
    base_url = Column(String(255), nullable=False)
    data_kind = Column(String(20), nullable=False)  # MEASURED | MODELED | SAMPLE
    license_note = Column(String(255), nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)

    stations = relationship("Station", back_populates="source")
    ingestion_runs = relationship("IngestionRun", back_populates="source")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("external_data_sources.id"), nullable=False)
    external_id = Column(String(100), nullable=False)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_seen_at = Column(DateTime, default=utc_now)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)

    source = relationship("ExternalDataSource", back_populates="stations")
    location = relationship("Location", back_populates="stations")
    observations = relationship("Observation", back_populates="station", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("source_id", "external_id", name="uq_source_station"),
        Index("idx_stations_lat_lon", "latitude", "longitude"),
    )


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)
    observed_at = Column(DateTime, nullable=False)
    ingested_at = Column(DateTime, default=utc_now, nullable=False)
    aqi_value = Column(Integer, nullable=False)
    aqi_scale = Column(String(50), default="CPCB_NAQI", nullable=False)
    aqi_category = Column(String(50), nullable=False)  # GOOD, SATISFACTORY, MODERATE, POOR, VERY_POOR, SEVERE
    dominant_pollutant = Column(String(20), nullable=False)
    data_kind = Column(String(20), nullable=False)  # MEASURED | MODELED | SAMPLE

    station = relationship("Station", back_populates="observations")
    measurements = relationship("PollutantMeasurement", back_populates="observation", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("station_id", "observed_at", "data_kind", name="uq_station_observation"),
        Index("idx_obs_station_time", "station_id", "observed_at"),
    )


class PollutantMeasurement(Base):
    __tablename__ = "pollutant_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    observation_id = Column(Integer, ForeignKey("observations.id", ondelete="CASCADE"), nullable=False)
    pollutant = Column(String(20), nullable=False)  # PM2.5, PM10, NO2, SO2, CO, O3
    value = Column(Float, nullable=False)
    unit = Column(String(20), default="ug/m3", nullable=False)

    observation = relationship("Observation", back_populates="measurements")

    __table_args__ = (
        UniqueConstraint("observation_id", "pollutant", name="uq_observation_pollutant"),
    )


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    audience = Column(String(50), default="CHILDREN_SCHOOL", nullable=False)
    trigger_verdict = Column(String(50), default="AVOID_OUTDOOR", nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    cooldown_minutes = Column(Integer, default=180, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="alert_rules")
    location = relationship("Location", back_populates="alert_rules")
    notifications = relationship("Notification", back_populates="alert_rule")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")
    alert_rule = relationship("AlertRule", back_populates="notifications")

    __table_args__ = (
        Index("idx_notif_user_read", "user_id", "read_at"),
    )


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("external_data_sources.id"), nullable=False)
    started_at = Column(DateTime, default=utc_now, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS | PARTIAL | FAILED
    records_fetched = Column(Integer, default=0, nullable=False)
    error_summary = Column(Text, nullable=True)

    source = relationship("ExternalDataSource", back_populates="ingestion_runs")
