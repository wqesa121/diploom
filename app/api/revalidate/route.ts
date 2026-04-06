import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { getCronSecret, getRevalidateRateLimitConfig } from "@/lib/env";
import { createRequestId, reportMonitoringEvent } from "@/lib/monitoring";
import { enforceRateLimit, getRequestRateLimitKey } from "@/lib/rate-limit";
import { Article } from "@/models/Article";

type RevalidateRequestBody = {
  slug?: string;
};

function getProvidedSecret(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-revalidate-secret");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return headerSecret || url.searchParams.get("secret") || null;
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    await reportMonitoringEvent({
      source: "api/revalidate",
      requestId,
      severity: "critical",
      message: "CRON_SECRET is not configured",
    });

    return NextResponse.json({ error: "CRON_SECRET is not configured", requestId }, { status: 500, headers: { "X-Request-Id": requestId } });
  }

  let body: RevalidateRequestBody | undefined;

  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    body = undefined;
  }

  const providedSecret = getProvidedSecret(request);

  if (!providedSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers: { "X-Request-Id": requestId } });
  }

  const rateLimitConfig = getRevalidateRateLimitConfig();
  const rateLimit = await enforceRateLimit({
    route: "revalidate-endpoint",
    key: getRequestRateLimitKey(request, "revalidate"),
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

  const revalidatedPaths = new Set<string>(["/", "/posts", "/api/posts"]);

  if (body?.slug?.trim()) {
    const slug = body.slug.trim();
    revalidatedPaths.add(`/posts/${slug}`);
    revalidatedPaths.add(`/api/posts/${slug}`);
  }

  try {
    await connectToDatabase();

    const dueScheduledArticles = await Article.find({
      status: "published",
      scheduledAt: { $ne: null, $lte: new Date() },
    })
      .select("slug scheduledAt")
      .lean<Array<{ slug: string; scheduledAt: Date }>>();

    for (const article of dueScheduledArticles) {
      revalidatedPaths.add(`/posts/${article.slug}`);
      revalidatedPaths.add(`/api/posts/${article.slug}`);
    }

    for (const path of revalidatedPaths) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      scheduledCount: dueScheduledArticles.length,
      scheduledSlugs: dueScheduledArticles.map((article) => article.slug),
      paths: Array.from(revalidatedPaths),
      triggeredAt: new Date().toISOString(),
      requestId,
    }, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt,
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    await reportMonitoringEvent({
      source: "api/revalidate",
      requestId,
      severity: "critical",
      message: "Revalidation request failed",
      metadata: {
        hasSlug: Boolean(body?.slug?.trim()),
      },
      error,
    });

    return NextResponse.json({ error: "Failed to revalidate content", requestId }, { status: 500, headers: { "X-Request-Id": requestId } });
  }
}