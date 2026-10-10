"""
CPCB National Air Quality Index (NAQI) Calculation & Audience Verdict Engine
Official Source: Central Pollution Control Board (CPCB), MoEFCC, Govt of India
Technical Reference: "National Air Quality Index", CPCB & IIT Kanpur (October 2014)
"""
from enum import Enum
from typing import Dict, Optional, Tuple, Any

class CpcbCategory(str, Enum):
    GOOD = "GOOD"
    SATISFACTORY = "SATISFACTORY"
    MODERATE = "MODERATE"
    POOR = "POOR"
    VERY_POOR = "VERY_POOR"
    SEVERE = "SEVERE"

class Audience(str, Enum):
    GENERAL = "GENERAL"
    CHILDREN_SCHOOL = "CHILDREN_SCHOOL"
    SENSITIVE = "SENSITIVE"

class Verdict(str, Enum):
    SAFE = "SAFE"
    LIMIT_OUTDOOR = "LIMIT_OUTDOOR"
    AVOID_OUTDOOR = "AVOID_OUTDOOR"
    STAY_INDOORS = "STAY_INDOORS"

# CPCB Breakpoint table: (B_low, B_high, I_low, I_high)
# Units: PM10 (ug/m3), PM2.5 (ug/m3), NO2 (ug/m3), O3 (ug/m3), CO (mg/m3), SO2 (ug/m3)
BREAKPOINTS = {
    "PM10": [
        (0, 50, 0, 50),
        (51, 100, 51, 100),
        (101, 250, 101, 200),
        (251, 350, 201, 300),
        (351, 430, 301, 400),
        (431, 500, 401, 500),
    ],
    "PM2.5": [
        (0, 30, 0, 50),
        (31, 60, 51, 100),
        (61, 90, 101, 200),
        (91, 120, 201, 300),
        (121, 250, 301, 400),
        (251, 350, 401, 500),
    ],
    "NO2": [
        (0, 40, 0, 50),
        (41, 80, 51, 100),
        (81, 180, 101, 200),
        (181, 280, 201, 300),
        (281, 400, 301, 400),
        (401, 500, 401, 500),
    ],
    "O3": [
        (0, 50, 0, 50),
        (51, 100, 51, 100),
        (101, 168, 101, 200),
        (169, 208, 201, 300),
        (209, 748, 301, 400),
        (749, 1000, 401, 500),
    ],
    "CO": [
        (0.0, 1.0, 0, 50),
        (1.1, 2.0, 51, 100),
        (2.1, 10.0, 101, 200),
        (10.1, 17.0, 201, 300),
        (17.1, 34.0, 301, 400),
        (34.1, 50.0, 401, 500),
    ],
    "SO2": [
        (0, 40, 0, 50),
        (41, 80, 51, 100),
        (81, 380, 101, 200),
        (381, 800, 201, 300),
        (801, 1600, 301, 400),
        (1601, 2000, 401, 500),
    ],
}

OFFICIAL_HEALTH_STATEMENTS = {
    CpcbCategory.GOOD: "Minimal impact on health.",
    CpcbCategory.SATISFACTORY: "Minor breathing discomfort to sensitive people.",
    CpcbCategory.MODERATE: "Breathing discomfort to people with lung disease such as asthma, and discomfort to people with heart disease, children and older adults.",
    CpcbCategory.POOR: "Breathing discomfort to people on prolonged exposure, and discomfort to people with heart disease.",
    CpcbCategory.VERY_POOR: "Respiratory illness to the people on prolonged exposure. Effect may be more pronounced in people with lung and heart diseases.",
    CpcbCategory.SEVERE: "Respiratory effects even on healthy people and serious health impacts on people with lung/heart diseases. The health impacts may be experienced even during light physical activity.",
}

# Category breakpoints for AQI index value
AQI_CATEGORY_RANGES = [
    (0, 50, CpcbCategory.GOOD),
    (51, 100, CpcbCategory.SATISFACTORY),
    (101, 200, CpcbCategory.MODERATE),
    (201, 300, CpcbCategory.POOR),
    (301, 400, CpcbCategory.VERY_POOR),
    (401, 1000, CpcbCategory.SEVERE),
]

