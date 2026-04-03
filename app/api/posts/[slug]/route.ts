import { NextResponse } from "next/server";

import { getPublishedArticleBySlug } from "@/lib/articles";

type ArticleBySlugRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: ArticleBySlugRouteProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}
