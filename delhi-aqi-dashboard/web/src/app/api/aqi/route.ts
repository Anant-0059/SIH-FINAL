import { NextRequest, NextResponse } from "next/server";
import { calculateCPCBIndex } from "@/lib/aqi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Pass allow relax minimum rule if single or double input test, or strict CPCB
    const enforceMinimum = body.enforce_minimum !== false;
    const result = calculateCPCBIndex(body, enforceMinimum);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error calculating AQI", details: err.message },
      { status: 500 }
    );
  }
}
