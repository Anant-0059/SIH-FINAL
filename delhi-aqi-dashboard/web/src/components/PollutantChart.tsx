"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { calculateSubIndex, getCategoryInfo } from "@/lib/aqi";

interface PollutantChartProps {
  pollutants: Record<string, number | null | undefined>;
}

export const PollutantChart: React.FC<PollutantChartProps> = ({ pollutants }) => {
  const pollutantKeys = ["pm25", "pm10", "no2", "so2", "co", "o3", "nh3"];
  const nameLabels: Record<string, string> = {
    pm25: "PM2.5",
    pm10: "PM10",
    no2: "NO2",
    so2: "SO2",
    co: "CO",
    o3: "Ozone",
    nh3: "NH3",
  };

  const chartData = pollutantKeys.map((key) => {
    const conc = pollutants[key] ?? null;
    const sub = conc !== null ? calculateSubIndex(key, conc) : null;
    const cat = sub !== null ? getCategoryInfo(sub) : { color: "#94a3b8", category: "N/A" };
    return {
      key,
      name: nameLabels[key] || key.toUpperCase(),
      subIndex: sub !== null ? Math.round(sub) : 0,
      concentration: conc !== null ? Number(conc) : 0,
      color: cat.color,
      category: cat.category,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sub-Index Breakdown Across Pollutants
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            CPCB sub-indices compared against the 100 Moderate and 200 Poor thresholds
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, (dataMax: number) => Math.max(350, Math.ceil(dataMax * 1.1))]}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={100} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: "Satisfactory Limit (100)", fill: "#ca8a04", fontSize: 10 }} />
            <ReferenceLine y={200} stroke="#ea580c" strokeDasharray="4 4" label={{ value: "Moderate Limit (200)", fill: "#ea580c", fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{d.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Concentration: <strong className="text-slate-800 dark:text-slate-200">{d.concentration}</strong>
                      </p>
                      <p className="mt-1">
                        Sub-Index: <strong style={{ color: d.color }}>{d.subIndex}</strong> ({d.category})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="subIndex" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
