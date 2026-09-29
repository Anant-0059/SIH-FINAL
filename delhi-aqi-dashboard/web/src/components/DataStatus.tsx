"use client";

import React from "react";
import { Database, ShieldAlert, Radio } from "lucide-react";

interface DataStatusProps {
  isCached: boolean;
  isAvailable?: boolean;
  staleMessage?: string | null;
  source?: string;
  isHistorical?: boolean;
}

export const DataStatus: React.FC<DataStatusProps> = ({
  isCached,
  isAvailable = true,
  staleMessage,
  source = "AQI.in",
  isHistorical = false,
}) => {
  if (isHistorical) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-medium">
        <Database className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
        <span>
          Viewing Historical CPCB Monitoring Telemetry &bull; Station: IHBAS, Dilshad Garden, Delhi (2024–2025)
        </span>
      </div>
    );
  }

  if (!isAvailable || isCached) {
    return (
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs font-medium">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-semibold">
            {staleMessage || "Live AQI temporarily unavailable"}
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] opacity-80 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">
          Source: {source}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        <span className="font-semibold">
          Source: {source} &bull; Real-Time Live Stream Connected
        </span>
      </div>
      <span className="hidden md:inline-block text-[11px] font-semibold opacity-90 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-full">
        Auto-Refreshes Every 45s
      </span>
    </div>
  );
};
