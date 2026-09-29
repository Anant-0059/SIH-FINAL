import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceState } from "@/lib/db/store";
import {
  generateExportFileBuffer,
  ExportFileFormat,
} from "@/lib/documents/exporter";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = ((searchParams.get("format") || "DOCX").toUpperCase() as ExportFileFormat);
    const artifactId = searchParams.get("artifactId") || "";
    const customTitle = searchParams.get("title") || "";
    const customContent = searchParams.get("content") || "";

    const state = getWorkspaceState();
    const artifact =
      state.artifacts.find((a) => a.id === artifactId) || state.artifacts[0];

    const title =
      customTitle ||
      artifact?.title ||
      "AVRENYX Sovereign Multi-AI Report";
    const content =
      customContent ||
      artifact?.content ||
      "# AVRENYX Deliverable\nGenerated and validated.";

    const pkg = await generateExportFileBuffer({
      title,
      content,
      format,
    });

    return new NextResponse(new Uint8Array(pkg.buffer), {
      status: 200,
      headers: {
        "Content-Type": pkg.mimeType,
        "Content-Disposition": `attachment; filename="${pkg.fileName}"`,
        "X-AVRENYX-Validation-Passed": String(pkg.validationPassed),
        "X-AVRENYX-Size-Bytes": String(pkg.sizeBytes),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Export failed",
      },
      { status: 500 }
    );
  }
}
