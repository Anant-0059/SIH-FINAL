"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { StationData } from "@/lib/api";
import { getCategoryInfo } from "@/lib/aqi";
import { MapPin, X, ExternalLink, Wind, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Leaflet components must be loaded dynamically with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface NCRMapProps {
  stations: StationData[];
  onSelectStation?: (station: StationData) => void;
  selectedStationId?: string | null;
}

export const NCRMap: React.FC<NCRMapProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  const [activeStation, setActiveStation] = useState<StationData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      const found = stations.find((s) => s.id === selectedStationId);
      if (found) setActiveStation(found);
    }
  }, [selectedStationId, stations]);

  // Center of Delhi NCR
  const center: [number, number] = [28.6139, 77.209];

  if (!mounted) {
    return (
      <div className="h-[460px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading Interactive Delhi NCR Station Map...
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span>Interactive Delhi NCR Air Quality Map</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time monitoring across 9 NCR cities &bull; Click marker for detailed breakdown
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{stations.length} Active Stations</span>
        </div>
      </div>

      {/* Map View */}
      <div className="h-[440px] w-full rounded-xl overflow-hidden relative z-10 border border-slate-200/80 dark:border-slate-700/80">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {stations.map((st) => {
            const cat = st.aqi !== null ? getCategoryInfo(st.aqi) : { color: "#94a3b8" };
            const isSelected = activeStation?.id === st.id;

            return (
              <CircleMarker
                key={st.id}
                center={[st.lat, st.lon]}
                radius={isSelected ? 12 : 9}
                pathOptions={{
                  fillColor: cat.color,
                  fillOpacity: 0.85,
                  color: isSelected ? "#0f172a" : "#ffffff",
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => {
                    setActiveStation(st);
                    if (onSelectStation) onSelectStation(st);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <h4 className="font-bold text-slate-900">{st.name}</h4>
                    <p className="text-[11px] text-slate-500">{st.city}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-black">{st.aqi ?? "N/A"}</span>
                      <span className="font-bold text-xs" style={{ color: cat.color }}>
                        {st.category}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 space-y-0.5">
                      <p>PM2.5: <strong>{st.pm25 ?? "--"} µg/m³</strong></p>
                      <p>PM10: <strong>{st.pm10 ?? "--"} µg/m³</strong></p>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Updated: {formatDateTime(st.last_updated)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Selected Station Slide-Over Panel */}
        {activeStation && (
          <div className="absolute top-3 right-3 z-[1000] w-80 max-w-[calc(100%-24px)] rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-xl text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeStation.name}
                </h4>
                <p className="text-slate-400 font-medium">{activeStation.city}</p>
              </div>
              <button
                onClick={() => setActiveStation(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AQI Overview */}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Current AQI
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {activeStation.aqi ?? "N/A"}
                  </span>
                  <span
                    className="font-bold text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getCategoryInfo(activeStation.aqi || 0).color}20`,
                      color: getCategoryInfo(activeStation.aqi || 0).color,
                    }}
                  >
                    {activeStation.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Dominant
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeStation.dominant_pollutant || "PM2.5"}
                </p>
              </div>
            </div>

            {/* Pollutants Table */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block">PM2.5</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeStation.pm25} µg/m³
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block">PM10</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeStation.pm10} µg/m³
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block">NO2</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeStation.no2} µg/m³
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block">SO2</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeStation.so2} µg/m³
                </strong>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-400">
              Telemetry updated: {formatDateTime(activeStation.last_updated)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
