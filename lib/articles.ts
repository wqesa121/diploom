import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { Article } from "@/models/Article";
import type { SerializedArticle } from "@/types/article";

type ArticleAuthorShape = {
  _id?: unknown;
  name?: string;
  email?: string;
};

type ReviewNoteShape = {
  _id?: unknown;
  body?: string;
  authorName?: string;
  authorEmail?: string;
  createdAt?: Date | string;
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
  status: "draft" | "in_review" | "published";
  featured?: boolean;
  scheduledAt?: Date | string | null;
  seoScore?: number;
  reviewNotes?: ReviewNoteShape[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PublishedArticlesOptions = {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
};

function buildLiveArticleFilters() {
  return {
    $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }],
  };
}

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
  const article = await Article.findOne({ slug, status: "published", ...buildLiveArticleFilters() })
    .populate("author", "name email")
    .lean();
  return article ? serializeArticle(article as unknown as ArticleShape) : null;
}

export async function getFeaturedPublishedArticle() {
  await connectToDatabase();

  const article = await Article.findOne({ status: "published", featured: true, ...buildLiveArticleFilters() })
    .populate("author", "name email")
    .sort({ updatedAt: -1 })
    .lean();

  return article ? serializeArticle(article as unknown as ArticleShape) : null;
}

export async function getArticleBySlug(slug: string) {
  await connectToDatabase();
  const article = await Article.findOne({ slug }).populate("author", "name email").lean();
  return article ? serializeArticle(article as unknown as ArticleShape) : null;
}

export async function getPublishedArticles(options: PublishedArticlesOptions = {}) {
  await connectToDatabase();

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 9);
  const search = options.search?.trim();
  const tag = options.tag?.trim();

  const andConditions: Record<string, unknown>[] = [buildLiveArticleFilters()];
  const filters: Record<string, unknown> = {
    status: "published",
  };

  if (search) {
    andConditions.push({
      $or: [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { metaTitle: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (tag) {
    andConditions.push({ tags: tag });
  }

  if (andConditions.length > 0) {
    filters.$and = andConditions;
  }

  const [total, articles] = await Promise.all([
    Article.countDocuments(filters),
    Article.find(filters)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: articles.map((article) => serializeArticle(article as unknown as ArticleShape)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getRelatedPublishedArticles(article: SerializedArticle, limit = 3) {
  await connectToDatabase();

  const related = await Article.find({
    status: "published",
    slug: { $ne: article.slug },
    $and: [buildLiveArticleFilters(), { $or: [{ tags: { $in: article.tags } }, { imageQuery: article.imageQuery }] }],
  })
    .populate("author", "name email")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return related.map((item) => serializeArticle(item as unknown as ArticleShape));
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
    featured: article.featured ?? false,
    scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).toISOString() : null,
    seoScore: article.seoScore ?? 0,
    reviewNotes: (article.reviewNotes ?? [])
      .map((note) => ({
        id: String(note._id ?? ""),
        body: note.body ?? "",
        authorName: note.authorName ?? "",
        authorEmail: note.authorEmail ?? "",
        createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : new Date(0).toISOString(),
      }))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    createdAt: new Date(article.createdAt).toISOString(),
    updatedAt: new Date(article.updatedAt).toISOString(),
  };
}
