# AirTrack: Data Sources & Integration Strategy

**Document Status:** Verified & Approved  
**Last Updated:** October 10, 2026  
**Scope:** Phase 1 Deliverable for WeMakeDevs x AWS Environmental Hacks (Air Track)

---

## 1. Provider Evaluation Matrix

We evaluated four candidate data providers for air quality across Indian geographies (with primary focus on Delhi NCR and Tier 1/2 cities).

| Provider | Data Kind | Coverage (India / Delhi NCR) | Auth / Keys Required | Rate Limits | License / Terms | Primary / Fallback Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenAQ (v3)** | **MEASURED** (Station sensors) | Extensive station coverage (CPCB, DPCC, US Embassy monitors in Delhi/NCR) | API Key Required (`X-API-Key` header via environment variable) | Free tier: 2,000 req/day; 1 req/sec | Open Data Commons (ODC-BY) | **PRIMARY PROVIDER (Station Measured)** |
| **Open-Meteo Air Quality** | **MODELED & FORECAST** (Copernicus / CAMS) | Complete grid coverage by lat/lon (resolution ~11km) | **No Key Required** (Public open API) | 10,000 req/day for non-commercial open source | Attribution to Open-Meteo & Copernicus required | **SECONDARY / FALLBACK PROVIDER** (Must be labeled `MODELED`) |
| **CPCB via data.gov.in** | **MEASURED** (Official) | Official stations across India | OGD India API Key | Variable, frequently experiences upstream downtime and rate throttling | Government Open Data License - India (GODL) | **TERTIARY REFERENCE** |
| **WAQI / AQICN** | **MEASURED / AGGREGATED** | Broad Indian coverage | Token required | 1,000 req/minute, strict IP throttling | Non-commercial attribution required | **BENCHMARK / VALIDATION ONLY** |

---

## 2. Selection Decision & Justification

### Primary Provider: OpenAQ v3
- **Evidence:** OpenAQ aggregates ground-level monitoring stations directly from official statutory monitors (e.g. DPCC Anand Vihar, RK Puram, Punjabi Bagh, CPCB ITO).
- **Data Kind:** `MEASURED`.
- **Pollutants Available:** PM2.5, PM10, NO2, SO2, CO, O3.
- **Update Frequency:** Hourly (stations report every 15–60 minutes).
- **Freshness Definition:**
  - `FRESH`: Observation timestamp $\le$ 3 hours old.
  - `STALE`: Observation timestamp $>$ 3 hours old (triggers a visible stale data badge in the UI).

### Fallback Provider: Open-Meteo Air Quality API
- **Evidence:** Global reanalysis model combining atmospheric dispersion models (ECMWF / CAMS). It works for any coordinate pair without requiring an API key.
- **Data Kind:** `MODELED`.
- **Pollutants Available:** PM2.5, PM10, NO2, SO2, CO, O3, European AQI, US AQI.
- **Update Frequency:** Hourly forecasts and model runs updated 4 times daily.
- **Freshness Definition:** Model run time within 6 hours.
- **Labeling Mandate:** All responses sourced from Open-Meteo **must** carry `dataKind: "MODELED"` and display a `MODELED DATA` badge to avoid misleading users.

### Demo Mode (Offline / Standalone Fallback)
- **Environment Flag:** `AIRTRACK_DEMO_MODE=true`
- **Data Kind:** `SAMPLE`.
- **Purpose:** Guaranteed zero-dependency demonstration for the 3-minute video recording and hackathon judges if upstream networks or API keys throttle.
- **Guarantee:** Pre-seeded realistic observations for Delhi NCR stations (Anand Vihar, Lodhi Road, IGI Airport, Noida Sector 62, Gurugram Sector 51) with varied severity (Good, Moderate, Very Poor, Severe) to demonstrate all audience verdict paths.

---

## 3. Official CPCB AQI Breakpoints & Health Statements

*Source: Central Pollution Control Board (CPCB), Ministry of Environment, Forest & Climate Change (MoEFCC), Govt of India; verified against Gazette / PIB / IIT Kanpur Technical Report.*

