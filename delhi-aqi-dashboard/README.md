# Delhi NCR Air Quality Intelligence Dashboard

> **Real-time monitoring • Historical analysis • Machine-learning forecast**

A production-grade, local-first web application providing comprehensive air quality monitoring, official CPCB AQI calculation, machine learning forecasting (24h, 48h, 72h), model performance evaluation, and interactive geographic mapping across Delhi NCR cities.

Built using **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Leaflet**, and **Scikit-Learn**.

---

## Key Features

1. **Official CPCB AQI Engine**: Strict, identical implementation of the Indian Central Pollution Control Board National Air Quality Index (NAQI) breakpoints in both Python (`ml/aqi_cpcb.py`) and TypeScript (`web/src/lib/aqi.ts`) with 100% mathematical parity.
2. **Local-First & Zero-Cost Architecture**: Pre-computed, optimized JSON telemetry allows the full dashboard to run completely offline without PostgreSQL or any paid cloud services.
3. **Multi-Horizon ML Forecasting (24h / 48h / 72h)**: Multi-step time-series forecasting powered by Gradient Boosting and Ridge models trained chronologically (no future-data leakage) with confidence intervals.
4. **Continuous Timeline Connection**: The prediction line starts at the exact last actual CPCB observation point ($T_0$) with the same timestamp, ensuring seamless visual continuity on the same Y-axis.
5. **Interactive Delhi NCR Map**: Leaflet map monitoring 34 stations across 9 NCR regions (Delhi, Noida, Greater Noida, Ghaziabad, Gurugram, Faridabad, Sonipat, Baghpat, Bulandshahr) with AQI color coding and slide-over telemetry panels.
6. **Criteria Pollutant Breakdown**: Deep analysis for all 7 primary criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3, NH3) compared against NAAQS safety thresholds.
7. **Model Evaluation Benchmarks**: Comprehensive comparison of Ridge Regression, Random Forest, and Gradient Boosting showing MAE, RMSE, $R^2$, and AQI category accuracy.
8. **Live API with Graceful Caching**: Seamlessly integrates with official `data.gov.in` CPCB stream when an API key is provided, with in-memory caching (`LIVE_TTL_SECONDS=300`) and graceful fallback when offline.
9. **Dark / Light Theme**: Full theme support with local persistence.

---

## Quick Start (One Command)

### Windows (Command Prompt)
Double-click or run:
```cmd
start-dashboard.bat
```
*This automatically checks Node.js & npm, installs dependencies if missing, starts the Next.js server, and opens your browser at `http://localhost:3000`.*

### Windows (PowerShell)
```powershell
.\start-dashboard.ps1
```

---

## Manual Installation & Setup

### 1. Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher (for running or updating ML models)

### 2. Frontend Web Setup
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To create a production build:
```bash
npm run build
npm run start
```

### 3. Python ML & Data Pipeline
```bash
cd ml
pip install -r requirements.txt
```

Run the complete pipeline step-by-step:
```bash
# 1. Inspect raw 2024-2025 CPCB dataset and generate quality report
python profile_dataset.py

# 2. Clean observations, compute hourly/daily rollups and CPCB NAQI
python clean_data.py

# 3. Train ML models (Ridge, Random Forest, Gradient Boosting) and calculate metrics
python train_models.py

# 4. Generate 24h, 48h, 72h forecasts and backtesting trajectories
python train_forecast_models.py

# 5. Export pre-computed datasets directly to web/public/data/
python export_dashboard_data.py
```

---

## Project Directory Structure

