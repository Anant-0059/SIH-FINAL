"use client";

import React from "react";
import { getCategoryInfo } from "@/lib/aqi";
import { Activity, Wind, MapPin, Gauge } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface KPICardsProps {
  aqi: number | null;
  category: string;
  dominantPollutant: string | null;
  pm25: number | null;
  pm10: number | null;
  activeStations: number;
  source?: string;
  timestamp?: string | null;
  locationName?: string;
}

export const AQICard: React.FC<KPICardsProps> = ({
  aqi,
  category,
  dominantPollutant,
  pm25,
  pm10,
  activeStations,
  source = "AQI.in",
  timestamp = null,
  locationName = "Delhi",
}) => {
  const catDetails = aqi !== null ? getCategoryInfo(aqi) : { color: "#94a3b8", category: "Unavailable" };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: LIVE AQI */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            LIVE AQI ({locationName})
          </span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: catDetails.color }}
          >
            <Gauge className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2.5">
          {aqi !== null ? (
            <>
              <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {aqi}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${catDetails.color}20`,
                  color: catDetails.color,
                }}
              >
                {category}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-rose-500 dark:text-rose-400">
              Live AQI Unavailable
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>
              Source: <strong className="text-emerald-600 dark:text-emerald-400">{source}</strong>
            </span>
            {dominantPollutant && (
              <span>
                Dominant: <strong className="text-slate-700 dark:text-slate-300">{dominantPollutant}</strong>
              </span>
            )}
          </div>
          {timestamp && (
            <span className="text-[11px] opacity-80">
              Updated: {formatDateTime(timestamp)}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: PM2.5 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fine Particles (PM2.5)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <Wind className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {pm25 !== null ? pm25 : "--"}
          </span>
          {pm25 !== null && <span className="text-xs font-medium text-slate-500">µg/m³</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Safe Limit: 60 µg/m³</span>
          {pm25 !== null ? (
            <span className={pm25 > 60 ? "font-semibold text-rose-500" : "font-semibold text-emerald-500"}>
              {pm25 > 60 ? `${(pm25 / 60).toFixed(1)}x limit` : "Within limit"}
            </span>
          ) : (
            <span className="text-slate-400">Unavailable</span>
          )}
        </div>
      </div>

      {/* Card 3: PM10 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Respirable Dust (PM10)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {pm10 !== null ? pm10 : "--"}
          </span>
          {pm10 !== null && <span className="text-xs font-medium text-slate-500">µg/m³</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Safe Limit: 100 µg/m³</span>
          {pm10 !== null ? (
            <span className={pm10 > 100 ? "font-semibold text-rose-500" : "font-semibold text-emerald-500"}>
              {pm10 > 100 ? `${(pm10 / 100).toFixed(1)}x limit` : "Within limit"}
            </span>
          ) : (
            <span className="text-slate-400">Unavailable</span>
          )}
        </div>
      </div>

      {/* Card 4: Active Stations */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Stations
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {activeStations}
          </span>
          <span className="text-xs font-medium text-slate-500">telemetry nodes</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Source: AQI.in Real-Time Network
        </p>
      </div>
    </div>
  );
};
