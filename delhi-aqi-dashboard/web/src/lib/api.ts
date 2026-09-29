/**
 * api.ts
 * Client fetching library and type definitions for Delhi NCR AQI Dashboard.
 */

import { ForecastPayload } from "./forecast";

export interface StationData {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  aqi: number | null;
  category: string;
  color: string;
  dominant_pollutant: string | null;
  description: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
  sub_indices: Record<string, number>;
  last_updated: string;
  is_live?: boolean;
}

export interface DailyRecord {
  date: string;
  aqi: number | null;
  category: string;
  dominant_pollutant: string | null;
  color: string;
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
  nh3?: number | null;
  valid_hours?: number;
  sub_pm25?: number;
  sub_pm10?: number;
  sub_no2?: number;
  sub_so2?: number;
  sub_co?: number;
  sub_o3?: number;
  sub_nh3?: number;
}

export interface HourlyRecord {
  timestamp: string;
  aqi: number | null;
  category: string;
  dominant_pollutant: string | null;
  color: string;
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
  nh3?: number | null;
}

export interface ModelMetricDetails {
  mae: number;
  rmse: number;
  r2: number;
  test_samples: number;
}

export interface MetricsPayload {
  pollutants: Record<string, Record<string, ModelMetricDetails>>;
  composite_aqi: Record<string, {
    aqi_mae: number;
    aqi_rmse: number;
    aqi_r2: number;
    category_accuracy_pct: number;
    evaluated_timesteps: number;
  }>;
  split_method: string;
  engineered_features: string[];
}

export interface SummaryPayload {
  app_title: string;
  station_name: string;
  station_id: string;
  city: string;
  current: {
    timestamp: string;
    aqi: number;
    category: string;
    color: string;
    dominant_pollutant: string;
    description: string;
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
    nh3: number;
    active_stations: number;
  };
  historical_overview: {
    total_days_monitored: number;
    date_range: string;
    mean_aqi: number;
    median_aqi: number;
    min_aqi: number;
    max_aqi: number;
    good_days: number;
    satisfactory_days: number;
    moderate_days: number;
    poor_days: number;
    very_poor_days: number;
    severe_days: number;
  };
  forecast_milestones: any;
}

export interface LiveResponse {
  source: string;
  location: string;
  station: string;
  aqi: number | null;
  category: string;
  color: string;
  dominant_pollutant: string | null;
  description: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
  stations: StationData[];
  ncr_aqi: number | null;
  ncr_category: string;
  ncr_dominant: string | null;
  is_cached: boolean;
  is_available: boolean;
  stale_message: string | null;
  timestamp: string;
  fetched_at: string;
}

export async function fetchLiveAQI(stationId?: string): Promise<LiveResponse> {
  const url = stationId ? `/api/live?station=${encodeURIComponent(stationId)}` : "/api/live";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Live API error: ${res.statusText}`);
  return res.json();
}

export async function fetchStations(): Promise<StationData[]> {
  const res = await fetch("/api/stations");
  if (!res.ok) throw new Error(`Stations API error: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(resolution: "daily" | "hourly" = "daily"): Promise<DailyRecord[] | HourlyRecord[]> {
  const res = await fetch(`/api/history?resolution=${resolution}`);
  if (!res.ok) throw new Error(`History API error: ${res.statusText}`);
  return res.json();
}

export async function fetchForecast(mode: "live" | "historical" = "live"): Promise<ForecastPayload> {
  const res = await fetch(`/api/forecast?mode=${mode}`);
  if (!res.ok) throw new Error(`Forecast API error: ${res.statusText}`);
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsPayload> {
  const res = await fetch("/api/metrics");
  if (!res.ok) throw new Error(`Metrics API error: ${res.statusText}`);
  return res.json();
}

export async function postCalculateAQI(pollutants: Record<string, number | null>) {
  const res = await fetch("/api/aqi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pollutants),
  });
  if (!res.ok) throw new Error(`AQI Calc API error: ${res.statusText}`);
  return res.json();
}
