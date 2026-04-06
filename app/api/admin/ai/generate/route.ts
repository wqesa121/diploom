import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateArticleWithAI } from "@/lib/ai";
import { getAiRateLimitConfig } from "@/lib/env";
import { createRequestId, reportMonitoringEvent } from "@/lib/monitoring";
import { enforceRateLimit, getRequestRateLimitKey } from "@/lib/rate-limit";
import { aiGenerateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers: { "X-Request-Id": requestId } });
  }

  const rateLimitConfig = getAiRateLimitConfig();
  const rateLimit = await enforceRateLimit({
    route: "admin-ai-generate",
    key: `${session.user.id || session.user.email}:${getRequestRateLimitKey(request, "admin-ai")}`,
    limit: rateLimitConfig.limit,
    windowMs: rateLimitConfig.windowSeconds * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: rateLimit.retryAfterSeconds,
        requestId,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": rateLimit.resetAt,
          "X-Request-Id": requestId,
        },
      },
    );
  }

  const body = await request.json();
  const parsed = aiGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request", requestId }, { status: 400, headers: { "X-Request-Id": requestId } });
  }

  try {
    const payload = await generateArticleWithAI(parsed.data);
    return NextResponse.json(payload, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt,
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    await reportMonitoringEvent({
      source: "api/admin/ai/generate",
      requestId,
      severity: "error",
      message: "AI article generation failed",
      metadata: {
        userId: session.user.id || null,
        userEmail: session.user.email || null,
      },
      error,
    });

    return NextResponse.json({ error: "Failed to generate article", requestId }, { status: 500, headers: { "X-Request-Id": requestId } });
  }
}
