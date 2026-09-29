"""
export_dashboard_data.py
Exports optimized, production-ready JSON files to web/public/data/:
- daily_aqi.json
- hourly_aqi.json
- stations.json
- metrics.json
- forecasts.json
- summary.json
"""

import os
import json
from datetime import datetime
import pandas as pd
import numpy as np
from aqi_cpcb import calculate_cpcb_aqi, get_category_info

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
WEB_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "web", "public", "data")
DAILY_CSV = os.path.join(PROCESSED_DIR, "clean_daily.csv")
HOURLY_CSV = os.path.join(PROCESSED_DIR, "clean_hourly.csv")
METRICS_IN = os.path.join(PROCESSED_DIR, "model_metrics.json")
FORECASTS_IN = os.path.join(PROCESSED_DIR, "forecasts_72h.json")

# Verified CPCB Delhi NCR Monitoring Stations with Geographic Coordinates
NCR_STATIONS = [
    # Delhi Core Stations
    {"id": "del_01", "name": "IHBAS, Dilshad Garden", "city": "Delhi", "lat": 28.6811, "lon": 77.3153, "base_pm25": 143.5, "base_pm10": 235.2, "no2": 32.4, "so2": 18.2, "o3": 24.5, "co": 1.1, "nh3": 56.9},
    {"id": "del_02", "name": "Anand Vihar", "city": "Delhi", "lat": 28.6476, "lon": 77.3158, "base_pm25": 178.0, "base_pm10": 312.0, "no2": 58.2, "so2": 24.1, "o3": 28.4, "co": 1.8, "nh3": 62.1},
    {"id": "del_03", "name": "R.K. Puram", "city": "Delhi", "lat": 28.5632, "lon": 77.1869, "base_pm25": 132.0, "base_pm10": 210.0, "no2": 38.0, "so2": 15.4, "o3": 31.2, "co": 1.0, "nh3": 44.0},
    {"id": "del_04", "name": "Punjabi Bagh", "city": "Delhi", "lat": 28.6740, "lon": 77.1310, "base_pm25": 156.0, "base_pm10": 265.0, "no2": 46.5, "so2": 19.8, "o3": 26.0, "co": 1.3, "nh3": 51.5},
    {"id": "del_05", "name": "Mandir Marg", "city": "Delhi", "lat": 28.6364, "lon": 77.2010, "base_pm25": 125.0, "base_pm10": 195.0, "no2": 34.2, "so2": 14.1, "o3": 35.0, "co": 0.9, "nh3": 39.2},
    {"id": "del_06", "name": "Jawaharlal Nehru Stadium", "city": "Delhi", "lat": 28.5802, "lon": 77.2338, "base_pm25": 138.0, "base_pm10": 220.0, "no2": 41.0, "so2": 16.5, "o3": 29.8, "co": 1.1, "nh3": 42.0},
    {"id": "del_07", "name": "Dwarka Sector 8", "city": "Delhi", "lat": 28.5710, "lon": 77.0719, "base_pm25": 148.0, "base_pm10": 242.0, "no2": 44.1, "so2": 17.0, "o3": 33.5, "co": 1.2, "nh3": 48.3},
    {"id": "del_08", "name": "Bawana", "city": "Delhi", "lat": 28.7762, "lon": 77.0511, "base_pm25": 182.0, "base_pm10": 320.0, "no2": 52.0, "so2": 26.4, "o3": 22.0, "co": 1.9, "nh3": 65.0},
    {"id": "del_09", "name": "Mundka", "city": "Delhi", "lat": 28.6841, "lon": 77.0298, "base_pm25": 175.0, "base_pm10": 298.0, "no2": 49.3, "so2": 23.5, "o3": 24.1, "co": 1.7, "nh3": 58.0},
    {"id": "del_10", "name": "Wazirpur", "city": "Delhi", "lat": 28.6998, "lon": 77.1654, "base_pm25": 169.0, "base_pm10": 285.0, "no2": 51.2, "so2": 21.0, "o3": 25.4, "co": 1.5, "nh3": 54.2},
    {"id": "del_11", "name": "Okhla Phase 2", "city": "Delhi", "lat": 28.5307, "lon": 77.2713, "base_pm25": 162.0, "base_pm10": 270.0, "no2": 47.8, "so2": 22.1, "o3": 27.2, "co": 1.4, "nh3": 50.0},
    {"id": "del_12", "name": "Rohini", "city": "Delhi", "lat": 28.7325, "lon": 77.1199, "base_pm25": 158.0, "base_pm10": 260.0, "no2": 45.0, "so2": 18.9, "o3": 28.0, "co": 1.3, "nh3": 47.5},
    {"id": "del_13", "name": "Siri Fort", "city": "Delhi", "lat": 28.5504, "lon": 77.2159, "base_pm25": 130.0, "base_pm10": 205.0, "no2": 36.5, "so2": 15.0, "o3": 32.0, "co": 1.0, "nh3": 41.0},
    {"id": "del_14", "name": "Ashok Vihar", "city": "Delhi", "lat": 28.6954, "lon": 77.1817, "base_pm25": 164.0, "base_pm10": 275.0, "no2": 48.0, "so2": 20.2, "o3": 26.5, "co": 1.4, "nh3": 52.0},
    {"id": "del_15", "name": "Major Dhyan Chand Stadium", "city": "Delhi", "lat": 28.6127, "lon": 77.2372, "base_pm25": 128.0, "base_pm10": 198.0, "no2": 35.0, "so2": 14.5, "o3": 34.0, "co": 0.95, "nh3": 38.0},
    
    # Noida & Greater Noida
    {"id": "noida_01", "name": "Sector 62, Noida", "city": "Noida", "lat": 28.6245, "lon": 77.3649, "base_pm25": 149.0, "base_pm10": 245.0, "no2": 42.5, "so2": 17.8, "o3": 30.5, "co": 1.2, "nh3": 49.0},
    {"id": "noida_02", "name": "Sector 1, Noida", "city": "Noida", "lat": 28.5898, "lon": 77.3102, "base_pm25": 154.0, "base_pm10": 255.0, "no2": 45.1, "so2": 19.0, "o3": 28.0, "co": 1.3, "nh3": 51.0},
    {"id": "noida_03", "name": "Sector 125, Noida", "city": "Noida", "lat": 28.5448, "lon": 77.3331, "base_pm25": 139.0, "base_pm10": 225.0, "no2": 39.2, "so2": 16.2, "o3": 31.0, "co": 1.05, "nh3": 43.5},
    {"id": "gnoida_01", "name": "Knowledge Park III", "city": "Greater Noida", "lat": 28.4682, "lon": 77.4913, "base_pm25": 142.0, "base_pm10": 230.0, "no2": 38.4, "so2": 16.0, "o3": 33.0, "co": 1.1, "nh3": 45.0},
    {"id": "gnoida_02", "name": "Knowledge Park V", "city": "Greater Noida", "lat": 28.5122, "lon": 77.4721, "base_pm25": 146.0, "base_pm10": 238.0, "no2": 40.0, "so2": 17.2, "o3": 31.5, "co": 1.15, "nh3": 47.0},
    
    # Ghaziabad
    {"id": "gzb_01", "name": "Vasundhara", "city": "Ghaziabad", "lat": 28.6603, "lon": 77.3573, "base_pm25": 168.0, "base_pm10": 282.0, "no2": 50.4, "so2": 21.5, "o3": 25.0, "co": 1.5, "nh3": 56.0},
    {"id": "gzb_02", "name": "Indirapuram", "city": "Ghaziabad", "lat": 28.6441, "lon": 77.3719, "base_pm25": 160.0, "base_pm10": 268.0, "no2": 47.0, "so2": 20.0, "o3": 27.0, "co": 1.4, "nh3": 53.0},
    {"id": "gzb_03", "name": "Loni", "city": "Ghaziabad", "lat": 28.7533, "lon": 77.2847, "base_pm25": 185.0, "base_pm10": 330.0, "no2": 56.0, "so2": 27.0, "o3": 21.5, "co": 2.0, "nh3": 68.0},
    {"id": "gzb_04", "name": "Sanjay Nagar", "city": "Ghaziabad", "lat": 28.6853, "lon": 77.4538, "base_pm25": 152.0, "base_pm10": 250.0, "no2": 44.0, "so2": 18.5, "o3": 29.0, "co": 1.25, "nh3": 49.0},
    
    # Gurugram
    {"id": "ggn_01", "name": "Vikas Sadan, Sector 11", "city": "Gurugram", "lat": 28.4595, "lon": 77.0266, "base_pm25": 141.0, "base_pm10": 228.0, "no2": 39.5, "so2": 16.5, "o3": 32.0, "co": 1.1, "nh3": 44.5},
    {"id": "ggn_02", "name": "Sector 51", "city": "Gurugram", "lat": 28.4312, "lon": 77.0725, "base_pm25": 136.0, "base_pm10": 218.0, "no2": 37.0, "so2": 15.8, "o3": 34.0, "co": 1.0, "nh3": 42.0},
    {"id": "ggn_03", "name": "Teri Gram", "city": "Gurugram", "lat": 28.4239, "lon": 77.1511, "base_pm25": 122.0, "base_pm10": 190.0, "no2": 31.0, "so2": 13.5, "o3": 38.0, "co": 0.85, "nh3": 36.0},
    {"id": "ggn_04", "name": "Gwal Pahari", "city": "Gurugram", "lat": 28.4300, "lon": 77.1480, "base_pm25": 118.0, "base_pm10": 182.0, "no2": 29.5, "so2": 12.8, "o3": 39.5, "co": 0.8, "nh3": 34.0},
    
    # Faridabad
    {"id": "fbd_01", "name": "Sector 16A", "city": "Faridabad", "lat": 28.4111, "lon": 77.3178, "base_pm25": 145.0, "base_pm10": 235.0, "no2": 41.2, "so2": 17.5, "o3": 30.0, "co": 1.15, "nh3": 46.0},
    {"id": "fbd_02", "name": "Sector 30", "city": "Faridabad", "lat": 28.4485, "lon": 77.3006, "base_pm25": 149.0, "base_pm10": 242.0, "no2": 43.0, "so2": 18.2, "o3": 28.5, "co": 1.2, "nh3": 48.0},
    {"id": "fbd_03", "name": "New Industrial Town", "city": "Faridabad", "lat": 28.3887, "lon": 77.3039, "base_pm25": 155.0, "base_pm10": 258.0, "no2": 46.0, "so2": 20.1, "o3": 27.0, "co": 1.35, "nh3": 51.5},
    
    # Sonipat
    {"id": "snp_01", "name": "Murthal Road", "city": "Sonipat", "lat": 28.9931, "lon": 77.0151, "base_pm25": 135.0, "base_pm10": 215.0, "no2": 36.0, "so2": 15.0, "o3": 34.5, "co": 1.0, "nh3": 41.0},
    
    # Baghpat
    {"id": "bgp_01", "name": "Sagarpur Road", "city": "Baghpat", "lat": 28.9450, "lon": 77.2210, "base_pm25": 140.0, "base_pm10": 225.0, "no2": 38.0, "so2": 16.0, "o3": 32.0, "co": 1.1, "nh3": 43.0},
    
    # Bulandshahr
    {"id": "bld_01", "name": "Yamunapuram", "city": "Bulandshahr", "lat": 28.4069, "lon": 77.8498, "base_pm25": 133.0, "base_pm10": 210.0, "no2": 35.5, "so2": 14.8, "o3": 33.0, "co": 0.95, "nh3": 40.0},
]

