"""
profile_dataset.py
Profiles the raw CPCB Delhi dataset (IHBAS, Dilshad Garden, 2024-01-01 to 2025-12-31).
Generates structured data quality metrics and documentation.
"""

import os
import json
from datetime import datetime
import pandas as pd
import numpy as np

RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "delhi_cpcb_ihbas_2024_2025.csv")
REPORT_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "data_quality_report.json")
REPORT_MD_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "DATA_QUALITY_REPORT.md")

POLLUTANT_COLS = {
    "PM2.5 (ug/m3)": "PM2.5",
    "PM10 (ug/m3)": "PM10",
    "NO2 (ug/m3)": "NO2",
    "SO2 (ug/m3)": "SO2",
    "CO (mg/m3)": "CO",
    "Ozone (ug/m3)": "O3",
    "NH3 (ug/m3)": "NH3"
}

def profile():
    print(f"Reading raw data from: {RAW_PATH} ...")
    df = pd.read_csv(RAW_PATH, low_memory=False)
    
    total_raw_rows = len(df)
    total_cols = len(df.columns)
    columns_list = list(df.columns)
    
    print(f"Total raw rows: {total_raw_rows}, columns: {total_cols}")
    
    # Identify invalid/header rows where Timestamp is null or non-string
    timestamp_nulls = int(df["Timestamp"].isna().sum())
    valid_ts_mask = df["Timestamp"].notna()
    
    # Check parseable timestamps
    parsed_timestamps = pd.to_datetime(df.loc[valid_ts_mask, "Timestamp"], errors="coerce")
    invalid_ts_count = int(parsed_timestamps.isna().sum()) + timestamp_nulls
    
    valid_df = df[valid_ts_mask].copy()
    valid_df["parsed_dt"] = pd.to_datetime(valid_df["Timestamp"], errors="coerce")
    valid_df = valid_df.dropna(subset=["parsed_dt"]).sort_values("parsed_dt").reset_index(drop=True)
    
    min_date = valid_df["parsed_dt"].min().strftime("%Y-%m-%d %H:%M:%S")
    max_date = valid_df["parsed_dt"].max().strftime("%Y-%m-%d %H:%M:%S")
    
    duplicate_timestamps = int(valid_df.duplicated(subset=["parsed_dt"]).sum())
    
    # Profile pollutants
    pollutant_stats = {}
    for raw_col, clean_name in POLLUTANT_COLS.items():
        if raw_col in valid_df.columns:
            series = pd.to_numeric(valid_df[raw_col], errors="coerce")
            total_count = len(series)
            missing_count = int(series.isna().sum())
            missing_pct = round((missing_count / total_count) * 100, 2)
            negative_count = int((series < 0).sum())
            non_null = series.dropna()
            
            pollutant_stats[clean_name] = {
                "raw_column": raw_col,
                "total_observations": total_count,
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "negative_count": negative_count,
                "min": round(float(non_null.min()), 2) if len(non_null) else None,
                "max": round(float(non_null.max()), 2) if len(non_null) else None,
                "mean": round(float(non_null.mean()), 2) if len(non_null) else None,
                "median": round(float(non_null.median()), 2) if len(non_null) else None
            }
    
    # Group by calendar date to evaluate daily observation counts
    valid_df["date"] = valid_df["parsed_dt"].dt.date
    daily_counts = valid_df.groupby("date").size()
    total_days = len(daily_counts)
    # Expected observations per day at 15-minute frequency: 24 * 4 = 96
    expected_obs_per_day = 96
    days_with_sufficient_data = int((daily_counts >= 60).sum()) # at least ~60% of 96 observations
    days_with_sparse_data = int((daily_counts < 60).sum())
    
    report = {
        "dataset_name": "CPCB Delhi Ambient Air Quality Dataset (IHBAS, Dilshad Garden)",
        "station_name": str(valid_df["Station Name"].dropna().iloc[0]) if "Station Name" in valid_df.columns else "IHBAS, Dilshad Garden",
        "station_id": str(valid_df["Station ID"].dropna().iloc[0]) if "Station ID" in valid_df.columns else "site_114",
        "city": "Delhi",
        "state": "Delhi",
        "total_raw_rows": total_raw_rows,
        "total_columns": total_cols,
        "valid_rows": len(valid_df),
        "invalid_or_header_rows": invalid_ts_count,
        "start_timestamp": min_date,
        "end_timestamp": max_date,
        "frequency": "15-minute observations",
        "duplicate_timestamps": duplicate_timestamps,
        "total_calendar_days": total_days,
        "days_sufficient_data": days_with_sufficient_data,
        "days_sparse_data": days_with_sparse_data,
        "pollutant_summary": pollutant_stats,
        "imputation_policy": (
            "No synthetic or fabricated measurements are generated. Missing timestamps in 15-minute intervals "
            "are aggregated to hourly averages when at least 2 valid readings exist in that hour. "
            "Daily averages are computed from hourly averages with minimum 16 valid hours per day as required by CPCB protocol. "
            "For ML lag features, forward-filling of recent valid historical steps is used without future-data leakage."
        )
    }
    
    os.makedirs(os.path.dirname(REPORT_JSON_PATH), exist_ok=True)
    with open(REPORT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Quality report JSON written to: {REPORT_JSON_PATH}")
    
    # Write Markdown version
    os.makedirs(os.path.dirname(REPORT_MD_PATH), exist_ok=True)
    md_content = f"""# CPCB Delhi Dataset Quality Profile Report

**Generated on**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Source Station**: {report['station_name']}
**City**: {report['city']}, {report['state']}
**Time Range**: `{report['start_timestamp']}` to `{report['end_timestamp']}`
**Frequency**: {report['frequency']}

---

## 1. Summary Statistics

| Metric | Value |
|---|---|
| Total Raw Rows | **{report['total_raw_rows']:,}** |
| Valid Observations | **{report['valid_rows']:,}** |
| Malformed / Header Boundary Rows Removed | **{report['invalid_or_header_rows']}** |
| Duplicate Timestamps | **{report['duplicate_timestamps']}** |
| Total Calendar Days Monitored | **{report['total_calendar_days']}** |
| Days with Sufficient Coverage (≥60 obs/day) | **{report['days_sufficient_data']}** |
| Days with Sparse Coverage (<60 obs/day) | **{report['days_sparse_data']}** |

---

## 2. Pollutant Profiling & Missing Data Analysis

| Pollutant | Raw Column | Missing Count | Missing % | Negative Count | Min | Mean | Max |
|---|---|---|---|---|---|---|---|
"""
    for pol, stats in pollutant_stats.items():
        md_content += f"| **{pol}** | `{stats['raw_column']}` | {stats['missing_count']:,} | {stats['missing_pct']}% | {stats['negative_count']} | {stats['min']} | {stats['mean']} | {stats['max']} |\n"

    md_content += f"""
---

## 3. Imputation & Preprocessing Policy

> [!IMPORTANT]
> **No Synthetic Measurements**:
> {report['imputation_policy']}
"""

    with open(REPORT_MD_PATH, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Quality report Markdown written to: {REPORT_MD_PATH}")

if __name__ == "__main__":
    profile()
