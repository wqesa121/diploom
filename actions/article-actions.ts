"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import { connectToDatabase } from "@/lib/db";
import { estimateSeoScore } from "@/lib/utils";
import { articleSchema } from "@/lib/validations";
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

type BulkActionType = "publish" | "draft" | "delete";

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
  const seoScore = estimateSeoScore({
    title: parsed.data.metaTitle,
    metaDescription: parsed.data.metaDescription,
    content: parsed.data.markdown,
    tags: parsed.data.tags,
  });

  if (parsed.data.featured) {
    await Article.updateMany({ featured: true }, { $set: { featured: false } });
  }

  const article = await Article.create({
    ...parsed.data,
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
    details: `${parsed.data.status === "published" ? "Article created as published." : "Article created as draft."}${parsed.data.featured ? " Marked as featured." : ""}`,
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
  const seoScore = estimateSeoScore({
    title: parsed.data.metaTitle,
    metaDescription: parsed.data.metaDescription,
    content: parsed.data.markdown,
    tags: parsed.data.tags,
  });

  if (parsed.data.featured) {
    await Article.updateMany({ _id: { $ne: id }, featured: true }, { $set: { featured: false } });
  }

  await Article.findByIdAndUpdate(id, {
    ...parsed.data,
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
      ? `Status: ${parsed.data.status}. Scheduled for ${new Date(parsed.data.scheduledAt).toLocaleString("ru-RU")}.${parsed.data.featured ? " Featured enabled." : ""}`
      : `Status: ${parsed.data.status}.${parsed.data.featured ? " Featured enabled." : ""}`,
  });

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

  const actionType = String(formData.get("bulkAction") || "") as BulkActionType;
  const articleIds = formData
    .getAll("articleIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!articleIds.length || !["publish", "draft", "delete"].includes(actionType)) {
    redirect("/admin/articles");
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
    const nextStatus = actionType === "publish" ? "published" : "draft";
    const updatePayload: Record<string, unknown> = { status: nextStatus };

    if (nextStatus === "draft") {
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
            : "Moved to draft via bulk action.",
      });
    }
  }

  revalidateArticleSurfaces();
  redirect("/admin/articles");
}
