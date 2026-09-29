"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./Header";
import { DataStatus } from "./DataStatus";
import { AQICard } from "./AQICard";
import { AQIGauge } from "./AQIGauge";
import { PollutantCard } from "./PollutantCard";
import { PollutantChart } from "./PollutantChart";
import { HistoricalChart } from "./HistoricalChart";
import { ForecastChart } from "./ForecastChart";
import { NCRMap } from "./NCRMap";
import { StationTable } from "./StationTable";
import { ModelMetrics } from "./ModelMetrics";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { MapPin, RotateCcw } from "lucide-react";

import {
  fetchLiveAQI,
  fetchHistory,
  fetchForecast,
  fetchMetrics,
  LiveResponse,
  DailyRecord,
  HourlyRecord,
  StationData,
  MetricsPayload,
} from "@/lib/api";
import { ForecastPayload } from "@/lib/forecast";

const LIVE_POLLING_INTERVAL_MS = 45000; // 45 seconds auto-refresh

export const Dashboard: React.FC = () => {
  const [mode, setMode] = useState<"live" | "historical">("live");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Core datasets
  const [liveData, setLiveData] = useState<LiveResponse | null>(null);
  const [dailyHistory, setDailyHistory] = useState<DailyRecord[]>([]);
  const [hourlyHistory, setHourlyHistory] = useState<HourlyRecord[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPayload | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsPayload | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);

  // Initialize Theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  // Load all dashboard data
  const loadData = useCallback(
    async (refreshing = false, targetMode = mode) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const [liveRes, dailyRes, hourlyRes, forecastRes, metricsRes] = await Promise.all([
          fetchLiveAQI().catch((e) => {
            console.warn("Live fetch error:", e);
            return null;
          }),
          fetchHistory("daily").catch(() => []),
          fetchHistory("hourly").catch(() => []),
          fetchForecast(targetMode).catch(() => null),
          fetchMetrics().catch(() => null),
        ]);

        if (liveRes) {
          setLiveData(liveRes);
          // If user already had a station selected, refresh that station's object from new data
          setSelectedStation((prevSelected) => {
            if (!prevSelected) return null; // Keep Regional Delhi as default!
            const updated = liveRes.stations.find((s) => s.id === prevSelected.id);
            return updated || prevSelected;
          });
        }
        setDailyHistory(dailyRes as DailyRecord[]);
        setHourlyHistory(hourlyRes as HourlyRecord[]);
        setForecastData(forecastRes);
        setMetricsData(metricsRes);
      } catch (err: any) {
        console.error("Dashboard data load error:", err);
        setError(
          "Unable to load air quality telemetry. Please check network connection."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [mode]
  );

  // Initial load when mode changes
  useEffect(() => {
    loadData(false, mode);
  }, [mode, loadData]);

  // Automatic 45-second polling in LIVE mode
  useEffect(() => {
    if (mode !== "live") return;
    const interval = setInterval(() => {
      loadData(true, "live");
    }, LIVE_POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [mode, loadData]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadData()} />;
  }

  // Separate LIVE (AQI.in) vs HISTORICAL (CPCB) display metrics
  const isLiveMode = mode === "live";
  const latestHistorical = dailyHistory.length > 0 ? dailyHistory[dailyHistory.length - 1] : null;

  const currentAQI = isLiveMode
    ? selectedStation
      ? selectedStation.aqi
      : liveData?.aqi ?? null
    : latestHistorical?.aqi ?? null;

  const currentCategory = isLiveMode
    ? selectedStation
      ? selectedStation.category
      : liveData?.category ?? "Unavailable"
    : latestHistorical?.category ?? "Moderate";

  const currentDominant = isLiveMode
    ? selectedStation
      ? selectedStation.dominant_pollutant
      : liveData?.dominant_pollutant ?? null
    : latestHistorical?.dominant_pollutant ?? "PM2.5";

  const currentPM25 = isLiveMode
    ? selectedStation
      ? selectedStation.pm25
      : liveData?.pm25 ?? null
    : latestHistorical?.pm25 ?? null;

  const currentPM10 = isLiveMode
    ? selectedStation
      ? selectedStation.pm10
      : liveData?.pm10 ?? null
    : latestHistorical?.pm10 ?? null;

  const activeStationCount = liveData?.stations.length ?? 0;

  const locationDisplayName = isLiveMode
    ? selectedStation
      ? selectedStation.name
      : liveData?.location || "Delhi"
    : "IHBAS, Dilshad Garden (CPCB Historical)";

  const sourceLabel = isLiveMode ? liveData?.source || "AQI.in" : "Official CPCB Dataset";

  const currentPollutantMap = isLiveMode
    ? {
        pm25: selectedStation ? selectedStation.pm25 : liveData?.pm25 ?? null,
        pm10: selectedStation ? selectedStation.pm10 : liveData?.pm10 ?? null,
        no2: selectedStation ? selectedStation.no2 : liveData?.no2 ?? null,
        so2: selectedStation ? selectedStation.so2 : liveData?.so2 ?? null,
        co: selectedStation ? selectedStation.co : liveData?.co ?? null,
        o3: selectedStation ? selectedStation.o3 : liveData?.o3 ?? null,
        nh3: selectedStation ? selectedStation.nh3 : liveData?.nh3 ?? null,
      }
    : {
        pm25: latestHistorical?.pm25 ?? null,
        pm10: latestHistorical?.pm10 ?? null,
        no2: latestHistorical?.no2 ?? null,
        so2: latestHistorical?.so2 ?? null,
        co: latestHistorical?.co ?? null,
        o3: latestHistorical?.o3 ?? null,
        nh3: latestHistorical?.nh3 ?? null,
      };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <Header
        mode={mode}
        onModeChange={setMode}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        lastUpdated={liveData?.timestamp || null}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Disclosure Pill */}
        <DataStatus
          isCached={liveData?.is_cached ?? false}
          isAvailable={liveData?.is_available ?? false}
          staleMessage={liveData?.stale_message}
          source={sourceLabel}
          isHistorical={mode === "historical"}
        />

        {/* Selected Location Filter Bar (when a specific station is clicked in Live Mode) */}
        {isLiveMode && selectedStation && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Viewing Station: <strong className="text-slate-900 dark:text-white">{selectedStation.name}</strong> ({selectedStation.city}) &bull; Source: <strong>AQI.in</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Delhi Regional AQI
            </button>
          </div>
        )}

        {/* Top 4 KPI Cards */}
        <AQICard
          aqi={currentAQI}
          category={currentCategory}
          dominantPollutant={currentDominant}
          pm25={currentPM25}
          pm10={currentPM10}
          activeStations={activeStationCount}
          source={sourceLabel}
          timestamp={isLiveMode ? liveData?.timestamp : latestHistorical?.date}
          locationName={locationDisplayName}
        />

        {/* Gauge & Sub-Index Chart Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 xl:col-span-5">
            <AQIGauge
              aqi={currentAQI}
              category={currentCategory}
              dominantPollutant={currentDominant}
              stationName={locationDisplayName}
              source={sourceLabel}
            />
          </div>
          <div className="lg:col-span-6 xl:col-span-7">
            <PollutantChart pollutants={currentPollutantMap} />
          </div>
        </div>

        {/* LIVE MODE CONTENT */}
        {mode === "live" && (
          <div className="space-y-6">
            {/* Interactive NCR Map */}
            {liveData && liveData.stations && (
              <NCRMap
                stations={liveData.stations}
                onSelectStation={(st) => setSelectedStation(st)}
                selectedStationId={selectedStation?.id}
              />
            )}

            {/* 72-Hour Forecast Section */}
            <ForecastChart forecastData={forecastData} />

            {/* Comprehensive Station Table */}
            {liveData && liveData.stations && (
              <StationTable
                stations={liveData.stations}
                onSelectStation={(st) => setSelectedStation(st)}
              />
            )}

            {/* Criteria Pollutants Details */}
            <PollutantCard pollutants={currentPollutantMap} />

            {/* Machine Learning Model Performance */}
            <ModelMetrics metrics={metricsData} />
          </div>
        )}

        {/* HISTORICAL MODE CONTENT */}
        {mode === "historical" && (
          <div className="space-y-6">
            {/* Historical Time-Series Analysis */}
            <HistoricalChart
              dailyData={dailyHistory}
              hourlyData={hourlyHistory}
              forecastSeries={forecastData?.series}
            />

            {/* 72-Hour Forecast Section */}
            <ForecastChart forecastData={forecastData} />

            {/* Criteria Pollutants Details */}
            <PollutantCard pollutants={currentPollutantMap} />

            {/* Machine Learning Model Performance */}
            <ModelMetrics metrics={metricsData} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <strong>Delhi NCR Air Quality Intelligence Dashboard</strong> &bull; Live Source: AQI.in &bull; Historical Source: Official CPCB (2024–2025)
          </div>
          <div>
            Live AQI reflects direct AQI.in telemetry &bull; Historical analysis uses official CPCB NAQI methodology
          </div>
        </div>
      </footer>
    </div>
  );
};
