"use client";

import React from "react";
import { calculateSubIndex } from "@/lib/aqi";

interface PollutantInfo {
  key: string;
  name: string;
  chemical: string;
  value: number | null;
  unit: string;
  standard: number;
  standardPeriod: string;
  relevance: string;
  explanation: string;
}

interface PollutantCardsGridProps {
  pollutants: Record<string, number | null | undefined>;
}

export const PollutantCard: React.FC<PollutantCardsGridProps> = ({ pollutants }) => {
  const pollutantCatalog: PollutantInfo[] = [
    {
      key: "pm25",
      name: "Fine Particulate Matter",
      chemical: "PM2.5",
      value: pollutants.pm25 ?? null,
      unit: "µg/m³",
      standard: 60,
      standardPeriod: "24-hr avg",
      relevance: "Primary contributor to Delhi smog and elevated AQI episodes.",
      explanation: "Microscopic particles (≤2.5 µm) that penetrate deep into lungs and enter the bloodstream.",
    },
    {
      key: "pm10",
      name: "Coarse Particulate Matter",
      chemical: "PM10",
      value: pollutants.pm10 ?? null,
      unit: "µg/m³",
      standard: 100,
      standardPeriod: "24-hr avg",
      relevance: "Dominant during dry/dusty seasons and construction activity.",
      explanation: "Inhalable dust, pollen, and road debris particles with diameters 10 µm or less.",
    },
    {
      key: "no2",
      name: "Nitrogen Dioxide",
      chemical: "NO2",
      value: pollutants.no2 ?? null,
      unit: "µg/m³",
      standard: 80,
      standardPeriod: "24-hr avg",
      relevance: "Major vehicular and industrial combustion indicator.",
      explanation: "Toxic reddish-brown gas causing airway inflammation and photochemical smog.",
    },
    {
      key: "so2",
      name: "Sulphur Dioxide",
      chemical: "SO2",
      value: pollutants.so2 ?? null,
      unit: "µg/m³",
      standard: 80,
      standardPeriod: "24-hr avg",
      relevance: "Thermal power plant and heavy fuel oil combustion marker.",
      explanation: "Pungent gas that reacts with moisture in the atmosphere to create acid precipitation.",
    },
    {
      key: "co",
      name: "Carbon Monoxide",
      chemical: "CO",
      value: pollutants.co ?? null,
      unit: "mg/m³",
      standard: 2.0,
      standardPeriod: "8-hr avg",
      relevance: "Incomplete combustion product from vehicles and biomass burning.",
      explanation: "Colorless, odorless gas that reduces oxygen delivery to vital organs.",
    },
    {
      key: "o3",
      name: "Ground-Level Ozone",
      chemical: "Ozone (O3)",
      value: pollutants.o3 ?? null,
      unit: "µg/m³",
      standard: 100,
      standardPeriod: "8-hr avg",
      relevance: "Secondary summer pollutant formed by sunlight and chemical precursors.",
      explanation: "Strong oxidant that damages lung tissue, exacerbates asthma, and stunts crops.",
    },
    {
      key: "nh3",
      name: "Ammonia",
      chemical: "NH3",
      value: pollutants.nh3 ?? null,
      unit: "µg/m³",
      standard: 400,
      standardPeriod: "24-hr avg",
      relevance: "Precursor in secondary inorganic aerosol (ammonium nitrate/sulfate) synthesis.",
      explanation: "Pungent gas emitted from agricultural fertilizers, waste treatment, and livestock.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Criteria Pollutant Concentrations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official National Ambient Air Quality Standards (NAAQS) benchmarks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pollutantCatalog.map((item) => {
          const hasValue = item.value !== null && item.value !== undefined;
          const sub = hasValue ? calculateSubIndex(item.key, item.value!) : null;
          const ratio = hasValue && item.standard > 0 ? item.value! / item.standard : 0;
          const isExceeded = ratio > 1.0;

          return (
            <div
              key={item.key}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {item.chemical}
                  </span>
                  {sub !== null ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Sub-Index: {Math.round(sub)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-400">
                      Not reported
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.name}</div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {hasValue ? item.value : "N/A"}
                  </span>
                  {hasValue && <span className="text-xs font-medium text-slate-500">{item.unit}</span>}
                </div>

                {/* Benchmark Comparison Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1 text-slate-500 dark:text-slate-400">
                    <span>Limit: {item.standard} {item.unit}</span>
                    {hasValue ? (
                      <span className={isExceeded ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {isExceeded ? `${ratio.toFixed(1)}x limit` : "Safe"}
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${hasValue ? (isExceeded ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-200 dark:bg-slate-700"}`}
                      style={{ width: `${hasValue ? Math.min(100, ratio * 50) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {item.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
