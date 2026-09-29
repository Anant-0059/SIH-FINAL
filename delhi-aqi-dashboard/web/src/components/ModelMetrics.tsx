"use client";

import React, { useState } from "react";
import { MetricsPayload } from "@/lib/api";
import { BrainCircuit, Info, FlaskConical, Layers } from "lucide-react";

interface ModelMetricsProps {
  metrics: (MetricsPayload & { scientific_upgrade?: any }) | null;
}

export const ModelMetrics: React.FC<ModelMetricsProps> = ({ metrics }) => {
  const [selectedPollutant, setSelectedPollutant] = useState("pm25");

  if (!metrics) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500">
        Loading Machine Learning Evaluation Metrics...
      </div>
    );
  }

  const { pollutants, composite_aqi, split_method, engineered_features, scientific_upgrade } = metrics;

  const pollutantLabels: Record<string, string> = {
    pm25: "PM2.5 (Fine Particulates)",
    pm10: "PM10 (Coarse Dust)",
    no2: "NO2 (Nitrogen Dioxide)",
    so2: "SO2 (Sulphur Dioxide)",
    co: "CO (Carbon Monoxide)",
    o3: "Ozone (O3)",
    nh3: "NH3 (Ammonia)",
  };

  const currentPollutantMetrics = pollutants[selectedPollutant] || {};

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Machine Learning Model Benchmark & Scientific Ablation
            </h3>
            <span className="text-[11px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <BrainCircuit className="h-3.5 w-3.5" /> 5 Model Families • Walk-Forward Split
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluated on strictly unseen chronological test data ({scientific_upgrade?.provenance?.unseen_test_period || split_method})
          </p>
        </div>
      </div>

      {/* Multi-Horizon CPCB AQI Evaluation (6h, 12h, 24h, 48h, 72h) */}
      {scientific_upgrade?.aqi_multi_horizon && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Multi-Horizon CPCB AQI Evaluation (Calculated from 7 Predicted Pollutants)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Horizon Band</th>
                  <th className="py-2.5 px-3">Persistence MAE</th>
                  <th className="py-2.5 px-3">Previous Model MAE</th>
                  <th className="py-2.5 px-3">Scientific Ensemble MAE</th>
                  <th className="py-2.5 px-3">Ensemble R²</th>
                  <th className="py-2.5 px-3">Category Accuracy</th>
                  <th className="py-2.5 px-3">High-AQI Recall (&ge;201)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(scientific_upgrade.aqi_multi_horizon).map(([hKey, row]: [string, any]) => (
                  <tr key={hKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {hKey} ({row.horizon_band})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{row.persistence_aqi_mae}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{row.previous_model_aqi_mae}</td>
                    <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {row.scientific_ensemble_aqi_mae}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">{row.scientific_ensemble_aqi_r2}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
                        {row.category_accuracy_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-amber-600 dark:text-amber-400">
                      {row.high_aqi_recall_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Composite CPCB AQI Category Accuracy & Overall Performance */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Single-Model Family CPCB AQI Baseline Comparison (24h Horizon)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(composite_aqi).map(([modelName, stats]) => (
            <div
              key={modelName}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {modelName}
                </span>
                <span className="text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                  {stats.category_accuracy_pct}% Cat Match
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">AQI MAE</span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-200">
                    {stats.aqi_mae}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">AQI RMSE</span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-200">
                    {stats.aqi_rmse}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">AQI R²</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {stats.aqi_r2}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pollutant-Specific Metric Comparison */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Per-Pollutant Concentration Metrics
          </h4>

          {/* Pollutant Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(pollutantLabels).map((pKey) => (
              <button
                key={pKey}
                onClick={() => setSelectedPollutant(pKey)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  selectedPollutant === pKey
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {pKey.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">MAE (Mean Absolute Error)</th>
                <th className="py-2.5 px-3">RMSE (Root Mean Square Error)</th>
                <th className="py-2.5 px-3">R² Score (Variance Explained)</th>
                <th className="py-2.5 px-3">Test Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(currentPollutantMetrics).map(([modelName, st]: any) => (
                <tr key={modelName} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {modelName === "Ridge"
                      ? "Ridge Regression (L2)"
                      : modelName === "RandomForest"
                      ? "Random Forest Regressor (Ensemble)"
                      : "Gradient Boosting Regressor (GBRT)"}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium">{st.mae}</td>
                  <td className="py-2.5 px-3 font-mono font-medium">{st.rmse}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {st.r2}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{st.test_samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7-Group Feature Ablation Study (Phase 23) */}
      {scientific_upgrade?.ablation_study && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              7-Stage Feature Ablation Study (PM2.5 Out-of-Sample Test Set MAE)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Feature Group (Cumulative)</th>
                  <th className="py-2.5 px-3">24h MAE (µg/m³)</th>
                  <th className="py-2.5 px-3">48h MAE (µg/m³)</th>
                  <th className="py-2.5 px-3">72h MAE (µg/m³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scientific_upgrade.ablation_study.map((ab: any) => (
                  <tr key={ab.group} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {ab.description}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {ab.mae_24h}
                    </td>
                    <td className="py-2 px-3 font-mono">{ab.mae_48h}</td>
                    <td className="py-2 px-3 font-mono">{ab.mae_72h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology Explanations & Feature Engineering */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Info className="h-4 w-4 text-emerald-500" />
          <span>Scientific Methodology & Zero-Leakage Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Time-series data was split strictly chronologically (70% Train: Jan 2024–May 2025, 15% Validation: May–Sep 2025, 15% Unseen Test: Sep–Dec 2025). All backward fill (`bfill`) operations were eliminated to prevent future data leakage.
        </p>
        <div className="pt-2 flex flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Engineered Features:</span>
          {engineered_features.map((f: string) => (
            <span
              key={f}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
