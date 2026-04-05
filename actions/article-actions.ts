"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import { connectToDatabase } from "@/lib/db";
import { canRunBulkAction, canTransitionArticleWorkflow, DEFAULT_ROLE, getDefaultAdminPath, hasPermission } from "@/lib/permissions";
import { createArticleRevision, getArticleRevisionSnapshot } from "@/lib/revisions";
import { estimateSeoScore } from "@/lib/utils";
import { articleSchema, reviewNoteSchema } from "@/lib/validations";
import { Article } from "@/models/Article";

export type ArticleActionState = {
  success: boolean;
  error?: string;
};

type DeletedArticleShape = {
  title: string;
  slug: string;
  featured?: boolean;
};

type CurrentArticleSurfaceShape = {
  slug: string;
};

type WorkflowArticleShape = {
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

type RevisionArticleShape = {
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

type BulkActionType = "publish" | "review" | "draft" | "delete";

function revalidateArticleSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/api/posts");
}

function normalizeArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseArticle(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    excerpt: formData.get("excerpt"),
    markdown: formData.get("markdown"),
    content: formData.get("content"),
    tags: normalizeArray(formData, "tags"),
    featuredImage: formData.get("featuredImage"),
    additionalImages: normalizeArray(formData, "additionalImages"),
    imageQuery: formData.get("imageQuery") || "",
    status: formData.get("status"),
    featured: formData.get("featured") || "false",
    scheduledAt: formData.get("scheduledAt") || "",
  });
}

export async function createArticleAction(_: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Сессия недействительна." };
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:create")) {
    return { success: false, error: "Недостаточно прав для создания статьи." };
  }

  const parsed = parseArticle(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Не удалось сохранить статью." };
  }

  await connectToDatabase();
  const duplicate = await Article.findOne({ slug: parsed.data.slug }).lean();

  if (duplicate) {
    return { success: false, error: "Статья с таким slug уже существует." };
  }

  const content = JSON.parse(parsed.data.content);
  const normalizedFeatured = parsed.data.status === "published" ? parsed.data.featured : false;
  const seoScore = estimateSeoScore({
    title: parsed.data.metaTitle,
    metaDescription: parsed.data.metaDescription,
    content: parsed.data.markdown,
    tags: parsed.data.tags,
  });

  if (normalizedFeatured) {
    await Article.updateMany({ featured: true }, { $set: { featured: false } });
  }

  const article = await Article.create({
    ...parsed.data,
    featured: normalizedFeatured,
    content,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    author: session.user.id,
    seoScore,
  });

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: String(article._id),
    entityTitle: parsed.data.title,
    action: "created",
    details: `Article created with status ${parsed.data.status}.${normalizedFeatured ? " Marked as featured." : ""}`,
  });

  await createArticleRevision({
    article: article.toObject(),
    editorId: session.user.id,
    editorName: session.user.name,
    editorEmail: session.user.email,
  });

  revalidateArticleSurfaces();
  redirect("/admin/articles");

  return { success: true };
}

export async function updateArticleAction(id: string, _: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Сессия недействительна." };
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:edit")) {
    return { success: false, error: "Недостаточно прав для редактирования статьи." };
  }

  const parsed = parseArticle(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Не удалось обновить статью." };
  }

  await connectToDatabase();
  const duplicate = await Article.findOne({ slug: parsed.data.slug, _id: { $ne: id } }).lean();

  if (duplicate) {
    return { success: false, error: "Другой материал уже использует этот slug." };
  }

  const content = JSON.parse(parsed.data.content);
  const normalizedFeatured = parsed.data.status === "published" ? parsed.data.featured : false;
  const seoScore = estimateSeoScore({
    title: parsed.data.metaTitle,
    metaDescription: parsed.data.metaDescription,
    content: parsed.data.markdown,
    tags: parsed.data.tags,
  });

  if (normalizedFeatured) {
    await Article.updateMany({ _id: { $ne: id }, featured: true }, { $set: { featured: false } });
  }

  await Article.findByIdAndUpdate(id, {
    ...parsed.data,
    featured: normalizedFeatured,
    content,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    author: session.user.id,
    seoScore,
  });

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: id,
    entityTitle: parsed.data.title,
    action: "updated",
    details: parsed.data.scheduledAt
      ? `Status: ${parsed.data.status}. Scheduled for ${new Date(parsed.data.scheduledAt).toLocaleString("ru-RU")}.${normalizedFeatured ? " Featured enabled." : ""}`
      : `Status: ${parsed.data.status}.${normalizedFeatured ? " Featured enabled." : ""}`,
  });

  const updatedArticle = await Article.findById(id).lean<RevisionArticleShape | null>();

  if (updatedArticle) {
    await createArticleRevision({
      article: updatedArticle,
      editorId: session.user.id,
      editorName: session.user.name,
      editorEmail: session.user.email,
    });
  }

  revalidateArticleSurfaces();
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath(`/admin/articles/${id}/preview`);
  revalidatePath(`/api/posts/${parsed.data.slug}`);
  revalidatePath(`/posts/${parsed.data.slug}`);
  redirect("/admin/articles");

  return { success: true };
}

