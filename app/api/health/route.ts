import { NextResponse } from "next/server";

import { getHealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

function buildHealthResponse(report: Awaited<ReturnType<typeof getHealthReport>>) {
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const report = await getHealthReport();
  return buildHealthResponse(report);
}

export async function HEAD() {
  const report = await getHealthReport();

  return new NextResponse(null, {
    status: report.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}