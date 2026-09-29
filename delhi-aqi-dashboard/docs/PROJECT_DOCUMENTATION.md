# Delhi NCR Air Quality Intelligence — Complete Project Documentation

## 1. Executive Summary

The **Delhi NCR Air Quality Intelligence Dashboard** provides an accessible, robust, and local-first environmental monitoring platform for Delhi and the National Capital Region (NCR). It combines:
- Official Central Pollution Control Board (CPCB) observational data.
- Strict mathematical implementation of the National Air Quality Index (NAQI) guidelines.
- Multi-horizon (24-hour, 48-hour, 72-hour) machine learning forecasts using Ridge Regression, Random Forest, and Gradient Boosting algorithms.
- Full interactive mapping and pollutant analysis across 9 NCR cities.

---

## 2. Architecture & Data Flow

```text
Raw CPCB Telemetry (70,177 rows)
           ↓
ml/profile_dataset.py (Data quality audit)
           ↓
ml/clean_data.py (ISO timestamp parsing, 1h & 24h aggregation, zero-leakage shifts)
           ↓
ml/aqi_cpcb.py (Official CPCB Sub-Index and NAQI calculations)
           ↓
ml/train_models.py (Chronological 80/20 train/test split, Ridge, RF, GB)
           ↓
ml/train_forecast_models.py (Recursive 72-hour forecasting from last actual T0)
           ↓
ml/export_dashboard_data.py (Optimized JSON outputs in web/public/data/)
           ↓
Next.js 14 Dashboard (Local-first, offline capable, Leaflet map, Recharts)
```

---

## 3. CPCB AQI Calculation Methodology

The Indian Central Pollution Control Board (CPCB) calculates the National Air Quality Index using piecewise linear interpolation across predefined pollutant concentration breakpoints:

$$I_p = I_{\text{lo}} + \frac{I_{\text{hi}} - I_{\text{lo}}}{B_{\text{hi}} - B_{\text{lo}}} \times (C_p - B_{\text{lo}})$$

Where:
- $C_p$: Measured pollutant concentration
- $B_{\text{lo}}, B_{\text{hi}}$: Lower and upper breakpoints for the concentration band
- $I_{\text{lo}}, I_{\text{hi}}$: Lower and upper sub-index values corresponding to the band
- $I_p$: Resulting sub-index

### CPCB Breakpoint Reference Matrix

| Sub-Index Band | Category | PM2.5 (24h) | PM10 (24h) | NO2 (24h) | SO2 (24h) | CO (8h, mg/m³) | O3 (8h) | NH3 (24h) |
|---|---|---|---|---|---|---|---|---|
| **0 – 50** | Good | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 40 | 0 – 1.0 | 0 – 50 | 0 – 200 |
| **51 – 100** | Satisfactory | 31 – 60 | 51 – 100 | 41 – 80 | 41 – 80 | 1.1 – 2.0 | 51 – 100 | 201 – 400 |
| **101 – 200** | Moderate | 61 – 90 | 101 – 250 | 81 – 180 | 81 – 380 | 2.1 – 10.0 | 101 – 168 | 401 – 800 |
| **201 – 300** | Poor | 91 – 120 | 251 – 350 | 181 – 280 | 381 – 800 | 10.1 – 17.0 | 169 – 208 | 801 – 1200 |
| **301 – 400** | Very Poor | 121 – 250 | 351 – 430 | 281 – 400 | 801 – 1600 | 17.1 – 34.0 | 209 – 748 | 1201 – 1800 |
| **401 – 500** | Severe | 251 – 380 | 431 – 510 | 401 – 800 | 1601 – 3200 | 34.1 – 50.0 | 749 – 1000 | 1801 – 2400 |

### Aggregation & Minimum Pollutant Rule
1. **Three Pollutant Condition**: At least 3 pollutants must have valid monitoring sub-indices, of which at least one must be PM2.5 or PM10.
2. **Overall AQI**: $\text{AQI} = \max(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{SO2}}, I_{\text{CO}}, I_{\text{O3}}, I_{\text{NH3}})$.
3. **Dominant Pollutant**: The pollutant responsible for the highest sub-index.

Both Python (`ml/aqi_cpcb.py`) and TypeScript (`web/src/lib/aqi.ts`) share the exact same algorithms, verified via automated cross-validation tests.

---

## 4. Machine Learning & Forecasting Architecture

### Feature Engineering (Strictly Leak-Free)
To prevent look-ahead bias and temporal leakage, all rolling statistics and lag variables are shifted by at least 1 time step:
- **Calendar Signals**: Hour (0–23), Day of Week (0–6), Month (1–12), Day of Year (1–366).
- **Cyclical Trigonometric Transformations**: $\sin$ and $\cos$ of Hour ($2\pi \cdot \text{hour}/24$) and Day of Year ($2\pi \cdot \text{doy}/365.25$).
- **Lag Features**: $t-1$, $t-3$, $t-6$, $t-12$, $t-24$ hours.
- **Rolling Windows**: 6-hour and 24-hour mean and standard deviations computed exclusively on prior observations.
- **Meteorological Co-variates**: Ambient Temperature, Relative Humidity, Wind Speed.

### Chronological Train / Test Split
Random k-fold cross validation on time series introduces future data into past predictions. We enforce a strictly chronological split:
- **Training Set**: Earliest 80% of observations (~14,000 hours).
- **Test Set**: Final 20% of observations (~3,500 hours).

### Multi-Horizon Timeline Connection
The forecast line starts directly at anchor point $T_0$ (the last known actual CPCB observation point) having identical timestamp and AQI value. Subsequent forecast points ($+1\text{h}$ to $+72\text{h}$) predict pollutant concentrations first and calculate official CPCB AQI, ensuring that forecast AQI and historical AQI share the exact same scale and definition.

---

## 5. REST API Specifications

### `GET /api/live`
- Returns Delhi NCR regional AQI, active stations, caching disclosure, and last updated timestamp.
- Server-side cache duration: 5 minutes (`LIVE_TTL_SECONDS=300`).

### `GET /api/stations`
- Returns catalog of 34 Delhi NCR monitoring stations with real CPCB coordinates, current AQI, and sub-indices.

### `GET /api/history`
- Query parameters:
  - `resolution=daily|hourly`: Selects temporal resolution.
  - `from=YYYY-MM-DD`: Start date filter.
  - `to=YYYY-MM-DD`: End date filter.
  - `pollutant=aqi|pm25|pm10|...`: Optional pollutant filter.

### `GET /api/forecast`
- Returns continuous 72-hour forecast timeline and key milestones (+24h, +48h, +72h) with confidence intervals.

### `GET /api/metrics`
- Returns MAE, RMSE, $R^2$, and Category Accuracy benchmarks for Ridge, Random Forest, and Gradient Boosting.

### `POST /api/aqi`
- Calculates official CPCB AQI from JSON payload:
```json
{
  "pm25": 140,
  "pm10": 210,
  "no2": 45,
  "so2": 18,
  "co": 1.2,
  "o3": 35,
  "nh3": 40
}
```
