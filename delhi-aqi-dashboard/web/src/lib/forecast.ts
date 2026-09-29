/**
 * forecast.ts
 * Types and utilities for scientific 72-hour multi-pollutant & CPCB AQI forecast data.
 */

export interface ForecastMeteorology {
  temp: number;
  humidity: number;
  wind_speed: number;
  wind_dir: number;
  pbl_height: number;
  ventilation_coeff: number;
  inversion_strength: number;
  precipitation: number;
  solar_radiation: number;
}

export interface AtmosphericRegimes {
  stagnant: boolean;
  shallow_pbl: boolean;
  strong_inversion: boolean;
  rain_scavenging: boolean;
  stubble_risk: boolean;
}

export interface ForecastPoint {
  timestamp: string;
  horizon_hours: number;
  is_anchor: boolean;
  aqi: number;
  aqi_lower: number;
  aqi_upper: number;
  category: string;
  dominant_pollutant: string;
  pollutants: Record<string, number>;
  pollutant_bounds?: Record<string, { lower: number; upper: number }>;
  meteorology?: ForecastMeteorology;
  regimes?: AtmosphericRegimes;
}

export interface MilestoneForecast {
  horizon: string;
  timestamp: string;
  aqi: number;
  category: string;
  dominant_pollutant: string;
  aqi_lower: number;
  aqi_upper: number;
  pollutants?: Record<string, number>;
  meteorology?: ForecastMeteorology;
  regimes?: AtmosphericRegimes;
}

export interface ForecastProvenance {
  forecast_generated_at: string;
  data_cutoff_time: string;
  weather_forecast_run: string;
  model_version: string;
  training_data_end: string;
  model_name: string;
  location: string;
  live_anchor_source?: string;
}

export interface ForecastPayload {
  generated_at: string;
  anchor_timestamp: string;
  disclaimer: string;
  provenance?: ForecastProvenance;
  milestones: {
    "24h": MilestoneForecast;
    "48h": MilestoneForecast;
    "72h": MilestoneForecast;
  };
  series: ForecastPoint[];
}
