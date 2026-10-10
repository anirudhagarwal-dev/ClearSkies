# AirTrack: System Architecture & Technical Design

**Document Status:** Approved (Phase 2 Deliverable)  
**Version:** 1.0  
**Scope:** Full architectural blueprints, data flows, schemas, API contracts, and AWS deployment mapping.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (React 18 + Vite Web App)"]
        UI["AirTrack Responsive Dashboard\n(Tailwind CSS, Lucide Icons)"]
        MapEngine["Interactive Map Engine\n(Leaflet + OpenStreetMap)"]
        ChartEngine["Trends & History\n(Recharts)"]
        StateEngine["API & Cache Client\n(TanStack Query / Axios)"]
        UI --> MapEngine
        UI --> ChartEngine
        UI --> StateEngine
    end

    subgraph APITier["Application & API Tier"]
        Gateway["REST API Controller (/api/v1)\n(OpenAPI 3.0 / Swagger UI)"]
        AuthModule["JWT Security & Auth Module\n(BCrypt Hashing)"]
        VerdictEngine["CPCB National AQI & Audience Verdict Engine"]
        IngestScheduler["Ingestion & Sync Service\n(Scheduled + On-Demand Trigger)"]
        CacheLayer["In-Memory Cache Layer\n(TTL: 15 min for observations)"]
        
        Gateway --> AuthModule
        Gateway --> VerdictEngine
        Gateway --> CacheLayer
        IngestScheduler --> CacheLayer
    end

    subgraph DataAccess["Data Access & Storage"]
        DB[(Relational DB: PostgreSQL / SQLite)\n(Append-only Observations, Stations, Users)]
        CacheLayer --> DB
        IngestScheduler --> DB
    end

    subgraph ExternalProviders["External Air Quality Data Sources"]
        P1["Primary: OpenAQ v3 API\n(Station MEASURED)"]
        P2["Fallback: Open-Meteo API\n(Atmospheric MODELED)"]
        P3["Demo Seed Provider\n(Guaranteed Offline SAMPLE)"]
    end

    StateEngine -->|HTTPS /api/v1| Gateway
    IngestScheduler -->|HTTP + Rate-Limiting| P1
    IngestScheduler -.->|Fallback on Failure| P2
    IngestScheduler -.->|Demo Mode Active| P3
```

---

## 2. Data Flow Pipeline

Every data ingestion and retrieval follows a strict 6-stage lifecycle to guarantee data provenance and prevent stale data propagation:

```mermaid
sequenceDiagram
    autonumber
    actor User as Parent / School Coordinator
    participant Web as React Frontend
    participant API as AirTrack API (/api/v1)
    participant Engine as CPCB Verdict Engine
    participant Cache as Cache / DB
    participant Ext as External Provider (OpenAQ/Open-Meteo)

    User->>Web: Selects Location & Audience ("Children/School")
    Web->>API: GET /api/v1/air-quality/verdict?locationId=1&audience=CHILDREN_SCHOOL
    API->>Cache: Query cached observation (within TTL)
    alt Cache Hit (Observation < 3h old)
        Cache-->>API: Return observation (FRESH)
    else Cache Miss or Stale
        API->>Ext: Fetch latest measurements
        alt Ext Success
            Ext-->>API: Raw pollutant payload
            API->>API: Normalize units (ug/m3) & check freshness
            API->>Cache: Store new observation & measurements
        else Ext Timeout / Error
            Cache-->>API: Return latest available observation (marked STALE)
        end
    end
    API->>Engine: Evaluate CPCB category & Audience Rule
    Engine-->>API: Verdict: AVOID_OUTDOOR + Dominant PM2.5 + Official Guidance
    API-->>Web: Response with full provenance (source, observedAt, dataKind, freshness)
    Web-->>User: Displays Action Card, CPCB color badge, and School Advisory