export async function deleteArticleAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:delete")) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();
  const article = await Article.findById(id).select("title slug").lean<DeletedArticleShape | null>();

  if (article) {
    await Article.findByIdAndDelete(id);
    await logActivity({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      entityType: "article",
      entityId: id,
      entityTitle: article.title,
      action: "deleted",
      details: `Deleted article /${article.slug}.`,
    });
  }

  revalidateArticleSurfaces();
}

export async function bulkArticleAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  const actionType = String(formData.get("bulkAction") || "") as BulkActionType;
  const articleIds = formData
    .getAll("articleIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!articleIds.length || !["publish", "review", "draft", "delete"].includes(actionType)) {
    redirect("/admin/articles");
  }

  if (!canRunBulkAction(role, actionType)) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();

  const articles = await Article.find({ _id: { $in: articleIds } })
    .select("title slug featured")
    .lean<Array<DeletedArticleShape & { _id: unknown }>>();

  if (actionType === "delete") {
    await Article.deleteMany({ _id: { $in: articleIds } });

    for (const article of articles) {
      await logActivity({
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        entityType: "article",
        entityId: String(article._id),
        entityTitle: article.title,
        action: "deleted",
        details: `Deleted article /${article.slug} via bulk action.`,
      });
    }
  } else {
    const nextStatus = actionType === "publish" ? "published" : actionType === "review" ? "in_review" : "draft";
    const updatePayload: Record<string, unknown> = { status: nextStatus };

    if (nextStatus !== "published") {
      updatePayload.featured = false;
    }

    await Article.updateMany({ _id: { $in: articleIds } }, { $set: updatePayload });

    for (const article of articles) {
      await logActivity({
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        entityType: "article",
        entityId: String(article._id),
        entityTitle: article.title,
        action: "updated",
        details:
          actionType === "publish"
            ? "Moved to published via bulk action."
            : actionType === "review"
              ? "Moved to in-review via bulk action."
              : "Moved to draft via bulk action.",
      });
    }
  }

  revalidateArticleSurfaces();
  redirect("/admin/articles");
}

export async function restoreArticleRevisionAction(articleId: string, revisionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:edit")) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();

  const [revision, currentArticle] = await Promise.all([
    getArticleRevisionSnapshot(revisionId),
    Article.findById(articleId).select("slug").lean<CurrentArticleSurfaceShape | null>(),
  ]);

  if (!revision || revision.articleId !== articleId) {
    throw new Error("Revision not found");
  }

  const normalizedFeatured = revision.status === "published" ? revision.featured : false;

  if (normalizedFeatured) {
    await Article.updateMany({ _id: { $ne: articleId }, featured: true }, { $set: { featured: false } });
  }

  await Article.findByIdAndUpdate(articleId, {
    title: revision.title,
    slug: revision.slug,
    metaTitle: revision.metaTitle,
    metaDescription: revision.metaDescription,
    excerpt: revision.excerpt,
    content: revision.content,
    markdown: revision.markdown,
    tags: revision.tags,
    featuredImage: revision.featuredImage,
    additionalImages: revision.additionalImages,
    imageQuery: revision.imageQuery,
    status: revision.status,
    featured: normalizedFeatured,
    scheduledAt: revision.scheduledAt ? new Date(revision.scheduledAt) : null,
    seoScore: revision.seoScore,
    author: session.user.id,
  });

  const restoredArticle = await Article.findById(articleId).lean<RevisionArticleShape | null>();

  if (restoredArticle) {
    await createArticleRevision({
      article: restoredArticle,
      editorId: session.user.id,
      editorName: session.user.name,
      editorEmail: session.user.email,
    });
  }

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: articleId,
    entityTitle: revision.title,
    action: "updated",
    details: `Restored article from revision v${revision.revision}.`,
  });

  revalidateArticleSurfaces();
  revalidatePath(`/admin/articles/${articleId}/edit`);
  revalidatePath(`/admin/articles/${articleId}/preview`);

  if (currentArticle?.slug) {
    revalidatePath(`/posts/${currentArticle.slug}`);
    revalidatePath(`/api/posts/${currentArticle.slug}`);
  }

  revalidatePath(`/posts/${revision.slug}`);
  revalidatePath(`/api/posts/${revision.slug}`);
  redirect(`/admin/articles/${articleId}/edit`);
}

