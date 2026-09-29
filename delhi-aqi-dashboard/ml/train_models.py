"""
train_models.py
Trains Ridge Regression, Random Forest, and Gradient Boosting models
for all 7 primary criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3, NH3).
Uses chronological time-series splitting (NO random shuffling) and strict lag/rolling feature engineering.
Outputs:
- data/models/*.joblib
- data/processed/model_metrics.json
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from aqi_cpcb import calculate_cpcb_aqi, get_category_info

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "models")
HOURLY_CSV = os.path.join(PROCESSED_DIR, "clean_hourly.csv")
METRICS_JSON = os.path.join(PROCESSED_DIR, "model_metrics.json")

POLLUTANTS = ["pm25", "pm10", "no2", "so2", "co", "o3", "nh3"]

def build_features(df: pd.DataFrame, target_col: str):
    """
    Constructs leak-free time-series features for a given target pollutant.
    Features:
    - Hour, dayofweek, month, dayofyear
    - Cyclical hour_sin, hour_cos, day_sin, day_cos
    - Lags: 1, 3, 6, 12, 24 (computed strictly on prior time steps)
    - Rolling 6h mean/std, 24h mean/std (shifted by 1 to prevent leakage)
    - Meteo variables if available
    """
    data = pd.DataFrame(index=df.index)
    ts = pd.to_datetime(df["timestamp"])
    
    # Calendar features
    data["hour"] = ts.dt.hour
    data["dayofweek"] = ts.dt.dayofweek
    data["month"] = ts.dt.month
    data["dayofyear"] = ts.dt.dayofyear
    
    # Cyclical encodings
    data["hour_sin"] = np.sin(2 * np.pi * data["hour"] / 24.0)
    data["hour_cos"] = np.cos(2 * np.pi * data["hour"] / 24.0)
    data["doy_sin"] = np.sin(2 * np.pi * data["dayofyear"] / 365.25)
    data["doy_cos"] = np.cos(2 * np.pi * data["dayofyear"] / 365.25)
    
    # Target series and lags
    target_series = df[target_col].copy()
    
    # Shift 1 to ensure zero leakage
    prev = target_series.shift(1)
    data[f"{target_col}_lag1"] = prev
    data[f"{target_col}_lag3"] = target_series.shift(3)
    data[f"{target_col}_lag6"] = target_series.shift(6)
    data[f"{target_col}_lag12"] = target_series.shift(12)
    data[f"{target_col}_lag24"] = target_series.shift(24)
    
    # Rolling statistics over prior windows
    data[f"{target_col}_roll6_mean"] = prev.rolling(window=6, min_periods=3).mean()
    data[f"{target_col}_roll6_std"] = prev.rolling(window=6, min_periods=3).std().fillna(0)
    data[f"{target_col}_roll24_mean"] = prev.rolling(window=24, min_periods=12).mean()
    data[f"{target_col}_roll24_std"] = prev.rolling(window=24, min_periods=12).std().fillna(0)
    
    # Meteorological features if present
    for met in ["temp", "humidity", "wind_speed"]:
        if met in df.columns:
            data[met] = df[met].shift(1)
            
    # Forward fill then backward fill any missing feature values, fallback to 0
    data = data.ffill().bfill().fillna(0)
    
    # Target
    y = target_series
    
    # Valid mask where target is not null and we have at least 24 hours of history
    valid_mask = y.notna() & (target_series.shift(24).notna())
    
    X_clean = data[valid_mask].copy()
    y_clean = y[valid_mask].copy()
    
    return X_clean, y_clean, X_clean.columns.tolist()

def train_and_evaluate():
    print(f"Loading clean hourly data from: {HOURLY_CSV} ...")
    df = pd.read_csv(HOURLY_CSV)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    all_metrics = {}
    model_definitions = {
        "Ridge": Ridge(alpha=1.0),
        "RandomForest": RandomForestRegressor(n_estimators=60, max_depth=14, random_state=42, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=70, max_depth=5, learning_rate=0.08, random_state=42)
    }
    
    print("\n--- Training Chronological Multi-Model Evaluation Suite ---")
    
    # Store predictions for composite AQI evaluation
    test_actual_pollutants = {}
    test_pred_pollutants = {m_name: {} for m_name in model_definitions}
    
    for pol in POLLUTANTS:
        if pol not in df.columns:
            continue
        print(f"\nTraining models for pollutant: {pol.upper()}...")
        X, y, feature_names = build_features(df, pol)
        
        # Chronological Split (80% Train, 20% Test)
        split_idx = int(len(X) * 0.80)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        test_actual_pollutants[pol] = y_test.values
        
        pol_metrics = {}
        
        for m_name, model in model_definitions.items():
            # Clone/fit model
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_pred = np.clip(y_pred, 0, None) # physical concentrations cannot be negative
            test_pred_pollutants[m_name][pol] = y_pred
            
            mae = float(mean_absolute_error(y_test, y_pred))
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            r2 = float(r2_score(y_test, y_pred))
            
            pol_metrics[m_name] = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 4),
                "test_samples": len(y_test)
            }
            
            print(f"  [{m_name:16s}] MAE: {mae:6.2f} | RMSE: {rmse:6.2f} | R²: {r2:6.3f}")
            
            # Save model
            model_path = os.path.join(MODELS_DIR, f"{pol}_{m_name.lower()}.joblib")
            joblib.dump(model, model_path)
            
        all_metrics[pol] = pol_metrics
        
    # Composite AQI Category Match Rate across test set
    print("\nCalculating Composite CPCB AQI Category Match Rates on Test Set...")
    aqi_eval = {}
    
    # Align indices across all pollutants for the test split
    min_test_len = min(len(v) for v in test_actual_pollutants.values())
    
    for m_name in model_definitions:
        actual_cats = []
        pred_cats = []
        actual_aqis = []
        pred_aqis = []
        
        for i in range(min_test_len):
            act_dict = {p: test_actual_pollutants[p][i] for p in POLLUTANTS if p in test_actual_pollutants}
            pred_dict = {p: test_pred_pollutants[m_name][p][i] for p in POLLUTANTS if p in test_pred_pollutants[m_name]}
            
            act_res = calculate_cpcb_aqi(act_dict, enforce_minimum_rule=False)
            prd_res = calculate_cpcb_aqi(pred_dict, enforce_minimum_rule=False)
            
            if act_res["aqi"] is not None and prd_res["aqi"] is not None:
                actual_aqis.append(act_res["aqi"])
                pred_aqis.append(prd_res["aqi"])
                actual_cats.append(act_res["category"])
                pred_cats.append(prd_res["category"])
                
        if actual_aqis:
            aqi_mae = float(mean_absolute_error(actual_aqis, pred_aqis))
            aqi_rmse = float(np.sqrt(mean_squared_error(actual_aqis, pred_aqis)))
            aqi_r2 = float(r2_score(actual_aqis, pred_aqis))
            cat_match_pct = round(float(np.mean(np.array(actual_cats) == np.array(pred_cats)) * 100), 2)
            
            aqi_eval[m_name] = {
                "aqi_mae": round(aqi_mae, 2),
                "aqi_rmse": round(aqi_rmse, 2),
                "aqi_r2": round(aqi_r2, 4),
                "category_accuracy_pct": cat_match_pct,
                "evaluated_timesteps": len(actual_aqis)
            }
            print(f"  [{m_name:16s}] AQI MAE: {aqi_mae:6.2f} | AQI R²: {aqi_r2:6.3f} | Cat Accuracy: {cat_match_pct}%")
            
    final_output = {
        "pollutants": all_metrics,
        "composite_aqi": aqi_eval,
        "split_method": "Chronological 80/20 Time-Series Split (No Shuffling)",
        "engineered_features": [
            "hour", "dayofweek", "month", "dayofyear",
            "hour_sin", "hour_cos", "doy_sin", "doy_cos",
            "lag_1", "lag_3", "lag_6", "lag_12", "lag_24",
            "roll6_mean", "roll6_std", "roll24_mean", "roll24_std",
            "temp", "humidity", "wind_speed"
        ]
    }
    
    with open(METRICS_JSON, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2)
    print(f"\nModel metrics saved to: {METRICS_JSON}")

if __name__ == "__main__":
    train_and_evaluate()