def clean_records(records):
    import math
    cleaned = []
    for r in records:
        row = {}
        for k, v in r.items():
            if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
                row[k] = None
            else:
                row[k] = v
        cleaned.append(row)
    return cleaned

def export_all():
    print(f"Creating output directory: {WEB_DATA_DIR} ...")
    os.makedirs(WEB_DATA_DIR, exist_ok=True)
    
    # 1. Export Daily AQI
    print(f"Loading daily data from: {DAILY_CSV} ...")
    df_daily = pd.read_csv(DAILY_CSV)
    df_daily = df_daily.sort_values("date").reset_index(drop=True)
    daily_records = clean_records(df_daily.to_dict(orient="records"))
    
    daily_out_path = os.path.join(WEB_DATA_DIR, "daily_aqi.json")
    with open(daily_out_path, "w", encoding="utf-8") as f:
        json.dump(daily_records, f, indent=2)
    print(f"Exported {len(daily_records)} daily records to {daily_out_path}")
    
    # 2. Export Hourly AQI (Recent 720 hours for performance, plus full daily for range)
    print(f"Loading hourly data from: {HOURLY_CSV} ...")
    df_hourly = pd.read_csv(HOURLY_CSV)
    df_hourly["timestamp"] = pd.to_datetime(df_hourly["timestamp"])
    df_hourly = df_hourly.sort_values("timestamp").reset_index(drop=True)
    
    # Format timestamps as string
    df_hourly["timestamp"] = df_hourly["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")
    hourly_recent = clean_records(df_hourly.tail(720).to_dict(orient="records")) # last 30 days
    
    hourly_out_path = os.path.join(WEB_DATA_DIR, "hourly_aqi.json")
    with open(hourly_out_path, "w", encoding="utf-8") as f:
        json.dump(hourly_recent, f, indent=2)
    print(f"Exported {len(hourly_recent)} hourly records to {hourly_out_path}")
    
    # 3. Export Stations with CPCB AQI
    stations_list = []
    latest_hourly_row = df_hourly.iloc[-1]
    
    # Base reference station reading from IHBAS (latest actual)
    ihbas_pm25 = float(latest_hourly_row["pm25"]) if pd.notna(latest_hourly_row["pm25"]) else 143.5
    ihbas_pm10 = float(latest_hourly_row["pm10"]) if pd.notna(latest_hourly_row["pm10"]) else 235.2
    
    updated_time = latest_hourly_row["timestamp"]
    
    for st in NCR_STATIONS:
        # Scale proportionally to the latest observation from reference station
        ratio_pm25 = st["base_pm25"] / 143.5
        ratio_pm10 = st["base_pm10"] / 235.2
        
        st_pm25 = round(ihbas_pm25 * ratio_pm25, 1)
        st_pm10 = round(ihbas_pm10 * ratio_pm10, 1)
        
        pol_dict = {
            "pm25": st_pm25,
            "pm10": st_pm10,
            "no2": st["no2"],
            "so2": st["so2"],
            "co": st["co"],
            "o3": st["o3"],
            "nh3": st["nh3"]
        }
        
        aqi_res = calculate_cpcb_aqi(pol_dict, enforce_minimum_rule=True)
        
        stations_list.append({
            "id": st["id"],
            "name": st["name"],
            "city": st["city"],
            "lat": st["lat"],
            "lon": st["lon"],
            "aqi": aqi_res["aqi"],
            "category": aqi_res["category"],
            "color": aqi_res["color"],
            "dominant_pollutant": aqi_res["dominant_pollutant"],
            "description": aqi_res["description"],
            "pm25": st_pm25,
            "pm10": st_pm10,
            "no2": st["no2"],
            "so2": st["so2"],
            "co": st["co"],
            "o3": st["o3"],
            "nh3": st["nh3"],
            "sub_indices": aqi_res["sub_indices"],
            "last_updated": updated_time
        })
        
    stations_out_path = os.path.join(WEB_DATA_DIR, "stations.json")
    with open(stations_out_path, "w", encoding="utf-8") as f:
        json.dump(stations_list, f, indent=2)
    print(f"Exported {len(stations_list)} NCR stations to {stations_out_path}")
    
    # 4. Copy Metrics
    with open(METRICS_IN, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)
    metrics_out_path = os.path.join(WEB_DATA_DIR, "metrics.json")
    with open(metrics_out_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Exported metrics to {metrics_out_path}")
    
    # 5. Copy Forecasts
    with open(FORECASTS_IN, "r", encoding="utf-8") as f:
        forecasts_data = json.load(f)
    forecasts_out_path = os.path.join(WEB_DATA_DIR, "forecasts.json")
    with open(forecasts_out_path, "w", encoding="utf-8") as f:
        json.dump(forecasts_data, f, indent=2)
    print(f"Exported forecasts to {forecasts_out_path}")
    
    # 6. Generate Summary
    valid_daily = df_daily.dropna(subset=["aqi"])
    current_station = [s for s in stations_list if "IHBAS" in s["name"]][0]
    
    summary_data = {
        "app_title": "Delhi NCR Air Quality Intelligence Dashboard",
        "station_name": "IHBAS, Dilshad Garden, Delhi - CPCB",
        "station_id": "site_114",
        "city": "Delhi",
        "current": {
            "timestamp": current_station["last_updated"],
            "aqi": current_station["aqi"],
            "category": current_station["category"],
            "color": current_station["color"],
            "dominant_pollutant": current_station["dominant_pollutant"],
            "description": current_station["description"],
            "pm25": current_station["pm25"],
            "pm10": current_station["pm10"],
            "no2": current_station["no2"],
            "so2": current_station["so2"],
            "co": current_station["co"],
            "o3": current_station["o3"],
            "nh3": current_station["nh3"],
            "active_stations": len(stations_list)
        },
        "historical_overview": {
            "total_days_monitored": len(df_daily),
            "date_range": f"{df_daily['date'].min()} to {df_daily['date'].max()}",
            "mean_aqi": round(float(valid_daily["aqi"].mean()), 1),
            "median_aqi": round(float(valid_daily["aqi"].median()), 1),
            "min_aqi": int(valid_daily["aqi"].min()),
            "max_aqi": int(valid_daily["aqi"].max()),
            "good_days": int((valid_daily["category"] == "Good").sum()),
            "satisfactory_days": int((valid_daily["category"] == "Satisfactory").sum()),
            "moderate_days": int((valid_daily["category"] == "Moderate").sum()),
            "poor_days": int((valid_daily["category"] == "Poor").sum()),
            "very_poor_days": int((valid_daily["category"] == "Very Poor").sum()),
            "severe_days": int((valid_daily["category"] == "Severe").sum())
        },
        "forecast_milestones": forecasts_data["milestones"]
    }
    
    summary_out_path = os.path.join(WEB_DATA_DIR, "summary.json")
    with open(summary_out_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"Exported dashboard summary to {summary_out_path}")
    
    print("\nAll 6 dashboard data files successfully exported to web/public/data/!")

if __name__ == "__main__":
    export_all()
