import { Types } from "mongoose";

import { ArticleRevision } from "@/models/ArticleRevision";

type RevisionSnapshot = {
  _id: unknown;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: Record<string, unknown>;
  markdown: string;
  tags?: string[];
  featuredImage?: string;
  additionalImages?: string[];
  imageQuery?: string;
  status: "draft" | "in_review" | "published";
  featured?: boolean;
  scheduledAt?: Date | string | null;
  seoScore?: number;
};

type CreateArticleRevisionParams = {
  article: RevisionSnapshot;
  editorId?: string;
  editorName?: string | null;
  editorEmail?: string | null;
};

type StoredRevisionShape = RevisionSnapshot & {
  articleId: unknown;
  revision: number;
  editorName?: string;
  editorEmail?: string;
  createdAt: Date | string;
};

export async function createArticleRevision(params: CreateArticleRevisionParams) {
  const articleId = String(params.article._id);
  const latestRevision = await ArticleRevision.findOne({ articleId }).sort({ revision: -1 }).select("revision").lean<{ revision?: number } | null>();
  const nextRevision = (latestRevision?.revision ?? 0) + 1;

  await ArticleRevision.create({
    articleId,
    revision: nextRevision,
    title: params.article.title,
    slug: params.article.slug,
    metaTitle: params.article.metaTitle,
    metaDescription: params.article.metaDescription,
    excerpt: params.article.excerpt,
    content: params.article.content,
    markdown: params.article.markdown,
    tags: params.article.tags ?? [],
    featuredImage: params.article.featuredImage ?? "",
    additionalImages: params.article.additionalImages ?? [],
    imageQuery: params.article.imageQuery ?? "",
    status: params.article.status,
    featured: params.article.featured ?? false,
    scheduledAt: params.article.scheduledAt ? new Date(params.article.scheduledAt) : null,
    seoScore: params.article.seoScore ?? 0,
    editorId: params.editorId && Types.ObjectId.isValid(params.editorId) ? params.editorId : undefined,
    editorName: params.editorName || "",
    editorEmail: params.editorEmail || "",
  });
}

export async function getArticleRevisions(articleId: string, limit = 8) {
  if (!Types.ObjectId.isValid(articleId)) {
    return [];
  }

  const revisions = await ArticleRevision.find({ articleId }).sort({ revision: -1 }).limit(limit).lean();

  return revisions.map((revision) => ({
    id: String(revision._id),
    articleId: String(revision.articleId),
    revision: revision.revision,
    title: revision.title,
    slug: revision.slug,
    status: revision.status,
    featured: revision.featured ?? false,
    seoScore: revision.seoScore ?? 0,
    editorName: revision.editorName || revision.editorEmail || "Unknown user",
    editorEmail: revision.editorEmail || "",
    scheduledAt: revision.scheduledAt ? new Date(revision.scheduledAt).toISOString() : null,
    createdAt: new Date(revision.createdAt).toISOString(),
  }));
}

export async function getArticleRevisionSnapshot(revisionId: string) {
  if (!Types.ObjectId.isValid(revisionId)) {
    return null;
  }

  const revision = await ArticleRevision.findById(revisionId).lean<StoredRevisionShape | null>();

  if (!revision) {
    return null;
  }

  return {
    id: String(revision._id),
    articleId: String(revision.articleId),
    revision: revision.revision,
    title: revision.title,
    slug: revision.slug,
    metaTitle: revision.metaTitle,
    metaDescription: revision.metaDescription,
    excerpt: revision.excerpt,
    content: revision.content as Record<string, unknown>,
    markdown: revision.markdown,
    tags: revision.tags ?? [],
    featuredImage: revision.featuredImage ?? "",
    additionalImages: revision.additionalImages ?? [],
    imageQuery: revision.imageQuery ?? "",
    status: revision.status,
    featured: revision.featured ?? false,
    scheduledAt: revision.scheduledAt ? new Date(revision.scheduledAt).toISOString() : null,
    seoScore: revision.seoScore ?? 0,
    editorName: revision.editorName || revision.editorEmail || "Unknown user",
    editorEmail: revision.editorEmail || "",
    createdAt: new Date(revision.createdAt).toISOString(),
  };
}