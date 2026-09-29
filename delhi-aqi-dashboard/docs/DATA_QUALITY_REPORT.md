# CPCB Delhi Dataset Quality Profile Report

**Generated on**: 2026-09-22 12:22:10
**Source Station**: IHBAS, Dilshad Garden, Delhi - CPCB
**City**: Delhi, Delhi
**Time Range**: `2024-01-01 00:00:00` to `2025-12-31 23:45:00`
**Frequency**: 15-minute observations

---

## 1. Summary Statistics

| Metric | Value |
|---|---|
| Total Raw Rows | **70,177** |
| Valid Observations | **70,176** |
| Malformed / Header Boundary Rows Removed | **1** |
| Duplicate Timestamps | **0** |
| Total Calendar Days Monitored | **731** |
| Days with Sufficient Coverage (≥60 obs/day) | **731** |
| Days with Sparse Coverage (<60 obs/day) | **0** |

---

## 2. Pollutant Profiling & Missing Data Analysis

| Pollutant | Raw Column | Missing Count | Missing % | Negative Count | Min | Mean | Max |
|---|---|---|---|---|---|---|---|
| **PM2.5** | `PM2.5 (ug/m3)` | 7,792 | 11.1% | 0 | 5.0 | 75.81 | 889.9 |
| **PM10** | `PM10 (ug/m3)` | 7,590 | 10.82% | 0 | 6.2 | 166.31 | 940.6 |
| **NO2** | `NO2 (ug/m3)` | 7,029 | 10.02% | 0 | 0.01 | 38.05 | 469.51 |
| **SO2** | `SO2 (ug/m3)` | 8,127 | 11.58% | 0 | 0.2 | 14.27 | 198.81 |
| **CO** | `CO (mg/m3)` | 9,510 | 13.55% | 0 | 0.0 | 1.24 | 9.95 |
| **O3** | `Ozone (ug/m3)` | 6,046 | 8.62% | 0 | 0.36 | 21.35 | 282.73 |
| **NH3** | `NH3 (ug/m3)` | 6,873 | 9.79% | 0 | 0.01 | 29.74 | 300.21 |

---

## 3. Imputation & Preprocessing Policy

> [!IMPORTANT]
> **No Synthetic Measurements**:
> No synthetic or fabricated measurements are generated. Missing timestamps in 15-minute intervals are aggregated to hourly averages when at least 2 valid readings exist in that hour. Daily averages are computed from hourly averages with minimum 16 valid hours per day as required by CPCB protocol. For ML lag features, forward-filling of recent valid historical steps is used without future-data leakage.
