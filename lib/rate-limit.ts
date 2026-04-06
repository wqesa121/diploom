import { connectToDatabase } from "@/lib/db";
import { ApiRateLimit } from "@/models/ApiRateLimit";

type RateLimitOptions = {
  route: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: string;
};

type StoredRateLimitShape = {
  count: number;
  resetAt: Date | string;
};

export function getRequestRateLimitKey(request: Request, fallback: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || fallback;

  return ip || fallback;
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  await connectToDatabase();

  const now = new Date();
  const current = await ApiRateLimit.findOne({ route: options.route, key: options.key }).lean<StoredRateLimitShape | null>();

  if (!current || new Date(current.resetAt).getTime() <= now.getTime()) {
    const resetAt = new Date(now.getTime() + options.windowMs);

    await ApiRateLimit.findOneAndUpdate(
      { route: options.route, key: options.key },
      {
        $set: {
          route: options.route,
          key: options.key,
          count: 1,
          resetAt,
        },
      },
      { upsert: true },
    );

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
      resetAt: resetAt.toISOString(),
    };
  }

  const resetAtDate = new Date(current.resetAt);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAtDate.getTime() - now.getTime()) / 1000));

  if (current.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetAt: resetAtDate.toISOString(),
    };
  }

  const nextCount = current.count + 1;
  await ApiRateLimit.findOneAndUpdate(
    { route: options.route, key: options.key },
    {
      $set: {
        resetAt: resetAtDate,
      },
      $inc: {
        count: 1,
      },
    },
  );

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - nextCount),
    retryAfterSeconds,
    resetAt: resetAtDate.toISOString(),
  };
}