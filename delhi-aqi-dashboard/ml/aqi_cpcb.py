"""
aqi_cpcb.py
Official Indian Central Pollution Control Board (CPCB) National Air Quality Index (AQI) calculation.
Implements standard breakpoints, sub-index formulas, minimum pollutant rules, and categories.
"""

from typing import Dict, Optional, Tuple, Any

# CPCB Breakpoints: (B_low, B_high, I_low, I_high)
BREAKPOINTS = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 380.0, 401, 500),
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 510.0, 401, 500),
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 800.0, 401, 500),
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 380.0, 101, 200),
        (381.0, 800.0, 201, 300),
        (800.1, 1600.0, 301, 400),
        (1600.1, 3200.0, 401, 500),
    ],
    "co": [
        (0.0, 1.0, 0, 50),
        (1.01, 2.0, 51, 100),
        (2.01, 10.0, 101, 200),
        (10.01, 17.0, 201, 300),
        (17.01, 34.0, 301, 400),
        (34.01, 50.0, 401, 500),
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500),
    ],
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.1, 400.0, 51, 100),
        (400.1, 800.0, 101, 200),
        (800.1, 1200.0, 201, 300),
        (1200.1, 1800.0, 301, 400),
        (1800.1, 2400.0, 401, 500),
    ],
}

CATEGORY_INFO = [
    (0, 50, "Good", "#16a34a", "Minimal impact"),
    (51, 100, "Satisfactory", "#65a30d", "Minor breathing discomfort to sensitive people"),
    (101, 200, "Moderate", "#ca8a04", "Breathing discomfort to people with lungs, asthma and heart diseases"),
    (201, 300, "Poor", "#ea580c", "Breathing discomfort to most people on prolonged exposure"),
    (301, 400, "Very Poor", "#dc2626", "Respiratory illness on prolonged exposure"),
    (401, 500, "Severe", "#7f1d1d", "Affects healthy people and seriously impacts those with existing diseases"),
]

def round_half_up(val: float) -> int:
    """Standard half-up rounding consistent with CPCB standard and JS Math.round."""
    return int(val + 0.5) if val >= 0 else int(val - 0.5)

def get_category_info(aqi_value: float) -> Dict[str, str]:
    rounded = round_half_up(aqi_value)
    if rounded <= 50:
        return {"category": "Good", "color": "#16a34a", "description": "Minimal impact"}
    elif rounded <= 100:
        return {"category": "Satisfactory", "color": "#65a30d", "description": "Minor breathing discomfort to sensitive people"}
    elif rounded <= 200:
        return {"category": "Moderate", "color": "#ca8a04", "description": "Breathing discomfort to people with lungs, asthma and heart diseases"}
    elif rounded <= 300:
        return {"category": "Poor", "color": "#ea580c", "description": "Breathing discomfort to most people on prolonged exposure"}
    elif rounded <= 400:
        return {"category": "Very Poor", "color": "#dc2626", "description": "Respiratory illness on prolonged exposure"}
    else:
        return {"category": "Severe", "color": "#7f1d1d", "description": "Affects healthy people and seriously impacts those with existing diseases"}

def calculate_sub_index(pollutant: str, conc: Optional[float]) -> Optional[float]:
    """Calculates CPCB sub-index for a single pollutant concentration."""
    if conc is None or conc < 0:
        return None
    key = pollutant.lower().replace(".", "").replace(" ", "").replace("_", "")
    if key not in BREAKPOINTS:
        return None
        
    table = BREAKPOINTS[key]
    for (b_lo, b_hi, i_lo, i_hi) in table:
        if conc <= b_hi:
            # Linear interpolation formula:
            # I = I_low + ((I_high - I_low) / (B_high - B_low)) * (conc - B_low)
            # Ensure conc not lower than b_lo
            c_val = max(conc, b_lo)
            sub = i_lo + ((i_hi - i_lo) / (b_hi - b_lo)) * (c_val - b_lo)
            return round(sub, 1)
            
    # If conc exceeds the highest breakpoint:
    # Cap at 500 as per official CPCB ceiling
    return 500.0

