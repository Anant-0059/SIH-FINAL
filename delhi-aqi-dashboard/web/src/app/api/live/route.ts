import { NextRequest, NextResponse } from "next/server";
import { fetchAqiInLiveData } from "@/lib/aqiin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedStation = searchParams.get("station");

    // Fetch official live data directly from AQI.in
    const liveData = await fetchAqiInLiveData();

    if (!liveData.isAvailable || liveData.aqi === null) {
      return NextResponse.json(
        {
          source: "AQI.in",
          location: "Delhi",
          station: "Delhi Regional",
          aqi: null,
          category: "Unavailable",
          color: "#94a3b8",
          dominant_pollutant: null,
          description: "Live AQI temporarily unavailable",
          pm25: null,
          pm10: null,
          no2: null,
          so2: null,
          co: null,
          o3: null,
          nh3: null,
          stations: [],
          ncr_aqi: null,
          ncr_category: "Unavailable",
          ncr_dominant: null,
          is_cached: false,
          is_available: false,
          stale_message: "Live AQI temporarily unavailable",
          timestamp: new Date().toISOString(),
          fetched_at: new Date().toISOString(),
        },
        {
          status: 200,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // If a specific station was requested, locate that station
    let activeAqi = liveData.aqi;
    let activeStationName = liveData.station;
    let activePm25 = liveData.pm25;
    let activePm10 = liveData.pm10;
    let activeNo2 = liveData.no2;
    let activeSo2 = liveData.so2;
    let activeCo = liveData.co;
    let activeO3 = liveData.o3;
    let activeCategory = liveData.category;
    let activeColor = liveData.color;

    if (requestedStation) {
      const matched = liveData.stations.find(
        (s) =>
          s.id.toLowerCase() === requestedStation.toLowerCase() ||
          s.name.toLowerCase().includes(requestedStation.toLowerCase()) ||
          s.location.toLowerCase().includes(requestedStation.toLowerCase())
      );
      if (matched && matched.aqi !== null) {
        activeAqi = matched.aqi;
        activeStationName = matched.name;
        activePm25 = matched.pm25;
        activePm10 = matched.pm10;
        activeNo2 = matched.no2;
        activeSo2 = matched.so2;
        activeCo = matched.co;
        activeO3 = matched.o3;
        activeCategory = matched.category;
        activeColor = matched.color;
      }
    }

    const payload = {
      source: "AQI.in",
      location: liveData.location,
      station: activeStationName,
      aqi: activeAqi, // DIRECT AQI.in value
      category: activeCategory,
      color: activeColor,
      dominant_pollutant: liveData.dominant_pollutant,
      description: liveData.description,
      pm25: activePm25,
      pm10: activePm10,
      no2: activeNo2,
      so2: activeSo2,
      co: activeCo,
      o3: activeO3,
      nh3: null, // do not invent values for missing pollutants
      stations: liveData.stations,
      ncr_aqi: liveData.aqi, // Official Delhi AQI from AQI.in (NO MEDIAN/AVERAGE LOGIC)
      ncr_category: liveData.category,
      ncr_dominant: liveData.dominant_pollutant,
      is_cached: false,
      is_available: true,
      stale_message: null,
      timestamp: liveData.timestamp,
      fetched_at: liveData.fetchedAt,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (err: any) {
    console.error("[AQI.IN] GET /api/live error:", err);
    return NextResponse.json(
      {
        source: "AQI.in",
        location: "Delhi",
        station: "Delhi Regional",
        aqi: null,
        category: "Unavailable",
        color: "#94a3b8",
        dominant_pollutant: null,
        description: "Live AQI temporarily unavailable",
        pm25: null,
        pm10: null,
        no2: null,
        so2: null,
        co: null,
        o3: null,
        nh3: null,
        stations: [],
        ncr_aqi: null,
        ncr_category: "Unavailable",
        ncr_dominant: null,
        is_cached: false,
        is_available: false,
        stale_message: "Live AQI temporarily unavailable",
        timestamp: new Date().toISOString(),
        fetched_at: new Date().toISOString(),
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
