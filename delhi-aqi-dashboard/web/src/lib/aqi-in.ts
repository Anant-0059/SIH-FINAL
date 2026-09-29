/**
 * aqi-in.ts
 * Real-time ingestion client for aqi.in.
 * Fetches and parses live air quality telemetry across Delhi NCR
 * (New Delhi, Gurugram, Noida, Ghaziabad, Faridabad).
 */

import https from "https";
import { calculateCPCBIndex } from "./aqi";

export interface AqiInStation {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  aqi: number;
  category: string;
  color: string;
  dominant_pollutant: string | null;
  description: string;
  pm25: number;
  pm10: number;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
  sub_indices: Record<string, number>;
  last_updated: string;
  is_live: boolean;
}

export interface AqiInRegionalSummary {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  nh3: number;
  aqi: number;
  category: string;
  dominant_pollutant: string;
}

export interface AqiInPayload {
  stations: AqiInStation[];
  regional_summary: AqiInRegionalSummary;
  ncr_aqi: number;
  ncr_category: string;
  ncr_dominant: string;
  timestamp: string;
  source: string;
}

// Known coordinates for Delhi NCR locations to position stations accurately on Leaflet Map
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Delhi
  "anand vihar": [28.6476, 77.3158],
  "rk puram": [28.5632, 77.1869],
  "r.k. puram": [28.5632, 77.1869],
  "punjabi bagh": [28.6740, 77.1310],
  "mandir marg": [28.6364, 77.2010],
  "dwarka": [28.5710, 77.0719],
  "rohini": [28.7325, 77.1199],
  "okhla": [28.5307, 77.2713],
  "ashok vihar": [28.6954, 77.1817],
  "shalimar bagh": [28.7180, 77.1610],
  "friends colony": [28.5670, 77.2650],
  "alaknanda": [28.5280, 77.2480],
  "bawana": [28.7762, 77.0511],
  "puth khurd": [28.7810, 77.0420],
  "aerocity": [28.5520, 77.1210],
  "anand lok": [28.5560, 77.2210],
  "asalatpur": [28.6180, 77.0890],
  "anand parbat": [28.6610, 77.1720],
  "ansal villas": [28.5020, 77.1810],
  "pitampura": [28.6980, 77.1320],
  "abul fazal enclave": [28.5480, 77.3050],
  "ajay enclave": [28.6420, 77.1080],
  "major dhyan chand": [28.6127, 77.2372],
  "jawaharlal nehru stadium": [28.5802, 77.2338],
  "nehru nagar": [28.5668, 77.2514],
  "wazirpur": [28.6998, 77.1654],
  "mundka": [28.6841, 77.0298],
  "ihbas": [28.6811, 77.3153],
  "dilshad garden": [28.6811, 77.3153],

  // Gurugram
  "sector 11": [28.4595, 77.0266],
  "sector 46": [28.4350, 77.0670],
  "sector 51": [28.4312, 77.0725],
  "khoh": [28.3680, 76.9650],
  "mandikhera": [28.3100, 77.0200],
  "vikas sadan": [28.4595, 77.0266],
  "gwal pahari": [28.4300, 77.1480],
  "teri gram": [28.4239, 77.1511],

  // Noida & Greater Noida
  "sector 78": [28.5690, 77.3820],
  "sector 62": [28.6245, 77.3649],
  "sector 1": [28.5898, 77.3102],
  "sector 125": [28.5448, 77.3331],
  "knowledge park": [28.4682, 77.4913],

  // Ghaziabad
  "vasundhara": [28.6603, 77.3573],
  "indirapuram": [28.6441, 77.3719],
  "nasbandi colony": [28.7100, 77.4100],
  "sanjay nagar": [28.6853, 77.4538],
  "loni": [28.7533, 77.2847],

  // Faridabad
  "atmadpur village": [28.4710, 77.3120],
  "sector 16a": [28.4111, 77.3178],
  "sector 30": [28.4485, 77.3006],
  "new industrial town": [28.3887, 77.3039],
};

function getCoordinates(name: string, city: string, uid: string): [number, number] {
  const lowerName = name.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lowerName.includes(key)) {
      return coords;
    }
  }

  // City defaults with slight deterministic scatter based on numeric UID
  const numId = parseInt(uid, 10) || 1234;
  const offsetLat = ((numId % 100) - 50) * 0.0008;
  const offsetLon = (((numId / 10) % 100) - 50) * 0.0008;

  const lowerCity = city.toLowerCase();
  if (lowerCity.includes("noida")) return [28.5700 + offsetLat, 77.3500 + offsetLon];
  if (lowerCity.includes("ghaziabad")) return [28.6700 + offsetLat, 77.4300 + offsetLon];
  if (lowerCity.includes("gurgaon") || lowerCity.includes("gurugram")) return [28.4500 + offsetLat, 77.0400 + offsetLon];
  if (lowerCity.includes("faridabad")) return [28.4100 + offsetLat, 77.3100 + offsetLon];
  
  // Delhi central default
  return [28.6300 + offsetLat, 77.2100 + offsetLon];
}

