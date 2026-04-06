import { NextResponse } from "next/server";

import { getHealthReport } from "@/lib/health";
import { createRequestId } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

function buildHealthResponse(report: Awaited<ReturnType<typeof getHealthReport>>, requestId: string) {
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Request-Id": requestId,
    },
  });
}

export async function GET() {
  const requestId = createRequestId();
  const report = await getHealthReport();
  return buildHealthResponse(report, requestId);
}

export async function HEAD() {
  const requestId = createRequestId();
  const report = await getHealthReport();

  return new NextResponse(null, {
    status: report.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Request-Id": requestId,
    },
  });
}