# Audience Verdict Rule Table
VERDICT_MATRIX: Dict[Tuple[CpcbCategory, Audience], Tuple[Verdict, str]] = {
    # GOOD
    (CpcbCategory.GOOD, Audience.GENERAL): (Verdict.SAFE, "Air quality is ideal. Normal outdoor activities and recreation are encouraged."),
    (CpcbCategory.GOOD, Audience.CHILDREN_SCHOOL): (Verdict.SAFE, "Outdoor sports, recess, and physical education can proceed without restriction."),
    (CpcbCategory.GOOD, Audience.SENSITIVE): (Verdict.SAFE, "Ideal air conditions. Enjoy outdoor activities with standard hydration."),
    
    # SATISFACTORY
    (CpcbCategory.SATISFACTORY, Audience.GENERAL): (Verdict.SAFE, "Air quality is acceptable for the general public."),
    (CpcbCategory.SATISFACTORY, Audience.CHILDREN_SCHOOL): (Verdict.SAFE, "Safe for all school activities and outdoor playtime."),
    (CpcbCategory.SATISFACTORY, Audience.SENSITIVE): (Verdict.LIMIT_OUTDOOR, "Sensitive individuals and asthmatics should take occasional breaks during heavy exertion."),
    
    # MODERATE
    (CpcbCategory.MODERATE, Audience.GENERAL): (Verdict.SAFE, "Air quality is acceptable; healthy adults can perform outdoor workouts."),
    (CpcbCategory.MODERATE, Audience.CHILDREN_SCHOOL): (Verdict.LIMIT_OUTDOOR, "Reduce intense prolonged aerobic sports outdoors; consider moving intense sessions indoors."),
    (CpcbCategory.MODERATE, Audience.SENSITIVE): (Verdict.AVOID_OUTDOOR, "Individuals with asthma or cardiopulmonary conditions should avoid prolonged outdoor exposure."),
    
    # POOR
    (CpcbCategory.POOR, Audience.GENERAL): (Verdict.LIMIT_OUTDOOR, "Reduce prolonged outdoor exertion; consider wearing an N95 mask in traffic hotspots."),
    (CpcbCategory.POOR, Audience.CHILDREN_SCHOOL): (Verdict.AVOID_OUTDOOR, "Cancel outdoor sports practice and long assemblies; conduct recess in closed ventilated rooms."),
    (CpcbCategory.POOR, Audience.SENSITIVE): (Verdict.STAY_INDOORS, "High risk of breathing discomfort. Remain indoors with clean air filtration."),
    
    # VERY POOR
    (CpcbCategory.VERY_POOR, Audience.GENERAL): (Verdict.AVOID_OUTDOOR, "Avoid strenuous outdoor exertion. Use certified N95/N99 masks during essential travel."),
    (CpcbCategory.VERY_POOR, Audience.CHILDREN_SCHOOL): (Verdict.STAY_INDOORS, "Emergency protocol: Suspend all outdoor campus activities. Run indoor air purifiers."),
    (CpcbCategory.VERY_POOR, Audience.SENSITIVE): (Verdict.STAY_INDOORS, "Severe health warning: Stay indoors. Keep rescue inhalers and emergency medication accessible."),
    
    # SEVERE
    (CpcbCategory.SEVERE, Audience.GENERAL): (Verdict.STAY_INDOORS, "Severe hazardous air. Everyone should stay indoors; seal windows and avoid physical exertion."),
    (CpcbCategory.SEVERE, Audience.CHILDREN_SCHOOL): (Verdict.STAY_INDOORS, "Highest alert: Recommend transitioning to online school/closure. Zero outdoor exposure."),
    (CpcbCategory.SEVERE, Audience.SENSITIVE): (Verdict.STAY_INDOORS, "Critical hazard: Strictly avoid outdoors. Serious exacerbation risk for existing respiratory conditions."),
}

def calculate_sub_index(pollutant: str, concentration: float) -> Optional[int]:
    """Calculates CPCB sub-index for a specific pollutant using linear interpolation."""
    table = BREAKPOINTS.get(pollutant)
    if not table or concentration < 0:
        return None
    
    for b_low, b_high, i_low, i_high in table:
        if b_low <= concentration <= b_high:
            sub = i_low + ((i_high - i_low) / (b_high - b_low)) * (concentration - b_low)
            return round(sub)
    
    # Above max breakpoint -> severe max 500
    if concentration > table[-1][1]:
        return 500
    return None

def get_aqi_category(aqi_value: int) -> CpcbCategory:
    """Determines official CPCB Category for a given AQI number."""
    for low, high, cat in AQI_CATEGORY_RANGES:
        if low <= aqi_value <= high:
            return cat
    return CpcbCategory.SEVERE

def compute_aqi_from_pollutants(pollutants: Dict[str, float]) -> Tuple[int, CpcbCategory, str]:
    """
    Computes overall CPCB AQI, category, and dominant pollutant.
    CPCB requires PM10 or PM2.5 to be present.
    """
    sub_indices: Dict[str, int] = {}
    for code, val in pollutants.items():
        if val is not None:
            sub = calculate_sub_index(code, val)
            if sub is not None:
                sub_indices[code] = sub
                
    if not sub_indices:
        return 50, CpcbCategory.GOOD, "PM2.5"
        
    dominant = max(sub_indices, key=sub_indices.get)
    max_aqi = sub_indices[dominant]
    category = get_aqi_category(max_aqi)
    return max_aqi, category, dominant

def evaluate_verdict(category: CpcbCategory, audience: Audience) -> Dict[str, Any]:
    """Evaluates audience-specific actionable verdict and returns full explanation."""
    rule = VERDICT_MATRIX.get((category, audience), (Verdict.SAFE, "Exercise standard caution."))
    verdict_type, recommendation = rule
    
    return {
        "verdict": verdict_type.value,
        "audience": audience.value,
        "category": category.value,
        "ruleFired": f"CPCB_{category.value}_{audience.value}",
        "officialHealthStatement": OFFICIAL_HEALTH_STATEMENTS.get(category, ""),
        "plainLanguageRecommendation": recommendation,
        "disclaimer": "AirTrack guidance is based on official CPCB health standards. This constitutes general protective guidance, not personal medical advice."
    }
