import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { getCronSecret } from "@/lib/env";
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
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  let body: RevalidateRequestBody | undefined;

  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    body = undefined;
  }

  const providedSecret = getProvidedSecret(request);

  if (!providedSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const revalidatedPaths = new Set<string>(["/", "/posts", "/api/posts"]);

  if (body?.slug?.trim()) {
    const slug = body.slug.trim();
    revalidatedPaths.add(`/posts/${slug}`);
    revalidatedPaths.add(`/api/posts/${slug}`);
  }

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
  });
}