# AirTrack: Requirements, User Stories & Acceptance Criteria

**Document Status:** Approved  
**Version:** 1.0 (Phase 1 Baseline)  
**Event:** Bharat Builds Tour - Environmental Hacks (WeMakeDevs x AWS)  
**Track:** 01 Air

---

## 1. Problem Statement & Core Value Proposition

Air quality apps across India report raw numerical indices (e.g. *"AQI 324"*). For school principals, parents, and asthmatic citizens, a raw number does not answer the critical question:
> **"Can our children hold morning sports assembly outdoors today, and what protective measures are required right now?"**

Furthermore, users cannot tell whether numbers are real-time ground-station sensor readings, atmospheric model estimates, or hours-old stale data.

**AirTrack** solves this by providing:
1. **Explainable Audience-Specific Verdicts:** Directly actionable recommendations (`SAFE`, `LIMIT_OUTDOOR`, `AVOID_OUTDOOR`, `STAY_INDOORS`) tailored for `GENERAL`, `CHILDREN_SCHOOL`, and `SENSITIVE` audiences.
2. **Transparent Provenance:** Explicit badges showing `MEASURED` vs. `MODELED` vs. `SAMPLE`, observation timestamp, and `FRESH` vs. `STALE` status.
3. **Hotspot Ranking & Early Action:** Visualizing local hotspots to identify cleaner vs. hazardous micro-zones.

---

## 2. Target Personas

| Persona | Role | Primary Goal | Key Frustration |
| :--- | :--- | :--- | :--- |
| **Priya (Parent / School Coordinator)** | Primary | Decide daily school outdoor activities and morning sports. | Raw AQI apps don't give school-specific guidelines or explanation. |
| **Ramesh (Sensitive Resident / Asthmatic)** | Secondary | Know when to take preventive medication or avoid outdoor walks. | Lack of threshold personalization and lack of data freshness warnings. |
| **System Admin** | Operational | Monitor ingestion health, provider latency, and fallback status. | Silent data failures and stale caches leading to incorrect public verdicts. |

---

## 3. User Stories by Priority Tier

### Priority Tier 0 (P0 - MVP / Hackathon Core)
- **US-01 (Location Search):** As a user, I can search for my city or locality (e.g., "Anand Vihar, Delhi", "Lodhi Road", "Gurugram") and select from supported locations.
- **US-02 (Current AQI & Pollutants):** As a user, I see the current AQI along with individual pollutant concentrations (PM2.5, PM10, NO2, SO2, CO, O3) and the dominant pollutant.
- **US-03 (Audience Verdict):** As a parent/school coordinator, I can toggle between `Children / School`, `General Public`, and `Sensitive Groups` to see an immediate verdict (`SAFE`, `LIMIT_OUTDOOR`, `AVOID_OUTDOOR`, `STAY_INDOORS`) with the explicit CPCB rule cited.
- **US-04 (Data Transparency & Provenance):** As a user, I can see the data provider (OpenAQ / Open-Meteo), the exact observation time in local time (IST), whether the data is `MEASURED` or `MODELED`, and whether it is `FRESH` ($\le$ 3h) or `STALE` ($>$ 3h).
- **US-05 (History Chart):** As a user, I can view an interactive 24-hour and 7-day trend chart of AQI and PM2.5 levels.
- **US-06 (Station Map & Hotspots):** As a user, I can view nearby air monitoring stations on an interactive Leaflet map with color-coded CPCB status pins.
- **US-07 (Demo Mode):** As a judge or tester, I can launch the app in Demo Mode (`dataKind: SAMPLE`) with pre-seeded realistic data that works reliably without any external network dependency or API keys.

### Priority Tier 1 (P1 - Enhanced Experience)
- **US-08 (User Authentication):** As a user, I can register and log in with JWT authentication to save my favorite locations.
- **US-09 (Saved Locations):** As an authenticated user, I can bookmark locations (e.g., "Kids' School", "Home", "Office") for 1-click access.
- **US-10 (Alert Rules & In-App Notifications):** As a user, I can configure an alert threshold (e.g. notify me when Kids' School reaches `AVOID_OUTDOOR`), which creates in-app notifications.
- **US-11 (City Hotspot Ranking):** As a user, I can view a ranked list of the most polluted vs. cleanest monitoring stations in the city.
- **US-12 (Admin Ingestion Health):** As an admin, I can inspect recent ingestion runs, provider latency, error logs, and trigger a manual data refresh.

### Priority Tier 2 (P2 - Stretch / If Time Permits)
- **US-13 (Provider Forecast):** As a user, I can see the provider's 24-48h forecast clearly marked with a `FORECAST` badge.
- **US-14 (Stubble Burning Seasonal Context):** As a user, I can view a contextual layer showing seasonal farm fire activity and wind trajectory.

---

## 4. Acceptance Criteria (Traceable to Section E of Prompt)

1. **AC-01 (Local Execution):** Clean clone runs locally using documented commands; all services start without manual code patching.
2. **AC-02 (Provider Fallback):** When primary provider (OpenAQ) is unreachable, the system gracefully falls back to the secondary provider (Open-Meteo) or labeled cached data, returning HTTP 200 with appropriate provenance flags, never crashing (HTTP 500).
3. **AC-03 (Verdict Rule Determinism):** Every verdict calculation strictly follows the official CPCB matrix; 100% of defined `(Category, Audience)` pairs have unit test verification.
4. **AC-04 (Provenance Integrity):** 100% of public air-quality API responses contain `source`, `dataKind` (`MEASURED` | `MODELED` | `SAMPLE`), `observedAt`, `freshness` (`FRESH` | `STALE`), and `aqiScale` (`CPCB_NAQI`).
5. **AC-05 (Security & Access Control):** Passwords hashed with BCrypt; protected endpoints reject requests lacking valid JWT bearer token with HTTP 401; admin endpoints reject non-admin users with HTTP 403; zero API keys committed to Git.
6. **AC-06 (No Dead Buttons):** Every interactive button, filter toggle, tab, and form submission in the frontend triggers working, tested state transitions.

---

## 5. Measurable Impact Metrics for Submission
- **Locations Covered:** 12+ primary Delhi-NCR monitoring hubs with real coordinates.
- **Time to Actionable Decision:** < 2 seconds from landing on page to seeing audience-specific verdict.
- **Transparency Score:** 100% data points tagged with source + observation timestamp + sensor freshness.
- **Rule Verification:** 18 distinct category-audience verdict paths covered by automated unit tests.