export async function updateArticleWorkflowAction(id: string, nextStatus: "draft" | "in_review" | "published") {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!canTransitionArticleWorkflow(role, nextStatus)) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();

  const article = await Article.findById(id).lean<WorkflowArticleShape | null>();

  if (!article) {
    redirect("/admin/articles");
  }

  const nextFeatured = nextStatus === "published" ? article.featured ?? false : false;

  await Article.findByIdAndUpdate(id, {
    status: nextStatus,
    featured: nextFeatured,
    author: session.user.id,
  });

  const updatedArticle = await Article.findById(id).lean<RevisionArticleShape | null>();

  if (updatedArticle) {
    await createArticleRevision({
      article: updatedArticle,
      editorId: session.user.id,
      editorName: session.user.name,
      editorEmail: session.user.email,
    });
  }

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: id,
    entityTitle: article.title,
    action: "updated",
    details: `Status changed to ${nextStatus} via inline action.`,
  });

  revalidateArticleSurfaces();
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath(`/admin/articles/${id}/preview`);
  revalidatePath(`/posts/${article.slug}`);
  revalidatePath(`/api/posts/${article.slug}`);
  redirect("/admin/articles");
}

export async function toggleFeaturedArticleAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:feature")) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();

  const article = await Article.findById(id).lean<WorkflowArticleShape | null>();

  if (!article || article.status !== "published") {
    redirect("/admin/articles");
  }

  const nextFeatured = !(article.featured ?? false);

  if (nextFeatured) {
    await Article.updateMany({ _id: { $ne: id }, featured: true }, { $set: { featured: false } });
  }

  await Article.findByIdAndUpdate(id, {
    featured: nextFeatured,
    author: session.user.id,
  });

  const updatedArticle = await Article.findById(id).lean<RevisionArticleShape | null>();

  if (updatedArticle) {
    await createArticleRevision({
      article: updatedArticle,
      editorId: session.user.id,
      editorName: session.user.name,
      editorEmail: session.user.email,
    });
  }

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: id,
    entityTitle: article.title,
    action: "updated",
    details: nextFeatured ? "Marked as featured via inline action." : "Removed featured flag via inline action.",
  });

  revalidateArticleSurfaces();
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath(`/admin/articles/${id}/preview`);
  revalidatePath(`/posts/${article.slug}`);
  revalidatePath(`/api/posts/${article.slug}`);
  redirect("/admin/articles");
}

export async function addArticleReviewNoteAction(articleId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "review:comment")) {
    redirect(getDefaultAdminPath(role));
  }

  const parsed = reviewNoteSchema.safeParse({
    body: formData.get("body"),
    redirectTo: formData.get("redirectTo") || "/admin/review",
  });

  const fallbackRedirect = String(formData.get("redirectTo") || "/admin/review");

  if (!parsed.success) {
    redirect(fallbackRedirect);
  }

  await connectToDatabase();

  const article = await Article.findByIdAndUpdate(
    articleId,
    {
      $push: {
        reviewNotes: {
          body: parsed.data.body,
          authorName: session.user.name || "",
          authorEmail: session.user.email || "",
          createdAt: new Date(),
        },
      },
      $set: {
        author: session.user.id,
      },
    },
    { new: true },
  ).lean<WorkflowArticleShape | null>();

  if (!article) {
    redirect(fallbackRedirect);
  }

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "article",
    entityId: articleId,
    entityTitle: article.title,
    action: "updated",
    details: `Added review note: ${parsed.data.body.slice(0, 120)}${parsed.data.body.length > 120 ? "..." : ""}`,
  });

  revalidatePath("/admin/review");
  revalidatePath(`/admin/articles/${articleId}/edit`);
  revalidatePath(`/admin/articles/${articleId}/compare`);
  redirect(parsed.data.redirectTo);
}
