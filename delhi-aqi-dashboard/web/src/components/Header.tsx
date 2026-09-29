"use client";

import React from "react";
import { Moon, Sun, RefreshCw, Radio, History, Wind, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface HeaderProps {
  mode: "live" | "historical";
  onModeChange: (mode: "live" | "historical") => void;
  isDark: boolean;
  onThemeToggle: () => void;
  lastUpdated: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  isDark,
  onThemeToggle,
  lastUpdated,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Delhi NCR Air Quality Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Real-time monitoring &bull; Historical analysis &bull; Machine-learning forecast
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => onModeChange("live")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === "live"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="h-3.5 w-3.5" />
              LIVE
            </button>
            <button
              onClick={() => onModeChange("historical")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === "historical"
                  ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              HISTORICAL
            </button>
          </div>

          {/* Timestamp Indicator */}
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Updated: {formatDateTime(lastUpdated)}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
