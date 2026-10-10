"""
Unit Tests for CPCB Engine & Audience Verdict Matrix
Tests all 18 (Category x Audience) combinations and breakpoint sub-indices.
"""
import pytest
from app.core.cpcb_engine import (
    calculate_sub_index,
    get_aqi_category,
    compute_aqi_from_pollutants,
    evaluate_verdict,
    CpcbCategory,
    Audience,
    Verdict
)

def test_pm25_sub_indices():
    # Good (0-30 -> 0-50)
    assert calculate_sub_index("PM2.5", 15.0) == 25
    assert calculate_sub_index("PM2.5", 30.0) == 50
    # Satisfactory (31-60 -> 51-100)
    assert calculate_sub_index("PM2.5", 45.0) == 75
    # Very Poor (121-250 -> 301-400)
    assert calculate_sub_index("PM2.5", 185.0) == 350
    # Severe (>250)
    assert calculate_sub_index("PM2.5", 300.0) == 450

def test_pm10_sub_indices():
    assert calculate_sub_index("PM10", 25.0) == 25
    assert calculate_sub_index("PM10", 175.0) == 150
    assert calculate_sub_index("PM10", 300.0) == 250

def test_aqi_category_mapping():
    assert get_aqi_category(25) == CpcbCategory.GOOD
    assert get_aqi_category(75) == CpcbCategory.SATISFACTORY
    assert get_aqi_category(150) == CpcbCategory.MODERATE
    assert get_aqi_category(250) == CpcbCategory.POOR
    assert get_aqi_category(350) == CpcbCategory.VERY_POOR
    assert get_aqi_category(450) == CpcbCategory.SEVERE

def test_compute_aqi_from_pollutants():
    # PM2.5 = 185 (sub-index 350), PM10 = 100 (sub-index 100)
    aqi, cat, dom = compute_aqi_from_pollutants({"PM2.5": 185.0, "PM10": 100.0})
    assert aqi == 350
    assert cat == CpcbCategory.VERY_POOR
    assert dom == "PM2.5"

@pytest.mark.parametrize("category,audience,expected_verdict", [
    # GOOD
    (CpcbCategory.GOOD, Audience.GENERAL, Verdict.SAFE),
    (CpcbCategory.GOOD, Audience.CHILDREN_SCHOOL, Verdict.SAFE),
    (CpcbCategory.GOOD, Audience.SENSITIVE, Verdict.SAFE),
    # SATISFACTORY
    (CpcbCategory.SATISFACTORY, Audience.GENERAL, Verdict.SAFE),
    (CpcbCategory.SATISFACTORY, Audience.CHILDREN_SCHOOL, Verdict.SAFE),
    (CpcbCategory.SATISFACTORY, Audience.SENSITIVE, Verdict.LIMIT_OUTDOOR),
    # MODERATE
    (CpcbCategory.MODERATE, Audience.GENERAL, Verdict.SAFE),
    (CpcbCategory.MODERATE, Audience.CHILDREN_SCHOOL, Verdict.LIMIT_OUTDOOR),
    (CpcbCategory.MODERATE, Audience.SENSITIVE, Verdict.AVOID_OUTDOOR),
    # POOR
    (CpcbCategory.POOR, Audience.GENERAL, Verdict.LIMIT_OUTDOOR),
    (CpcbCategory.POOR, Audience.CHILDREN_SCHOOL, Verdict.AVOID_OUTDOOR),
    (CpcbCategory.POOR, Audience.SENSITIVE, Verdict.STAY_INDOORS),
    # VERY POOR
    (CpcbCategory.VERY_POOR, Audience.GENERAL, Verdict.AVOID_OUTDOOR),
    (CpcbCategory.VERY_POOR, Audience.CHILDREN_SCHOOL, Verdict.STAY_INDOORS),
    (CpcbCategory.VERY_POOR, Audience.SENSITIVE, Verdict.STAY_INDOORS),
    # SEVERE
    (CpcbCategory.SEVERE, Audience.GENERAL, Verdict.STAY_INDOORS),
    (CpcbCategory.SEVERE, Audience.CHILDREN_SCHOOL, Verdict.STAY_INDOORS),
    (CpcbCategory.SEVERE, Audience.SENSITIVE, Verdict.STAY_INDOORS),
])
def test_all_18_verdict_combinations(category, audience, expected_verdict):
    result = evaluate_verdict(category, audience)
    assert result["verdict"] == expected_verdict.value
    assert result["category"] == category.value
    assert result["audience"] == audience.value
    assert "disclaimer" in result
    assert "officialHealthStatement" in result
    assert "plainLanguageRecommendation" in result
