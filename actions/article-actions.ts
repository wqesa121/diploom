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
};

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
    details: parsed.data.status === "published" ? "Article created as published." : "Article created as draft.",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/api/posts");
  revalidatePath("/");
  revalidatePath("/posts");
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
      ? `Status: ${parsed.data.status}. Scheduled for ${new Date(parsed.data.scheduledAt).toLocaleString("ru-RU")}.`
      : `Status: ${parsed.data.status}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath(`/admin/articles/${id}/preview`);
  revalidatePath(`/api/posts/${parsed.data.slug}`);
  revalidatePath("/");
  revalidatePath("/posts");
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

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/posts");
}
