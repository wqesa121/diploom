import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateArticleWithAI } from "@/lib/ai";
import { getAiRateLimitConfig } from "@/lib/env";
import { enforceRateLimit, getRequestRateLimitKey } from "@/lib/rate-limit";
import { aiGenerateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": rateLimit.resetAt,
        },
      },
    );
  }

  const body = await request.json();
  const parsed = aiGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  try {
    const payload = await generateArticleWithAI(parsed.data);
    return NextResponse.json(payload, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate article" }, { status: 500 });
  }
}
