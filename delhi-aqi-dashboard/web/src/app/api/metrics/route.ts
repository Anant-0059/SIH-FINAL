import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "data", "metrics.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load model metrics" }, { status: 500 });
  }
}