def calculate_cpcb_aqi(pollutants: Dict[str, Optional[float]], enforce_minimum_rule: bool = True) -> Dict[str, Any]:
    """
    Computes overall CPCB AQI from a dictionary of pollutant concentrations.
    Keys can be 'pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'nh3' (case-insensitive).
    Returns dict with aqi, category, color, description, dominant_pollutant, sub_indices.
    """
    sub_indices = {}
    normalized = {}
    for k, v in pollutants.items():
        clean_k = k.lower().replace(".", "").replace(" ", "").replace("_", "")
        if v is not None:
            try:
                val = float(v)
                normalized[clean_k] = val
                sub = calculate_sub_index(clean_k, val)
                if sub is not None:
                    sub_indices[clean_k] = sub
            except (ValueError, TypeError):
                continue
                
    # CPCB Minimum Pollutant Condition:
    # Requires at least 3 pollutants with valid sub-indices,
    # out of which at least one MUST be PM2.5 or PM10.
    has_particulate = ("pm25" in sub_indices) or ("pm10" in sub_indices)
    has_sufficient = len(sub_indices) >= 3
    
    if enforce_minimum_rule and (not has_particulate or not has_sufficient):
        # If strict rule fails, return None for overall AQI but preserve sub_indices
        # If particulate is present and caller needs fallback (e.g. single sensor monitoring)
        return {
            "aqi": None,
            "category": "Insufficient Data",
            "color": "#9ca3af",
            "description": "Requires at least 3 pollutants including PM2.5 or PM10 as per CPCB criteria",
            "dominant_pollutant": None,
            "sub_indices": sub_indices,
            "is_valid_cpcb": False
        }
        
    if not sub_indices:
        return {
            "aqi": None,
            "category": "No Data",
            "color": "#9ca3af",
            "description": "No pollutant concentrations provided",
            "dominant_pollutant": None,
            "sub_indices": {},
            "is_valid_cpcb": False
        }

    # AQI is the max of the sub-indices
    dominant = max(sub_indices, key=sub_indices.get)
    max_sub = sub_indices[dominant]
    aqi = round_half_up(max_sub)
    cat_info = get_category_info(aqi)

    name_map = {
        "pm25": "PM2.5",
        "pm10": "PM10",
        "no2": "NO2",
        "so2": "SO2",
        "co": "CO",
        "o3": "Ozone (O3)",
        "nh3": "NH3"
    }

    return {
        "aqi": aqi,
        "category": cat_info["category"],
        "color": cat_info["color"],
        "description": cat_info["description"],
        "dominant_pollutant": name_map.get(dominant, dominant.upper()),
        "sub_indices": sub_indices,
        "is_valid_cpcb": True
    }

def run_tests():
    print("Running CPCB AQI Unit & Breakpoint Tests...")
    
    # Test 1: Known standard points
    assert calculate_sub_index("pm25", 15.0) == 25.0, f"PM2.5 15.0 expected 25.0, got {calculate_sub_index('pm25', 15.0)}"
    assert calculate_sub_index("pm25", 60.0) == 100.0, f"PM2.5 60.0 expected 100.0, got {calculate_sub_index('pm25', 60.0)}"
    assert calculate_sub_index("pm10", 50.0) == 50.0, f"PM10 50.0 expected 50.0, got {calculate_sub_index('pm10', 50.0)}"
    assert calculate_sub_index("pm10", 100.0) == 100.0, f"PM10 100.0 expected 100.0, got {calculate_sub_index('pm10', 100.0)}"
    assert calculate_sub_index("no2", 40.0) == 50.0
    assert calculate_sub_index("co", 1.0) == 50.0
    
    # Test 2: Composite AQI with at least 3 pollutants
    sample_reading = {
        "pm25": 143.0,
        "pm10": 214.0,
        "no2": 45.0,
        "so2": 15.0,
        "co": 1.1,
        "o3": 35.0,
        "nh3": 30.0
    }
    res = calculate_cpcb_aqi(sample_reading)
    print(f"Sample Reading AQI: {res['aqi']}, Category: {res['category']}, Dominant: {res['dominant_pollutant']}")
    assert res["is_valid_cpcb"] is True
    assert res["aqi"] is not None
    assert res["dominant_pollutant"] == "PM2.5"
    assert res["category"] == "Very Poor" # 143 ug/m3 in PM2.5 is in 121-250 range (301-400)
    
    # Test 3: Insufficient condition (only 2 non-particulate pollutants)
    insufficient = {"no2": 45.0, "so2": 15.0}
    res_insuf = calculate_cpcb_aqi(insufficient, enforce_minimum_rule=True)
    assert res_insuf["is_valid_cpcb"] is False
    
    print("ALL CPCB AQI Python Tests Passed Successfully!")

if __name__ == "__main__":
    run_tests()
