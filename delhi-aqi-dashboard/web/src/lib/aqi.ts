/**
 * aqi.ts
 * Official Indian Central Pollution Control Board (CPCB) National Air Quality Index (AQI) calculation.
 * EXACT TypeScript port of ml/aqi_cpcb.py.
 */

export interface BreakpointRange {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
}

export const CPCB_BREAKPOINTS: Record<string, BreakpointRange[]> = {
  pm25: [
    { bLo: 0.0, bHi: 30.0, iLo: 0, iHi: 50 },
    { bLo: 30.1, bHi: 60.0, iLo: 51, iHi: 100 },
    { bLo: 60.1, bHi: 90.0, iLo: 101, iHi: 200 },
    { bLo: 90.1, bHi: 120.0, iLo: 201, iHi: 300 },
    { bLo: 120.1, bHi: 250.0, iLo: 301, iHi: 400 },
    { bLo: 250.1, bHi: 380.0, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { bLo: 0.0, bHi: 50.0, iLo: 0, iHi: 50 },
    { bLo: 50.1, bHi: 100.0, iLo: 51, iHi: 100 },
    { bLo: 100.1, bHi: 250.0, iLo: 101, iHi: 200 },
    { bLo: 250.1, bHi: 350.0, iLo: 201, iHi: 300 },
    { bLo: 350.1, bHi: 430.0, iLo: 301, iHi: 400 },
    { bLo: 430.1, bHi: 510.0, iLo: 401, iHi: 500 },
  ],
  no2: [
    { bLo: 0.0, bHi: 40.0, iLo: 0, iHi: 50 },
    { bLo: 40.1, bHi: 80.0, iLo: 51, iHi: 100 },
    { bLo: 80.1, bHi: 180.0, iLo: 101, iHi: 200 },
    { bLo: 180.1, bHi: 280.0, iLo: 201, iHi: 300 },
    { bLo: 280.1, bHi: 400.0, iLo: 301, iHi: 400 },
    { bLo: 400.1, bHi: 800.0, iLo: 401, iHi: 500 },
  ],
  so2: [
    { bLo: 0.0, bHi: 40.0, iLo: 0, iHi: 50 },
    { bLo: 40.1, bHi: 80.0, iLo: 51, iHi: 100 },
    { bLo: 80.1, bHi: 380.0, iLo: 101, iHi: 200 },
    { bLo: 381.0, bHi: 800.0, iLo: 201, iHi: 300 },
    { bLo: 800.1, bHi: 1600.0, iLo: 301, iHi: 400 },
    { bLo: 1600.1, bHi: 3200.0, iLo: 401, iHi: 500 },
  ],
  co: [
    { bLo: 0.0, bHi: 1.0, iLo: 0, iHi: 50 },
    { bLo: 1.01, bHi: 2.0, iLo: 51, iHi: 100 },
    { bLo: 2.01, bHi: 10.0, iLo: 101, iHi: 200 },
    { bLo: 10.01, bHi: 17.0, iLo: 201, iHi: 300 },
    { bLo: 17.01, bHi: 34.0, iLo: 301, iHi: 400 },
    { bLo: 34.01, bHi: 50.0, iLo: 401, iHi: 500 },
  ],
  o3: [
    { bLo: 0.0, bHi: 50.0, iLo: 0, iHi: 50 },
    { bLo: 50.1, bHi: 100.0, iLo: 51, iHi: 100 },
    { bLo: 100.1, bHi: 168.0, iLo: 101, iHi: 200 },
    { bLo: 168.1, bHi: 208.0, iLo: 201, iHi: 300 },
    { bLo: 208.1, bHi: 748.0, iLo: 301, iHi: 400 },
    { bLo: 748.1, bHi: 1000.0, iLo: 401, iHi: 500 },
  ],
  nh3: [
    { bLo: 0.0, bHi: 200.0, iLo: 0, iHi: 50 },
    { bLo: 200.1, bHi: 400.0, iLo: 51, iHi: 100 },
    { bLo: 400.1, bHi: 800.0, iLo: 101, iHi: 200 },
    { bLo: 800.1, bHi: 1200.0, iLo: 201, iHi: 300 },
    { bLo: 1200.1, bHi: 1800.0, iLo: 301, iHi: 400 },
    { bLo: 1800.1, bHi: 2400.0, iLo: 401, iHi: 500 },
  ],
};

export interface AQICategoryDetails {
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  color: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  description: string;
  healthAdvisory: string;
}

export function getCategoryInfo(aqi: number): AQICategoryDetails {
  const rounded = Math.round(aqi);
  if (rounded <= 50) {
    return {
      category: "Good",
      color: "#16a34a",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
      textColor: "text-emerald-700 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      description: "Minimal impact",
      healthAdvisory: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
    };
  } else if (rounded <= 100) {
    return {
      category: "Satisfactory",
      color: "#65a30d",
      bgLight: "bg-lime-50 dark:bg-lime-950/40",
      textColor: "text-lime-700 dark:text-lime-400",
      borderColor: "border-lime-200 dark:border-lime-800",
      description: "Minor breathing discomfort to sensitive people",
      healthAdvisory: "Sensitive people should consider reducing prolonged or heavy outdoor exertion.",
    };
  } else if (rounded <= 200) {
    return {
      category: "Moderate",
      color: "#ca8a04",
      bgLight: "bg-amber-50 dark:bg-amber-950/40",
      textColor: "text-amber-700 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      description: "Breathing discomfort to people with lungs, asthma and heart diseases",
      healthAdvisory: "People with respiratory or cardiac conditions should limit sustained outdoor exposure.",
    };
  } else if (rounded <= 300) {
    return {
      category: "Poor",
      color: "#ea580c",
      bgLight: "bg-orange-50 dark:bg-orange-950/40",
      textColor: "text-orange-700 dark:text-orange-400",
      borderColor: "border-orange-200 dark:border-orange-800",
      description: "Breathing discomfort to most people on prolonged exposure",
      healthAdvisory: "Everyone should reduce outdoor activities. Sensitive groups should stay indoors.",
    };
  } else if (rounded <= 400) {
    return {
      category: "Very Poor",
      color: "#dc2626",
      bgLight: "bg-red-50 dark:bg-red-950/40",
      textColor: "text-red-700 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
      description: "Respiratory illness on prolonged exposure",
      healthAdvisory: "Avoid vigorous outdoor activities. Wear N95 masks if stepping outside.",
    };
  } else {
    return {
      category: "Severe",
      color: "#7f1d1d",
      bgLight: "bg-rose-100 dark:bg-rose-950/50",
      textColor: "text-rose-900 dark:text-rose-300",
      borderColor: "border-rose-400 dark:border-rose-800",
      description: "Affects healthy people and seriously impacts those with existing diseases",
      healthAdvisory: "Emergency condition. Remain indoors with air purifiers active. High risk for everyone.",
    };
  }
}

export function calculateSubIndex(pollutant: string, conc: number | null | undefined): number | null {
  if (conc === null || conc === undefined || conc < 0 || isNaN(conc)) {
    return null;
  }
  const key = pollutant.toLowerCase().replace(/[^a-z0-9]/g, "");
  const table = CPCB_BREAKPOINTS[key];
  if (!table) return null;

  for (const { bLo, bHi, iLo, iHi } of table) {
    if (conc <= bHi) {
      const cVal = Math.max(conc, bLo);
      const sub = iLo + ((iHi - iLo) / (bHi - bLo)) * (cVal - bLo);
      return Math.round(sub * 10) / 10;
    }
  }
  // If concentration exceeds highest breakpoint, cap at 500 ceiling
  return 500.0;
}

export interface CPCBCalculationResult {
  aqi: number | null;
  category: string;
  color: string;
  description: string;
  dominant_pollutant: string | null;
  sub_indices: Record<string, number>;
  is_valid_cpcb: boolean;
}

const NAME_MAP: Record<string, string> = {
  pm25: "PM2.5",
  pm10: "PM10",
  no2: "NO2",
  so2: "SO2",
  co: "CO",
  o3: "Ozone (O3)",
  nh3: "NH3",
};

export function calculateCPCBIndex(
  pollutants: Record<string, number | null | undefined>,
  enforceMinimumRule: boolean = true
): CPCBCalculationResult {
  const subIndices: Record<string, number> = {};

  for (const [key, val] of Object.entries(pollutants)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (val !== null && val !== undefined && !isNaN(val)) {
      const sub = calculateSubIndex(cleanKey, Number(val));
      if (sub !== null) {
        subIndices[cleanKey] = sub;
      }
    }
  }

  const hasParticulate = "pm25" in subIndices || "pm10" in subIndices;
  const hasSufficient = Object.keys(subIndices).length >= 3;

  if (enforceMinimumRule && (!hasParticulate || !hasSufficient)) {
    return {
      aqi: null,
      category: "Insufficient Data",
      color: "#9ca3af",
      description: "Requires at least 3 pollutants including PM2.5 or PM10 as per CPCB criteria",
      dominant_pollutant: null,
      sub_indices: subIndices,
      is_valid_cpcb: false,
    };
  }

  const keys = Object.keys(subIndices);
  if (keys.length === 0) {
    return {
      aqi: null,
      category: "No Data",
      color: "#9ca3af",
      description: "No pollutant measurements provided",
      dominant_pollutant: null,
      sub_indices: {},
      is_valid_cpcb: false,
    };
  }

  let dominant = keys[0];
  let maxSub = subIndices[dominant];

  for (const k of keys) {
    if (subIndices[k] > maxSub) {
      maxSub = subIndices[k];
      dominant = k;
    }
  }

  const aqi = Math.round(maxSub);
  const catInfo = getCategoryInfo(aqi);

  return {
    aqi,
    category: catInfo.category,
    color: catInfo.color,
    description: catInfo.description,
    dominant_pollutant: NAME_MAP[dominant] || dominant.toUpperCase(),
    sub_indices: subIndices,
    is_valid_cpcb: true,
  };
}
