"use client";

import React, { useState, useMemo } from "react";
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
import { DailyRecord, HourlyRecord } from "@/lib/api";
import { getCategoryInfo } from "@/lib/aqi";
import { Calendar, Filter, TrendingDown, TrendingUp } from "lucide-react";

interface HistoricalChartProps {
  dailyData: DailyRecord[];
  hourlyData: HourlyRecord[];
  forecastSeries?: any[];
}

type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";
type PollutantKey = "aqi" | "pm25" | "pm10" | "no2" | "so2" | "co" | "o3" | "nh3";

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  dailyData,
  hourlyData,
  forecastSeries = [],
}) => {
  const [range, setRange] = useState<TimeRange>("30d");
  const [pollutant, setPollutant] = useState<PollutantKey>("aqi");
  const [showPredictionOverlay, setShowPredictionOverlay] = useState<boolean>(true);

  const pollutantLabels: Record<PollutantKey, { label: string; unit: string; color: string }> = {
    aqi: { label: "CPCB AQI", unit: "", color: "#ea580c" },
    pm25: { label: "PM2.5", unit: "µg/m³", color: "#f97316" },
    pm10: { label: "PM10", unit: "µg/m³", color: "#eab308" },
    no2: { label: "NO2", unit: "µg/m³", color: "#06b6d4" },
    so2: { label: "SO2", unit: "µg/m³", color: "#8b5cf6" },
    co: { label: "CO", unit: "mg/m³", color: "#64748b" },
    o3: { label: "Ozone", unit: "µg/m³", color: "#10b981" },
    nh3: { label: "NH3", unit: "µg/m³", color: "#ec4899" },
  };

  const filteredData = useMemo(() => {
    let baseData: any[] = [];

    if (range === "24h") {
      baseData = hourlyData.slice(-24);
    } else if (range === "7d") {
      baseData = hourlyData.slice(-168);
    } else if (range === "30d") {
      baseData = dailyData.slice(-30);
    } else if (range === "90d") {
      baseData = dailyData.slice(-90);
    } else if (range === "1y") {
      baseData = dailyData.slice(-365);
    } else {
      baseData = dailyData;
    }

    // Map records to standard { date, actual, predicted } points
    const mapped = baseData.map((d) => {
      const rawDate = d.date || d.timestamp;
      const formattedDate = range === "24h" || range === "7d"
        ? rawDate.substring(5, 16).replace("T", " ")
        : rawDate;
      const val = d[pollutant] !== undefined ? Number(d[pollutant]) : null;

      return {
        timestamp: rawDate,
        dateDisplay: formattedDate,
        actual: val !== null && !isNaN(val) ? val : null,
        predicted: null as number | null,
        category: d.category,
      };
    });

    // If viewing AQI and prediction overlay is enabled and viewing recent 24h, 7d, or 30d
    if (pollutant === "aqi" && showPredictionOverlay && forecastSeries && forecastSeries.length > 0) {
      if (range === "24h" || range === "7d" || range === "30d") {
        // Find last actual point
        const lastActualIdx = mapped.length - 1;
        if (lastActualIdx >= 0) {
          // Connect prediction seamlessly from the exact last actual point
          mapped[lastActualIdx].predicted = mapped[lastActualIdx].actual;

          // Append future forecast series points (up to 72 hours)
          forecastSeries.forEach((fc) => {
            if (!fc.is_anchor) {
              const fcDateDisplay = fc.timestamp.substring(5, 16).replace("T", " ");
              mapped.push({
                timestamp: fc.timestamp,
                dateDisplay: fcDateDisplay,
                actual: null,
                predicted: fc.aqi,
                category: fc.category,
              });
            }
          });
        }
      }
    }

    return mapped;
  }, [dailyData, hourlyData, forecastSeries, range, pollutant, showPredictionOverlay]);

  // Compute Min, Max, Average for the current view
  const stats = useMemo(() => {
    const validActuals = filteredData
      .map((d) => d.actual)
      .filter((v): v is number => v !== null && !isNaN(v));

    if (validActuals.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    const min = Math.min(...validActuals);
    const max = Math.max(...validActuals);
    const avg = validActuals.reduce((a, b) => a + b, 0) / validActuals.length;

    return {
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      avg: Math.round(avg * 10) / 10,
      count: validActuals.length,
    };
  }, [filteredData]);

  const currentMeta = pollutantLabels[pollutant];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Historical AQI & Pollutant Analysis</span>
            {pollutant === "aqi" && showPredictionOverlay && (
              <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Prediction Connected
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Station: IHBAS, Dilshad Garden &bull; Continuous 2024–2025 observations
          </p>
        </div>

        {/* Time Ranges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
          {(["24h", "7d", "30d", "90d", "1y", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md transition ${
                range === r
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {r === "all" ? "Entire 2024–25" : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Pollutant Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(pollutantLabels) as PollutantKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setPollutant(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              pollutant === key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {pollutantLabels[key].label}
          </button>
        ))}

        {pollutant === "aqi" && (
          <label className="ml-auto flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showPredictionOverlay}
              onChange={(e) => setShowPredictionOverlay(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Overlay Forecast Line</span>
          </label>
        )}
      </div>

      {/* Summary Min / Max / Mean stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Observations</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.count}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Average</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {stats.avg} {currentMeta.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-500" /> Minimum
          </span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.min} {currentMeta.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-rose-500" /> Maximum
          </span>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.max} {currentMeta.unit}
          </p>
        </div>
      </div>

      {/* Main Recharts Line/Area Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={currentMeta.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={currentMeta.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
            <XAxis
              dataKey="dateDisplay"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              interval={Math.max(1, Math.floor(filteredData.length / 8))}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.15))]}
            />
            {pollutant === "aqi" && (
              <>
                <ReferenceLine y={100} stroke="#ca8a04" strokeDasharray="3 3" label={{ value: "100 Moderate", fill: "#ca8a04", fontSize: 10 }} />
                <ReferenceLine y={200} stroke="#ea580c" strokeDasharray="3 3" label={{ value: "200 Poor", fill: "#ea580c", fontSize: 10 }} />
                <ReferenceLine y={300} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "300 Very Poor", fill: "#dc2626", fontSize: 10 }} />
                <ReferenceLine y={400} stroke="#7f1d1d" strokeDasharray="3 3" label={{ value: "400 Severe", fill: "#7f1d1d", fontSize: 10 }} />
              </>
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const val = d.actual !== null ? d.actual : d.predicted;
                  const isPred = d.predicted !== null && d.actual === null;
                  const cat = val !== null && pollutant === "aqi" ? getCategoryInfo(val) : null;

                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg text-xs">
                      <p className="font-semibold text-slate-500 dark:text-slate-400">{d.timestamp}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-base">
                          {val} {currentMeta.unit}
                        </span>
                        {isPred ? (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            Model Forecast
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Actual CPCB
                          </span>
                        )}
                      </div>
                      {cat && (
                        <p className="mt-1 font-bold" style={{ color: cat.color }}>
                          {cat.category}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Solid line for Actual Historical */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke={currentMeta.color}
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              isAnimationActive={false}
            />
            {/* Dashed line for Forecast (connected directly to last actual) */}
            {pollutant === "aqi" && showPredictionOverlay && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#10b981" }}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
