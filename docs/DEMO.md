# AirTrack: 3-Minute Hackathon Demo Video Script

**Event:** Environmental Hacks (WeMakeDevs x AWS) | Track 01: Air  
**Target Video Duration:** 3 Minutes Exactly (180 Seconds)  
**Rule:** No live presentation; recorded video only.

---

### [0:00 - 0:25] The Problem Hook: "Numbers Don't Protect Lungs"
* **Visual on screen:** Open a standard weather/AQI app showing a raw number: *"AQI 348"*.
* **Voiceover:**
  > *"Every winter across North India, millions of parents and school principals wake up to a raw number like 'AQI 348'. But a raw number doesn't answer the real question: Should 500 children assemble outdoors for morning sports today? Is that data even from a real ground monitor, or is it a 4-hour-old computer model? Existing apps give data; people need an explainable, binding decision."*

---

### [0:25 - 1:10] The Solution: Transparent Audience-Specific Verdict
* **Visual on screen:** Show the AirTrack Dashboard (`http://localhost:5173`). Search for **"Anand Vihar, Delhi"**.
* **Action:**
  1. Highlight the primary Verdict Card displaying: **`STAY INDOORS • ZERO OUTDOOR SPORTS`**.
  2. Toggle the audience demographic selector from **School & Children** $\rightarrow$ **General Public** $\rightarrow$ **Asthma / Seniors**.
  3. Show how the verdict dynamically adapts based on the official Central Pollution Control Board (CPCB) rule matrix (`CPCB_VERY_POOR_CHILDREN_SCHOOL`).
  4. Point out the Provenance Badges: **`MEASURED`**, **`FRESH (12 min ago)`**, and official CPCB citation.
* **Voiceover:**
  > *"Welcome to AirTrack. We convert ambient pollution feeds into instant, explainable verdicts for specific groups. Notice how selecting 'School & Children' triggers an immediate outdoor suspension directive, citing the exact official CPCB health guideline. Every data point is tagged with its source, observation time, and whether it's station-measured or modeled—eliminating misleading numbers."*

---

### [1:10 - 1:55] Flagship Feature: School Air Safety Protocol & WhatsApp Draft
* **Visual on screen:** Click the **`School Safety Protocol`** button on the navbar.
* **Action:**
  1. The **School Air Safety Directive** modal opens.
  2. Scroll through the binding directives: Morning Assembly Relocation, Outdoor Sports Suspension, Classroom Air Filtration schedule.
  3. Click **`Copy Draft`** on the 1-Click WhatsApp / SMS Parent Notification generator.
* **Voiceover:**
  > *"To directly solve the hackathon's 'School safety on bad days' challenge, AirTrack generates an instant, binding School Action Protocol. Instead of wondering what to do, school administrations receive automated directives for assemblies and sports, plus a 1-click WhatsApp announcement ready to dispatch to parents before the morning bus departs."*

---

### [1:55 - 2:35] Regional Depth: Stubble Burning Layer, Trends & Hotspots
* **Visual on screen:** Switch to the **`Map & Hotspots`** tab.
* **Action:**
  1. Show the interactive Leaflet dark-mode map of Delhi-NCR stations with CPCB colored pins.
  2. Toggle the **`Stubble Burning Layer (ON)`** to display NASA FIRMS active fire clusters in Punjab and Haryana with prevailing northwest wind direction.
  3. Hover over the 24-hour diurnal trend chart showing morning and evening particulate spikes.
* **Voiceover:**
  > *"On our Map and Hotspots engine, users see where pollution is concentrated. In October and November, North India faces severe stubble burning. AirTrack visualizes active satellite crop fire clusters and wind vectors, warning communities before toxic smoke plumes arrive. The 24-hour diurnal chart reveals when to schedule ventilation versus when to seal classroom windows."*

---

### [2:35 - 3:00] AWS Architecture & Conclusion
* **Visual on screen:** Display the AWS Architecture diagram and terminal test suite output (33/33 tests passed).
* **Voiceover:**
  > *"AirTrack is architected with AWS open-source tools—using boto3 with Amazon Bedrock for AI guidance, FastAPI for high-throughput REST APIs, and Amazon CloudFront with S3 for sub-100ms global delivery. AirTrack doesn't just display air quality—it changes what happens on the bad days. Thank you!"*
