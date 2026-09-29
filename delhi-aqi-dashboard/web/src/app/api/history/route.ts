import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resolution = searchParams.get("resolution") || "daily";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pollutant = searchParams.get("pollutant");

  const fileName = resolution === "hourly" ? "hourly_aqi.json" : "daily_aqi.json";
  const filePath = path.join(process.cwd(), "public", "data", fileName);

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    let data = JSON.parse(raw);

    // Filter by date range
    if (from) {
      data = data.filter((item: any) => {
        const itemDate = item.date || item.timestamp;
        return itemDate >= from;
      });
    }
    if (to) {
      data = data.filter((item: any) => {
        const itemDate = item.date || item.timestamp;
        return itemDate <= to;
      });
    }

    // Filter specific pollutant if requested
    if (pollutant && pollutant !== "aqi") {
      const cleanPol = pollutant.toLowerCase().replace(/[^a-z0-9]/g, "");
      data = data.map((item: any) => ({
        date: item.date || item.timestamp,
        timestamp: item.timestamp,
        [cleanPol]: item[cleanPol] ?? null,
        aqi: item.aqi,
        category: item.category,
      }));
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load historical data" }, { status: 500 });
  }
}