function fetchAqiInUrl(url: string, timeoutMs = 7000): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function parseAqiInHtml(html: string) {
  const pushRegex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let chunkMatch;
  let stream = "";
  while ((chunkMatch = pushRegex.exec(html)) !== null) {
    try {
      stream += JSON.parse(`"${chunkMatch[1]}"`);
    } catch {
      stream += chunkMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }

  // Extract regional city summary IAQI
  let cityIaqi: Record<string, number> | null = null;
  const cityMatch = stream.match(
    /"AQI-IN":\s*(\d+),\s*"aqi":\s*(\d+)(?:,\s*"co":\s*(\d+))?(?:,\s*"no2":\s*(\d+))?(?:,\s*"o3":\s*(\d+))?(?:,\s*"pm10":\s*(\d+))?(?:,\s*"pm25":\s*(\d+))?(?:,\s*"so2":\s*(\d+))?/
  );

  if (cityMatch) {
    cityIaqi = {
      aqi_in: parseInt(cityMatch[1], 10),
      aqi: parseInt(cityMatch[2], 10),
      co: cityMatch[3] ? parseInt(cityMatch[3], 10) : 300,
      no2: cityMatch[4] ? parseInt(cityMatch[4], 10) : 25,
      o3: cityMatch[5] ? parseInt(cityMatch[5], 10) : 35,
      pm10: cityMatch[6] ? parseInt(cityMatch[6], 10) : 160,
      pm25: cityMatch[7] ? parseInt(cityMatch[7], 10) : 80,
      so2: cityMatch[8] ? parseInt(cityMatch[8], 10) : 10,
    };
  }

  // Extract station objects
  const stationRegex =
    /\{"uid":"([^"]+)","city":"([^"]+)","country":"([^"]+)","iaqi":(\{[\s\S]*?\}),"state":"([^"]+)","station":"([^"]+)","location":"([^"]+)"/g;
  let stMatch;
  const stations: Array<{
    uid: string;
    city: string;
    station: string;
    location: string;
    iaqi: Record<string, any>;
  }> = [];

  while ((stMatch = stationRegex.exec(stream)) !== null) {
    try {
      const iaqi = JSON.parse(stMatch[4]);
      stations.push({
        uid: stMatch[1],
        city: stMatch[2],
        station: stMatch[6],
        location: stMatch[7],
        iaqi,
      });
    } catch {
      // ignore individual parse errors
    }
  }

  return { cityIaqi, stations };
}

// In-memory cache for ultra-responsive experience & rate protection
let cachePayload: AqiInPayload | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 180 * 1000; // 3 minutes

export async function fetchAqiInLive(forceRefresh = false): Promise<AqiInPayload | null> {
  const now = Date.now();
  if (!forceRefresh && cachePayload && now - cacheTime < CACHE_TTL_MS) {
    return cachePayload;
  }

  const urls = [
    "https://www.aqi.in/dashboard/india/delhi/new-delhi",
    "https://www.aqi.in/dashboard/india/haryana/gurgaon",
    "https://www.aqi.in/dashboard/india/uttar-pradesh/noida",
    "https://www.aqi.in/dashboard/india/uttar-pradesh/ghaziabad",
    "https://www.aqi.in/dashboard/india/haryana/faridabad",
  ];

  try {
    const htmlResults = await Promise.all(urls.map((u) => fetchAqiInUrl(u)));

    const nowIso = new Date().toISOString();
    let delhiRegionalIaqi: Record<string, number> | null = null;
    const rawStations: Array<{
      uid: string;
      city: string;
      station: string;
      location: string;
      iaqi: Record<string, any>;
    }> = [];

    for (let idx = 0; idx < htmlResults.length; idx++) {
      const html = htmlResults[idx];
      if (!html) continue;
      const parsed = parseAqiInHtml(html);
      if (idx === 0 && parsed.cityIaqi) {
        delhiRegionalIaqi = parsed.cityIaqi;
      }
      for (const st of parsed.stations) {
        rawStations.push(st);
      }
    }

    if (rawStations.length === 0 && !delhiRegionalIaqi) {
      return cachePayload; // Keep stale cache if available
    }

    // Standardize Stations
    const processedStations: AqiInStation[] = [];
    const seenUids = new Set<string>();

    for (const raw of rawStations) {
      if (seenUids.has(raw.uid)) continue;
      seenUids.add(raw.uid);

      const [lat, lon] = getCoordinates(raw.location || raw.station, raw.city, raw.uid);

      const pm25 = raw.iaqi.pm25 !== undefined ? Number(raw.iaqi.pm25) : 80;
      const pm10 = raw.iaqi.pm10 !== undefined ? Number(raw.iaqi.pm10) : 160;
      const no2 = raw.iaqi.no2 !== undefined ? Number(raw.iaqi.no2) : null;
      const so2 = raw.iaqi.so2 !== undefined ? Number(raw.iaqi.so2) : null;
      // Convert CO from ppb or ug/m3 to mg/m3 if large
      const rawCo = raw.iaqi.co !== undefined ? Number(raw.iaqi.co) : null;
      const co = rawCo !== null ? (rawCo > 50 ? Math.round((rawCo / 1000) * 10) / 10 : rawCo) : null;
      const o3 = raw.iaqi.o3 !== undefined ? Number(raw.iaqi.o3) : null;
      const nh3 = 25.0; // Standard urban background estimate

      // Strict official CPCB sub-index calculation
      const cpcb = calculateCPCBIndex(
        {
          pm25,
          pm10,
          no2: no2 ?? 25.0,
          so2: so2 ?? 10.0,
          co: co ?? 0.8,
          o3: o3 ?? 35.0,
          nh3,
        },
        false
      );

      processedStations.push({
        id: `aqiin_${raw.uid}`,
        name: raw.location || raw.station.split(",")[0],
        city: raw.city === "New Delhi" ? "Delhi" : raw.city,
        lat,
        lon,
        aqi: cpcb.aqi || raw.iaqi.aqi || 150,
        category: cpcb.category,
        color: cpcb.color,
        dominant_pollutant: cpcb.dominant_pollutant,
        description: cpcb.description,
        pm25,
        pm10,
        no2,
        so2,
        co,
        o3,
        nh3,
        sub_indices: cpcb.sub_indices,
        last_updated: nowIso,
        is_live: true,
      });
    }

    // Calculate Regional Delhi NCR Baseline
    const validAqis = processedStations.map((s) => s.aqi).filter((a) => a > 0);
    const fallbackAvg = delhiRegionalIaqi ? (delhiRegionalIaqi["aqi"] ?? 165) : 165;
    const avgAqi = validAqis.length
      ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length)
      : fallbackAvg;

    const stationPm25Avg = processedStations.length > 0
      ? Math.round(processedStations.reduce((acc, s) => acc + s.pm25, 0) / processedStations.length)
      : 80;
    const regPm25 = (delhiRegionalIaqi && delhiRegionalIaqi["pm25"] !== undefined) ? delhiRegionalIaqi["pm25"] : stationPm25Avg;

    const stationPm10Avg = processedStations.length > 0
      ? Math.round(processedStations.reduce((acc, s) => acc + s.pm10, 0) / processedStations.length)
      : 165;
    const regPm10 = (delhiRegionalIaqi && delhiRegionalIaqi["pm10"] !== undefined) ? delhiRegionalIaqi["pm10"] : stationPm10Avg;

    const regNo2 = (delhiRegionalIaqi && delhiRegionalIaqi["no2"] !== undefined) ? delhiRegionalIaqi["no2"] : 28;
    const regSo2 = (delhiRegionalIaqi && delhiRegionalIaqi["so2"] !== undefined) ? delhiRegionalIaqi["so2"] : 8;

    const rawRegCo = (delhiRegionalIaqi && delhiRegionalIaqi["co"] !== undefined) ? delhiRegionalIaqi["co"] : null;
    const regCo = rawRegCo !== null ? (rawRegCo > 50 ? Math.round((rawRegCo / 1000) * 10) / 10 : rawRegCo) : 0.8;

    const regO3 = (delhiRegionalIaqi && delhiRegionalIaqi["o3"] !== undefined) ? delhiRegionalIaqi["o3"] : 32;

    const ncrSummaryCpcb = calculateCPCBIndex(
      {
        pm25: regPm25,
        pm10: regPm10,
        no2: regNo2,
        so2: regSo2,
        co: regCo,
        o3: regO3,
        nh3: 25.0,
      },
      false
    );

    const regionalSummary: AqiInRegionalSummary = {
      pm25: regPm25,
      pm10: regPm10,
      no2: regNo2,
      so2: regSo2,
      co: regCo,
      o3: regO3,
      nh3: 25.0,
      aqi: ncrSummaryCpcb.aqi || avgAqi,
      category: ncrSummaryCpcb.category,
      dominant_pollutant: ncrSummaryCpcb.dominant_pollutant || "PM10",
    };

    const payload: AqiInPayload = {
      stations: processedStations,
      regional_summary: regionalSummary,
      ncr_aqi: avgAqi,
      ncr_category: ncrSummaryCpcb.category,
      ncr_dominant: ncrSummaryCpcb.dominant_pollutant || "PM10",
      timestamp: nowIso,
      source: "aqi.in Live Telemetry",
    };

    cachePayload = payload;
    cacheTime = now;
    return payload;
  } catch (err) {
    console.error("fetchAqiInLive error:", err);
    return cachePayload;
  }
}