### 3.1 National AQI (NAQI) Breakpoints (24-Hour Average in $\mu\text{g/m}^3$)

| AQI Category | AQI Range | Color Code | PM10 (24h) | PM2.5 (24h) | NO2 (24h) | O3 (8h) | CO (8h, mg/m³) | SO2 (24h) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Good** | **0 – 50** | `#00E400` (Green) | 0 – 50 | 0 – 30 | 0 – 40 | 0 – 50 | 0 – 1.0 | 0 – 40 |
| **Satisfactory** | **51 – 100** | `#92D050` (Light Green) | 51 – 100 | 31 – 60 | 41 – 80 | 51 – 100 | 1.1 – 2.0 | 41 – 80 |
| **Moderate** | **101 – 200** | `#FFFF00` (Yellow) | 101 – 250 | 61 – 90 | 81 – 180 | 101 – 168 | 2.1 – 10.0 | 81 – 380 |
| **Poor** | **201 – 300** | `#FF7E00` (Orange) | 251 – 350 | 91 – 120 | 181 – 280 | 169 – 208 | 10.1 – 17.0 | 381 – 800 |
| **Very Poor** | **301 – 400** | `#FF0000` (Red) | 351 – 430 | 121 – 250 | 281 – 400 | 209 – 748 | 17.1 – 34.0 | 801 – 1600 |
| **Severe** | **401 – 500** | `#7E0023` (Maroon) | 430+ | 250+ | 400+ | 748+ | 34.0+ | 1600+ |

### 3.2 Official CPCB Health Impact Statements
- **Good (0-50):** Minimal impact.
- **Satisfactory (51-100):** Minor breathing discomfort to sensitive people.
- **Moderate (101-200):** Breathing discomfort to people with lung disease such as asthma, and discomfort to people with heart disease, children and older adults.
- **Poor (201-300):** Breathing discomfort to people on prolonged exposure, and discomfort to people with heart disease.
- **Very Poor (301-400):** Respiratory illness to the people on prolonged exposure. Effect may be more pronounced in people with lung and heart diseases.
- **Severe (401-500):** Respiratory effects even on healthy people and serious health impacts on people with lung/heart diseases. The health impacts may be experienced even during light physical activity.

---

## 4. Audience Verdict Mapping Matrix

AirTrack maps each `(AQI Category, Audience)` pair to an actionable verdict:

| CPCB Category | GENERAL Audience | CHILDREN_SCHOOL Audience | SENSITIVE Audience (Asthma/Elderly) | Action Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Good (0-50)** | `SAFE` | `SAFE` | `SAFE` | Normal outdoor activities permitted. |
| **Satisfactory (51-100)** | `SAFE` | `SAFE` | `LIMIT_OUTDOOR` | Sensitive individuals should take breaks during prolonged outdoor exertion. |
| **Moderate (101-200)** | `SAFE` | `LIMIT_OUTDOOR` | `AVOID_OUTDOOR` | Schools reduce intense physical education outdoors; sensitive groups stay indoors. |
| **Poor (201-300)** | `LIMIT_OUTDOOR` | `AVOID_OUTDOOR` | `STAY_INDOORS` | Cancel outdoor school sports; morning assemblies moved indoors; wear N95 outdoors. |
| **Very Poor (301-400)** | `AVOID_OUTDOOR` | `STAY_INDOORS` | `STAY_INDOORS` | Suspend all outdoor school activity; seal indoor classrooms; activate HEPA filtration. |
| **Severe (401-500)** | `STAY_INDOORS` | `STAY_INDOORS` | `STAY_INDOORS` | Emergency level: recommend school closure / transition to online classes; zero outdoor exposure. |

### Medical Disclaimer
*Every verdict response includes the explicit disclaimer:*  
> *"AirTrack recommendations are grounded in official CPCB guidelines and environmental exposure models. This constitutes general protective guidance, not personal medical advice. Consult a healthcare professional for clinical decisions."*