```

---

## 3. Entity Relationship (ER) Schema

The database design implements 10 justified tables with primary keys, foreign keys, unique constraints, and optimized indexes:

```mermaid
erDiagram
    USERS ||--o{ USER_LOCATIONS : "saves"
    USERS ||--o{ ALERT_RULES : "configures"
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    LOCATIONS ||--o{ USER_LOCATIONS : "referenced in"
    LOCATIONS ||--o{ ALERT_RULES : "monitored by"
    LOCATIONS ||--o{ STATIONS : "nearest to"
    
    ALERT_RULES ||--o{ NOTIFICATIONS : "triggers"
    
    EXTERNAL_DATA_SOURCES ||--o{ STATIONS : "supplies"
    EXTERNAL_DATA_SOURCES ||--o{ INGESTION_RUNS : "logged in"
    
    STATIONS ||--o{ OBSERVATIONS : "records"
    OBSERVATIONS ||--o{ POLLUTANT_MEASUREMENTS : "contains"

    USERS {
        int id PK
        string email UK
        string password_hash
        string display_name
        string role "USER | ADMIN"
        datetime created_at
        datetime updated_at
    }

    LOCATIONS {
        int id PK
        string name
        string city
        string state
        string country
        float latitude
        float longitude
        datetime created_at
    }

    USER_LOCATIONS {
        int id PK
        int user_id FK
        int location_id FK
        string label
        string audience "GENERAL | CHILDREN_SCHOOL | SENSITIVE"
    }

    EXTERNAL_DATA_SOURCES {
        int id PK
        string code UK "OPENAQ | OPENMETEO | DEMO_SAMPLE"
        string name
        string base_url
        string data_kind "MEASURED | MODELED | SAMPLE"
        string license_note
        boolean enabled
    }

    STATIONS {
        int id PK
        int source_id FK
        string external_id
        string name
        string city
        float latitude
        float longitude
        boolean is_active
        datetime last_seen_at
    }

    OBSERVATIONS {
        int id PK
        int station_id FK
        datetime observed_at
        datetime ingested_at
        int aqi_value
        string aqi_scale "CPCB_NAQI"
        string aqi_category "GOOD | SATISFACTORY | MODERATE | POOR | VERY_POOR | SEVERE"
        string dominant_pollutant
        string data_kind "MEASURED | MODELED | SAMPLE"
    }

    POLLUTANT_MEASUREMENTS {
        int id PK
        int observation_id FK
        string pollutant "PM25 | PM10 | NO2 | SO2 | CO | O3"
        float value
        string unit "ug/m3 | mg/m3"
    }

    ALERT_RULES {
        int id PK
        int user_id FK
        int location_id FK
        string audience "GENERAL | CHILDREN_SCHOOL | SENSITIVE"
        string trigger_verdict "LIMIT_OUTDOOR | AVOID_OUTDOOR | STAY_INDOORS"
        boolean enabled
        int cooldown_minutes
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        int alert_rule_id FK
        string message
        datetime created_at
        datetime read_at
    }

    INGESTION_RUNS {
        int id PK
        int source_id FK
        datetime started_at
        datetime finished_at
        string status "SUCCESS | PARTIAL | FAILED"
        int records_fetched
        string error_summary
    }
```

---

## 4. REST API Specification (`/api/v1`)

All error responses strictly adhere to the **RFC 7807 Problem Details** format:
```json
{
  "type": "https://airtrack.local/errors/invalid-parameter",
  "title": "Invalid Request Parameter",
  "status": 400,
  "detail": "Query parameter 'q' must be between 2 and 100 characters.",
  "instance": "/api/v1/locations/search",
  "code": "INVALID_QUERY_LENGTH",
  "correlationId": "req-98f7e2a1"
}
```

### 4.1 Public Endpoints
| Method | Path | Parameters | Response Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/locations/search` | `q` (string, 2..100) | Array of matched locations with coordinates. |
| `GET` | `/stations` | `lat`, `lon`, `radiusKm` (1..100, default 25) | Nearby stations with active status. |
| `GET` | `/air-quality/current` | `locationId` OR `lat`, `lon` | Latest observation, all pollutants, provenance. |
| `GET` | `/air-quality/verdict` | `locationId`, `audience` | Computed verdict (`SAFE`, `LIMIT_OUTDOOR`, etc.), explanation, rule cited. |
| `GET` | `/air-quality/history` | `stationId`, `from`, `to`, `interval` | Historical time-series points (24h or 7d). |
| `GET` | `/air-quality/hotspots` | `city`, `limit` (1..50) | Ranked stations by AQI descending. |
| `GET` | `/sources` | none | Active data sources, licenses, update intervals. |
| `GET` | `/actuator/health` | none | System health check (DB, cache, memory). |

### 4.2 Authentication Endpoints
| Method | Path | Request Body | Response Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `{ email, password, displayName }` | User ID, display name, JWT token. |
| `POST` | `/auth/login` | `{ email, password }` | JWT bearer token, user profile. |
| `GET` | `/users/me` | Bearer Token header | Current authenticated user profile. |

### 4.3 User Endpoints (JWT Required)
| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET / POST / DELETE` | `/me/locations` | User JWT | Manage saved locations (Home, School). |
| `GET / POST / PUT / DELETE`| `/me/alert-rules`| User JWT | Manage alert thresholds (enforces user ownership). |
| `GET` | `/me/notifications`| User JWT | Fetch in-app notifications. |
| `PATCH` | `/me/notifications/{id}/read` | User JWT | Mark notification as read. |

### 4.4 Admin Endpoints (ROLE_ADMIN Only)
| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/ingestion-runs`| Admin JWT | View paginated ingestion logs and provider latencies. |
| `POST` | `/admin/ingestion/trigger` | Admin JWT | Trigger immediate synchronous or async data sync. |

---

## 5. Provenance & Provenance Envelope Contract

Every air quality observation returned to the frontend **must** carry the provenance header:
```json
{
  "aqiValue": 328,
  "aqiScale": "CPCB_NAQI",
  "aqiCategory": "VERY_POOR",
  "dominantPollutant": "PM2.5",
  "source": {
    "id": "OPENAQ",
    "name": "OpenAQ Ground Station (CPCB Anand Vihar)",
    "license": "ODC-BY"
  },
  "dataKind": "MEASURED",
  "freshness": "FRESH",
  "observedAt": "2026-10-10T05:30:00Z",
  "ingestedAt": "2026-10-10T05:42:00Z",
  "pollutants": {
    "PM2.5": { "value": 178.4, "unit": "ug/m3" },
    "PM10": { "value": 312.0, "unit": "ug/m3" },
    "NO2": { "value": 68.2, "unit": "ug/m3" },
    "CO": { "value": 2.4, "unit": "mg/m3" }
  }
}
```

---

## 6. AWS Deployment Architecture

```mermaid
flowchart TD
    subgraph Client["End Users"]
        Browser["User Browser"]
    end

    subgraph AWSCloud["Amazon Web Services (AWS)"]
        subgraph EdgeLayer["Edge / Static Delivery"]
            CF["Amazon CloudFront (HTTPS CDN)"]
            S3["Amazon S3 Bucket\n(Vite React Static Bundle)"]
            CF -->|Serves Assets| S3
        end

        subgraph ComputeLayer["Backend Compute"]
            ALB["Application Load Balancer / API Gateway"]
            AppRunner["AWS App Runner / EC2 Container\n(AirTrack REST API)"]
            ALB --> AppRunner
        end

        subgraph StorageLayer["Data & Security"]
            RDS["Amazon RDS PostgreSQL (or container)"]
            SM["AWS Secrets Manager / SSM Parameter Store"]
            CW["Amazon CloudWatch Logs & Metrics"]
        end

        AppRunner --> RDS
        AppRunner --> SM
        AppRunner --> CW
    end

    Browser -->|HTTPS /| CF
    Browser -->|HTTPS /api/v1| ALB
```