```text
delhi-aqi-dashboard/
├── README.md                          # Main project guide
├── .gitignore                         # Version control exclusions
├── .env.example                       # Environment variable template
├── start-dashboard.bat                # 1-click Windows Batch launcher
├── start-dashboard.ps1                # 1-click PowerShell launcher
│
├── web/                               # Next.js 14 Frontend Application
│   ├── package.json                   # Dependencies: Next.js, React, Tailwind, Recharts, Leaflet
│   ├── tsconfig.json                  # TypeScript compiler settings
│   ├── tailwind.config.ts             # Tailwind CSS theme and AQI color tokens
│   │
│   ├── public/data/                   # Pre-processed dashboard JSON data
│   │   ├── daily_aqi.json             # 731 daily records (2024-2025)
│   │   ├── hourly_aqi.json            # Granular hourly records
│   │   ├── stations.json              # 34 Delhi NCR stations with coordinates
│   │   ├── metrics.json               # MAE, RMSE, R², Category Accuracy
│   │   ├── forecasts.json             # 24h, 48h, 72h forecast series
│   │   └── summary.json               # Overview statistics
│   │
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Home entry point
│       │   ├── layout.tsx             # Root layout and metadata
│       │   ├── globals.css            # Tailwind & Leaflet styling
│       │   └── api/                   # REST API routes
│       │       ├── live/route.ts      # Live CPCB stream with cache fallback
│       │       ├── forecast/route.ts  # Multi-horizon forecast endpoint
│       │       ├── history/route.ts   # Daily & hourly history query
│       │       ├── metrics/route.ts   # ML evaluation metrics
│       │       ├── stations/route.ts  # Delhi NCR station catalog
│       │       └── aqi/route.ts       # CPCB NAQI calculator POST endpoint
│       │
│       ├── components/                # Modular UI components
│       │   ├── Dashboard.tsx          # Master layout & state coordinator
│       │   ├── Header.tsx             # Mode switcher, refresh, dark toggle
│       │   ├── AQICard.tsx            # Top 4 KPI cards
│       │   ├── AQIGauge.tsx           # Interactive semi-circle CPCB gauge
│       │   ├── PollutantCard.tsx      # NAAQS standards & 7 pollutant cards
│       │   ├── ForecastChart.tsx      # 72h forecast timeline & confidence band
│       │   ├── HistoricalChart.tsx    # Interactive time range & forecast overlay
│       │   ├── PollutantChart.tsx     # Sub-index breakdown bar chart
│       │   ├── NCRMap.tsx             # Interactive Leaflet NCR station map
│       │   ├── StationTable.tsx       # Searchable & sortable station table
│       │   ├── ModelMetrics.tsx       # ML benchmark table & explanations
│       │   ├── DataStatus.tsx         # Live / cached disclosure banner
│       │   ├── LoadingState.tsx       # Skeleton loading states
│       │   └── ErrorState.tsx         # Resilient error fallback UI
│       │
│       └── lib/
│           ├── aqi.ts                 # CPCB NAQI algorithm & breakpoints (TS)
│           ├── api.ts                 # Type definitions & fetch clients
│           ├── forecast.ts            # Forecast interfaces
│           └── utils.ts               # Formatting helpers & Tailwind merge
│
├── ml/                                # Python Machine Learning Pipeline
│   ├── requirements.txt               # pandas, numpy, scikit-learn, joblib
│   ├── aqi_cpcb.py                    # CPCB NAQI algorithm & breakpoints (Python)
│   ├── profile_dataset.py             # Data quality & profiling reporter
│   ├── clean_data.py                  # Cleaning & temporal aggregation
│   ├── train_models.py                # Chronological training of 3 ML models
│   ├── train_forecast_models.py       # 72-hour recursive forecasting
│   ├── export_dashboard_data.py       # JSON export utility
│   └── live_forecast.py               # Dynamic forward projection
│
├── data/
│   ├── raw/                           # Original CPCB observation dataset
│   ├── processed/                     # Hourly/daily clean CSVs and metrics
│   └── models/                        # Serialized .joblib model artifacts
│
└── docs/
    ├── PROJECT_DOCUMENTATION.md       # Detailed technical architecture doc
    └── DATA_QUALITY_REPORT.md         # Comprehensive data profiling report
```

---

## CPCB AQI Breakpoints & Standards

The National Air Quality Index (NAQI) uses official sub-index formulas:
$$I = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{B_{\text{high}} - B_{\text{low}}} \times (C - B_{\text{low}})$$

| Category | AQI Range | Color | Health Impact |
|---|---|---|---|
| **Good** | 0–50 | Green (`#16a34a`) | Minimal impact |
| **Satisfactory** | 51–100 | Light Green (`#65a30d`) | Minor breathing discomfort to sensitive people |
| **Moderate** | 101–200 | Yellow (`#ca8a04`) | Breathing discomfort with lung/heart diseases |
| **Poor** | 201–300 | Orange (`#ea580c`) | Breathing discomfort on prolonged exposure |
| **Very Poor** | 301–400 | Red (`#dc2626`) | Respiratory illness on prolonged exposure |
| **Severe** | 401–500 | Maroon (`#7f1d1d`) | Seriously impacts healthy people & patients |

---

## Machine Learning Performance

Evaluated on a chronological 80% train / 20% test holdout (no temporal leakage):

| Model | AQI MAE | AQI RMSE | AQI $R^2$ | Category Accuracy |
|---|---|---|---|---|
| **Ridge Regression** | **17.35** | 24.12 | 0.949 | **83.29%** |
| **Gradient Boosting** | **17.91** | 24.15 | 0.948 | **82.17%** |
| **Random Forest** | 19.99 | 26.50 | 0.938 | 79.41% |

*Forecasts are clearly marked as: "Model prediction — not an official CPCB forecast."*

---

## REST API Endpoints

- `GET /api/live`: Returns latest NCR station telemetry with 5-minute caching and stale fallback disclosure.
- `GET /api/stations`: Returns catalog of 34 NCR stations with geographic coordinates and AQI.
- `GET /api/history?resolution=daily|hourly`: Query historical CPCB observations.
- `GET /api/forecast`: Returns 24h, 48h, 72h forecasts and continuous 72-hour timeline.
- `GET /api/metrics`: Returns ML model benchmark comparisons.
- `POST /api/aqi`: Calculates official CPCB AQI, category, and sub-indices for custom pollutant inputs.
