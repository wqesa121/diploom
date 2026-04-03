import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { Article } from "@/models/Article";
import type { SerializedArticle } from "@/types/article";

type ArticleAuthorShape = {
  _id?: unknown;
  name?: string;
  email?: string;
};

type ArticleShape = {
  _id: unknown;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content?: Record<string, unknown>;
  markdown: string;
  tags?: string[];
  featuredImage?: string;
  additionalImages?: string[];
  imageQuery?: string;
  author?: ArticleAuthorShape;
  status: "draft" | "published";
  seoScore?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function getArticleById(id: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const article = await Article.findById(id).populate("author", "name email").lean();
  return article ? serializeArticle(article as unknown as ArticleShape) : null;
}

export async function getAllArticles() {
  await connectToDatabase();
  const articles = await Article.find().populate("author", "name email").sort({ updatedAt: -1 }).lean();
  return articles.map((article) => serializeArticle(article as unknown as ArticleShape));
}

export async function getPublishedArticleBySlug(slug: string) {
  await connectToDatabase();
  const article = await Article.findOne({ slug, status: "published" }).populate("author", "name email").lean();
  return article ? serializeArticle(article as unknown as ArticleShape) : null;
}

export function serializeArticle(article: ArticleShape): SerializedArticle {
  return {
    id: String(article._id),
    title: article.title,
    slug: article.slug,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    excerpt: article.excerpt,
    content: article.content ?? { type: "doc", content: [] },
    markdown: article.markdown,
    tags: article.tags ?? [],
    featuredImage: article.featuredImage ?? "",
    additionalImages: article.additionalImages ?? [],
    imageQuery: article.imageQuery ?? "",
    author: {
      id: String(article.author?._id ?? ""),
      name: article.author?.name ?? "Unknown",
      email: article.author?.email ?? "",
    },
    status: article.status,
    seoScore: article.seoScore ?? 0,
    createdAt: new Date(article.createdAt).toISOString(),
    updatedAt: new Date(article.updatedAt).toISOString(),
  };
}
