"use client";

import React from "react";
import { getCategoryInfo } from "@/lib/aqi";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

interface AQIGaugeProps {
  aqi: number | null;
  category: string;
  dominantPollutant: string | null;
  stationName?: string;
  source?: string;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({
  aqi,
  category,
  dominantPollutant,
  stationName,
  source = "AQI.in",
}) => {
  const catDetails =
    aqi !== null
      ? getCategoryInfo(aqi)
      : {
          color: "#94a3b8",
          category: "Unavailable",
          description: "Live AQI temporarily unavailable",
          healthAdvisory: "Please wait for the next live refresh cycle.",
          borderColor: "border-slate-200 dark:border-slate-800",
          bgLight: "bg-slate-50 dark:bg-slate-800/40",
          textColor: "text-slate-600 dark:text-slate-400",
        };

  // Calculate needle angle for 0-500 scale
  // Arc spans 180 degrees from -90 deg (left, 0) to +90 deg (right, 500)
  const clampedAqi = aqi !== null ? Math.max(0, Math.min(500, aqi)) : 0;
  const angle = -90 + (clampedAqi / 500) * 180;

  const categories = [
    { label: "Good", range: "0–50", color: "#16a34a" },
    { label: "Satisfactory", range: "51–100", color: "#65a30d" },
    { label: "Moderate", range: "101–200", color: "#ca8a04" },
    { label: "Poor", range: "201–300", color: "#ea580c" },
    { label: "Very Poor", range: "301–400", color: "#dc2626" },
    { label: "Severe", range: "401–500", color: "#7f1d1d" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Air Quality Index Gauge
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stationName || "Delhi Regional"} &bull; Source: <strong className="text-emerald-600 dark:text-emerald-400">{source}</strong>
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${catDetails.color}18`,
            color: catDetails.color,
          }}
        >
          {aqi !== null && aqi <= 100 ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : aqi !== null && aqi <= 300 ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <AlertOctagon className="h-3.5 w-3.5" />
          )}
          {category}
        </span>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* SVG Semi-Circle Gauge */}
        <div className="relative flex flex-col items-center justify-center w-64 h-36">
          <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="15%" stopColor="#65a30d" />
                <stop offset="35%" stopColor="#ca8a04" />
                <stop offset="55%" stopColor="#ea580c" />
                <stop offset="80%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>

            {/* Gauge Background Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="16"
              strokeLinecap="round"
              className="dark:stroke-slate-800"
            />

            {/* Colored Segment Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Needle Pivot & Needle */}
            <g transform={`rotate(${angle} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="28"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="dark:stroke-white transition-transform duration-700 ease-out"
              />
              <circle cx="100" cy="100" r="7" fill="#0f172a" className="dark:fill-white" />
              <circle cx="100" cy="100" r="3.5" fill={catDetails.color} />
            </g>
          </svg>

          {/* Centered Value */}
          <div className="absolute bottom-0 text-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {aqi !== null ? aqi : "--"}
            </span>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {aqi !== null ? "AQI" : "Unavailable"}
            </span>
          </div>
        </div>

        {/* Category Details & Health Impact Explanation */}
        <div className="flex-1 space-y-3.5 w-full">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Primary Contributor
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dominantPollutant || "PM2.5"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {catDetails.description}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${catDetails.borderColor} ${catDetails.bgLight}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Health Advisory
              </span>
            </div>
            <p className={`mt-1.5 text-xs ${catDetails.textColor} leading-relaxed`}>
              {catDetails.healthAdvisory}
            </p>
          </div>
        </div>
      </div>

      {/* Category Reference Legend */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {categories.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center text-center p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30"
          >
            <span
              className="h-2 w-full rounded-full mb-1.5"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {c.label}
            </span>
            <span className="text-[10px] text-slate-400">{c.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
