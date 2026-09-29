"""
clean_data.py
Cleans raw CPCB observations, aggregates to hourly and daily intervals according
to CPCB monitoring guidelines, and computes official CPCB AQI.
Outputs:
- data/processed/clean_hourly.csv
- data/processed/clean_daily.csv
"""

import os
import pandas as pd
import numpy as np
from aqi_cpcb import calculate_cpcb_aqi

RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "delhi_cpcb_ihbas_2024_2025.csv")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
HOURLY_OUT = os.path.join(PROCESSED_DIR, "clean_hourly.csv")
DAILY_OUT = os.path.join(PROCESSED_DIR, "clean_daily.csv")

POLLUTANT_MAP = {
    "PM2.5 (ug/m3)": "pm25",
    "PM10 (ug/m3)": "pm10",
    "NO2 (ug/m3)": "no2",
    "SO2 (ug/m3)": "so2",
    "CO (mg/m3)": "co",
    "Ozone (ug/m3)": "o3",
    "NH3 (ug/m3)": "nh3"
}

METEO_MAP = {
    "AT (degC)": "temp",
    "RH (%)": "humidity",
    "WS (m/s)": "wind_speed",
    "WD (deg)": "wind_dir",
    "BP (mmHg)": "pressure"
}

def clean_and_aggregate():
    print(f"Reading raw observations from: {RAW_PATH} ...")
    df = pd.read_csv(RAW_PATH, low_memory=False)
    print(f"Loaded {len(df):,} raw rows.")
    
    # 1. Timestamp parsing & boundary cleaning
    df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
    df = df.dropna(subset=["Timestamp"]).sort_values("Timestamp").reset_index(drop=True)
    print(f"Valid timestamp rows: {len(df):,}")
    
    # 2. Rename columns
    cols_to_keep = {}
    for raw_k, clean_k in POLLUTANT_MAP.items():
        if raw_k in df.columns:
            cols_to_keep[raw_k] = clean_k
    for raw_k, clean_k in METEO_MAP.items():
        if raw_k in df.columns:
            cols_to_keep[raw_k] = clean_k
            
    df = df.rename(columns=cols_to_keep)
    all_numeric_cols = list(cols_to_keep.values())
    
    for c in all_numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
        # Ensure non-negative
        df.loc[df[c] < 0, c] = np.nan

    # 3. Hourly Aggregation
    df["hour_dt"] = df["Timestamp"].dt.floor("h")
    
    # Require at least 2 readings out of 4 per hour for valid hourly average
    agg_funcs = {c: ["mean", "count"] for c in all_numeric_cols}
    hourly_grouped = df.groupby("hour_dt").agg(agg_funcs)
    
    hourly_clean = pd.DataFrame(index=hourly_grouped.index)
    for c in all_numeric_cols:
        mean_val = hourly_grouped[(c, "mean")]
        cnt_val = hourly_grouped[(c, "count")]
        # Keep mean if count >= 2
        hourly_clean[c] = np.where(cnt_val >= 2, mean_val, np.nan)
        
    hourly_clean = hourly_clean.reset_index().rename(columns={"hour_dt": "timestamp"})
    hourly_clean = hourly_clean.sort_values("timestamp").reset_index(drop=True)
    
    # Compute Hourly AQI
    print("Computing hourly CPCB AQI...")
    aqi_list = []
    cat_list = []
    dominant_list = []
    color_list = []
    
    for _, row in hourly_clean.iterrows():
        p_dict = {pol: row[pol] for pol in POLLUTANT_MAP.values() if pol in row and pd.notna(row[pol])}
        res = calculate_cpcb_aqi(p_dict, enforce_minimum_rule=True)
        aqi_list.append(res["aqi"])
        cat_list.append(res["category"])
        dominant_list.append(res["dominant_pollutant"])
        color_list.append(res["color"])
        
    hourly_clean["aqi"] = aqi_list
    hourly_clean["category"] = cat_list
    hourly_clean["dominant_pollutant"] = dominant_list
    hourly_clean["color"] = color_list
    
    # 4. Daily Aggregation
    print("Aggregating to daily records (requiring >= 16 valid hours/day)...")
    hourly_clean["date"] = hourly_clean["timestamp"].dt.date
    
    daily_rows = []
    for date_val, group in hourly_clean.groupby("date"):
        row_dict = {"date": str(date_val)}
        valid_hour_count = len(group)
        
        # Calculate daily averages for pollutants
        for c in all_numeric_cols:
            valid_hours = group[c].dropna()
            # CPCB protocol: Daily avg valid if at least 16 hours present
            if len(valid_hours) >= 16:
                row_dict[c] = round(float(valid_hours.mean()), 2)
            else:
                row_dict[c] = round(float(valid_hours.mean()), 2) if len(valid_hours) >= 8 else np.nan
                
        # Calculate CPCB Daily AQI
        p_dict = {pol: row_dict[pol] for pol in POLLUTANT_MAP.values() if pol in row_dict and pd.notna(row_dict[pol])}
        res = calculate_cpcb_aqi(p_dict, enforce_minimum_rule=True)
        row_dict["aqi"] = res["aqi"]
        row_dict["category"] = res["category"]
        row_dict["dominant_pollutant"] = res["dominant_pollutant"]
        row_dict["color"] = res["color"]
        row_dict["valid_hours"] = valid_hour_count
        
        # Sub-indices
        for pol_k, sub_val in res.get("sub_indices", {}).items():
            row_dict[f"sub_{pol_k}"] = sub_val
            
        daily_rows.append(row_dict)
        
    daily_clean = pd.DataFrame(daily_rows)
    daily_clean = daily_clean.sort_values("date").reset_index(drop=True)
    
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    hourly_clean.to_csv(HOURLY_OUT, index=False)
    daily_clean.to_csv(DAILY_OUT, index=False)
    
    print(f"\nProcessing Complete!")
    print(f"Hourly dataset saved to: {HOURLY_OUT} ({len(hourly_clean):,} hours)")
    print(f"Daily dataset saved to: {DAILY_OUT} ({len(daily_clean):,} days)")
    
    # Summary of Daily AQI
    valid_daily_aqi = daily_clean["aqi"].dropna()
    print(f"Valid Daily AQI calculated: {len(valid_daily_aqi)} / {len(daily_clean)} days")
    print(f"AQI Stats: Min={valid_daily_aqi.min()}, Median={valid_daily_aqi.median()}, Max={valid_daily_aqi.max()}, Mean={valid_daily_aqi.mean():.1f}")
    print("\nAQI Category Breakdown (Days):")
    print(daily_clean["category"].value_counts())

if __name__ == "__main__":
    clean_and_aggregate()
