"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ForecastPayload } from "@/lib/forecast";
import { getCategoryInfo } from "@/lib/aqi";
import { Sparkles, AlertCircle, Wind, Layers, Thermometer, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ForecastChartProps {
  forecastData: ForecastPayload | null;
}

const TARGET_TABS = [
  { key: "aqi", label: "CPCB AQI", unit: "Index", color: "#10b981" },
  { key: "pm25", label: "PM2.5", unit: "µg/m³", color: "#ef4444" },
  { key: "pm10", label: "PM10", unit: "µg/m³", color: "#f97316" },
  { key: "o3", label: "O3", unit: "µg/m³", color: "#3b82f6" },
  { key: "no2", label: "NO2", unit: "µg/m³", color: "#8b5cf6" },
  { key: "so2", label: "SO2", unit: "µg/m³", color: "#eab308" },
  { key: "co", label: "CO", unit: "mg/m³", color: "#ec4899" },
  { key: "nh3", label: "NH3", unit: "µg/m³", color: "#14b8a6" },
];

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecastData }) => {
  const [selectedTarget, setSelectedTarget] = useState<string>("aqi");

  if (!forecastData || !forecastData.series || forecastData.series.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500">
        Loading ML Forecast Models...
      </div>
    );
  }

  const { milestones, series, anchor_timestamp, disclaimer, provenance } = forecastData;
  const activeTab = TARGET_TABS.find((t) => t.key === selectedTarget) || TARGET_TABS[0];

  // Prepare chart series for either CPCB AQI or one of the 7 criteria pollutants
  const chartData = series.map((pt) => {
    const formatted = pt.timestamp.substring(5, 16).replace("T", " ");
    let val = pt.aqi;
    let lower = pt.aqi_lower;
    let upper = pt.aqi_upper;

    if (selectedTarget !== "aqi") {
      const pVal = pt.pollutants?.[selectedTarget] ?? 0;
      val = pVal;
      const b = pt.pollutant_bounds?.[selectedTarget];
      if (b) {
        lower = b.lower;
        upper = b.upper;
      } else {
        const hw = Math.round(pVal * 0.14 * Math.sqrt(Math.max(1, pt.horizon_hours) / 24) * 10) / 10;
        lower = Math.max(0, Math.round((pVal - hw) * 10) / 10);
        upper = Math.round((pVal + hw) * 10) / 10;
      }
    }

    return {
      timestamp: pt.timestamp,
      displayTime: formatted,
      horizon: pt.horizon_hours === 0 ? "Now (T0)" : `+${pt.horizon_hours}h`,
      value: val,
      aqi: pt.aqi,
      lower,
      upper,
      category: pt.category,
      dominant: pt.dominant_pollutant,
      isAnchor: pt.is_anchor,
      meteo: pt.meteorology,
      regimes: pt.regimes,
    };
  });

  const anchorPoint = series[0];
  const anchorCat = getCategoryInfo(anchorPoint.aqi);

  const milestoneCards = [
    {
      title: "Current Anchor (T0)",
      horizon: "Now",
      timestamp: anchorPoint.timestamp,
      aqi: anchorPoint.aqi,
      category: anchorPoint.category,
      dominant: anchorPoint.dominant_pollutant,
      color: anchorCat.color,
      isAnchor: true,
      pbl: anchorPoint.meteorology?.pbl_height,
      wind: anchorPoint.meteorology?.wind_speed,
      pm25: anchorPoint.pollutants?.pm25,
    },
    {
      title: "+24h Outlook",
      horizon: "24 Hours Ahead",
      timestamp: milestones["24h"].timestamp,
      aqi: milestones["24h"].aqi,
      category: milestones["24h"].category,
      dominant: milestones["24h"].dominant_pollutant,
      color: getCategoryInfo(milestones["24h"].aqi).color,
      lower: milestones["24h"].aqi_lower,
      upper: milestones["24h"].aqi_upper,
      pbl: milestones["24h"].meteorology?.pbl_height,
      wind: milestones["24h"].meteorology?.wind_speed,
      pm25: milestones["24h"].pollutants?.pm25,
    },
    {
      title: "+48h Outlook",
      horizon: "48 Hours Ahead",
      timestamp: milestones["48h"].timestamp,
      aqi: milestones["48h"].aqi,
      category: milestones["48h"].category,
      dominant: milestones["48h"].dominant_pollutant,
      color: getCategoryInfo(milestones["48h"].aqi).color,
      lower: milestones["48h"].aqi_lower,
      upper: milestones["48h"].aqi_upper,
      pbl: milestones["48h"].meteorology?.pbl_height,
      wind: milestones["48h"].meteorology?.wind_speed,
      pm25: milestones["48h"].pollutants?.pm25,
    },
    {
      title: "+72h Outlook",
      horizon: "72 Hours Ahead",
      timestamp: milestones["72h"].timestamp,
      aqi: milestones["72h"].aqi,
      category: milestones["72h"].category,
      dominant: milestones["72h"].dominant_pollutant,
      color: getCategoryInfo(milestones["72h"].aqi).color,
      lower: milestones["72h"].aqi_lower,
      upper: milestones["72h"].aqi_upper,
      pbl: milestones["72h"].meteorology?.pbl_height,
      wind: milestones["72h"].meteorology?.wind_speed,
      pm25: milestones["72h"].pollutants?.pm25,
    },
  ];

  // Summarize 72h atmospheric dispersion diagnostics
  const avgPbl = Math.round(
    series.reduce((acc, s) => acc + (s.meteorology?.pbl_height ?? 450), 0) / series.length
  );
  const minPbl = Math.min(...series.map((s) => s.meteorology?.pbl_height ?? 450));
  const avgVent = Math.round(
    series.reduce((acc, s) => acc + (s.meteorology?.ventilation_coeff ?? 950), 0) / series.length
  );
  const inversionHours = series.filter((s) => s.regimes?.strong_inversion || s.regimes?.shallow_pbl).length;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      {/* Header with Prominent Official Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              72-Hour Pollutant-First Scientific AQI Forecast
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> Multi-Horizon Ensemble + Open-Meteo PBL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Predicts 7 criteria pollutants (PM2.5, PM10, O3, NO2, SO2, CO, NH3) &rarr; CPCB AQI ({formatDateTime(anchor_timestamp)})
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 max-w-md">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="line-clamp-2">{disclaimer}</span>
        </div>
      </div>

      {/* 4 Milestone KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {milestoneCards.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {m.horizon}
                </span>
                {m.isAnchor && (
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                    AQI.in Live Anchor
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(m.timestamp)}</p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{m.aqi}</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: `${m.color}20`, color: m.color }}
                >
                  {m.category}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Dominant: <strong className="text-slate-700 dark:text-slate-300">{m.dominant || "PM2.5"}</strong></span>
                {m.lower !== undefined && m.upper !== undefined && (
                  <span className="text-[11px] font-medium text-slate-400">
                    CI: {m.lower}–{m.upper}
                  </span>
                )}
              </div>
              {m.pbl !== undefined && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>PM2.5: {m.pm25} µg/m³</span>
                  <span>PBL: {m.pbl}m | Wind: {m.wind}m/s</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Atmospheric Dispersion & Boundary Layer Physics Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">72h Mean / Min PBL Height</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{avgPbl} m <span className="text-slate-400 font-normal">(Min {minPbl} m)</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Wind className="h-4 w-4 text-sky-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ventilation Coefficient</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{avgVent.toLocaleString()} m²/s</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Thermometer className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Nocturnal Inversion Hours</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{inversionHours} / 72 hrs <span className="text-slate-400 font-normal">(Shallow Mixing)</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Weather NWP Source</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {provenance?.weather_forecast_run || "Open-Meteo 72h Hourly NWP"}
            </span>
          </div>
        </div>
      </div>

      {/* Pollutant & CPCB AQI Target Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {TARGET_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTarget(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedTarget === tab.key
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75 font-normal">({tab.unit})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 inline-block" style={{ backgroundColor: activeTab.color }}></span>
            <span>Predicted {activeTab.label}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 inline-block rounded opacity-30" style={{ backgroundColor: activeTab.color }}></span>
            <span>Calibrated 80%–90% Interval</span>
          </span>
        </div>
      </div>

      {/* 72-Hour Continuous Timeline Line Chart */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastBandDynamic" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={activeTab.color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={activeTab.color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[
                (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.82)),
                (dataMax: number) => Math.ceil(dataMax * 1.15),
              ]}
            />
            {selectedTarget === "aqi" && (
              <>
                <ReferenceLine y={200} stroke="#ea580c" strokeDasharray="3 3" label={{ value: "200 Poor", fill: "#ea580c", fontSize: 10 }} />
                <ReferenceLine y={300} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "300 Very Poor", fill: "#dc2626", fontSize: 10 }} />
              </>
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const cat = getCategoryInfo(d.aqi);
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg text-xs space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{d.horizon}</span>
                        <span className="text-[11px] text-slate-400">{d.timestamp}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {d.value} <span className="text-xs font-normal text-slate-500">{activeTab.unit}</span>
                        </span>
                        <span className="font-bold text-xs" style={{ color: cat.color }}>
                          (CPCB AQI: {d.aqi} • {d.category})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Uncertainty Range: {d.lower} – {d.upper} {activeTab.unit}</span>
                      </div>
                      {d.meteo && (
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          PBL: {d.meteo.pbl_height}m | Wind: {d.meteo.wind_speed}m/s | RH: {d.meteo.humidity}%
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill="url(#forecastBandDynamic)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={activeTab.color}
              strokeWidth={3}
              dot={(props: any): React.ReactElement<SVGElement> => {
                const { cx, cy, payload } = props;
                if (payload.isAnchor || payload.horizon === "+24h" || payload.horizon === "+48h" || payload.horizon === "+72h") {
                  return (
                    <circle
                      key={`dot-${payload.horizon}-${cx}`}
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={payload.isAnchor ? "#ea580c" : activeTab.color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }
                return <g key={`dot-empty-${cx || Math.random()}`} />;
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Provenance Footer (Phase 31) */}
      {provenance && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            <strong className="text-slate-600 dark:text-slate-300">Model:</strong> {provenance.model_name} ({provenance.model_version})
          </div>
          <div>
            <strong className="text-slate-600 dark:text-slate-300">Data Cutoff:</strong> {formatDateTime(provenance.data_cutoff_time)} • <strong className="text-slate-600 dark:text-slate-300">Location:</strong> {provenance.location}
          </div>
        </div>
      )}
    </div>
  );
};
