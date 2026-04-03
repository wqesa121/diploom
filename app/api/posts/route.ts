import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { serializeArticle } from "@/lib/articles";
import { Article } from "@/models/Article";
import type { SerializedArticle } from "@/types/article";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const query = searchParams.get("search")?.trim();
  const tag = searchParams.get("tag")?.trim();

  const filters: Record<string, unknown> = {
    status: "published",
  };

  if (query) {
    filters.$or = [
      { title: { $regex: query, $options: "i" } },
      { excerpt: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ];
  }

  if (tag) {
    filters.tags = tag;
  }

  await connectToDatabase();

  const [total, articles] = await Promise.all([
    Article.countDocuments(filters),
    Article.find(filters)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return NextResponse.json({
    data: articles.map((article) => serializeArticle(article as unknown as Parameters<typeof serializeArticle>[0])) satisfies SerializedArticle[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
