import Link from "next/link";
import { ArrowRight, Clock3, FilePenLine } from "lucide-react";

import { auth } from "@/auth";
import { DashboardMetrics } from "@/components/admin/dashboard-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectToDatabase } from "@/lib/db";
import { formatRelativeDate } from "@/lib/utils";
import { Article } from "@/models/Article";

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const session = await auth();

  const articles = await Article.find().sort({ updatedAt: -1 }).lean();
  const publishedArticles = articles.filter((article) => article.status === "published");
  const uniqueTags = new Set(articles.flatMap((article) => article.tags));
  const recentArticles = articles.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Welcome back
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Управляйте контентом из одной панели</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Генерируйте статьи с AI, дорабатывайте контент в Tiptap и публикуйте материалы через headless API. Авторизован как {session?.user?.name || session?.user?.email}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/articles/new">Создать материал</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/articles">Открыть библиотеку</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-gradient-to-br from-slate-950 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Headless API ready</CardTitle>
            <CardDescription className="text-slate-300">
              `/api/posts` уже отдает только опубликованные материалы с пагинацией, поиском и фильтром по тегам.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>AI output автоматически рассчитывает slug, excerpt и SEO score.</p>
            <p>MongoDB Atlas и Mongoose используются как единый source of truth для админки и API.</p>
          </CardContent>
        </Card>
      </section>

      <DashboardMetrics
        totalArticles={articles.length}
        publishedArticles={publishedArticles.length}
        draftArticles={articles.length - publishedArticles.length}
        totalTags={uniqueTags.size}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Последние материалы</CardTitle>
            <CardDescription>Быстрый обзор последних обновлений в контент-библиотеке.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentArticles.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed bg-secondary/40 p-6 text-sm text-muted-foreground">
                Пока нет ни одной статьи. Начните с AI-генерации нового материала.
              </div>
            ) : (
              recentArticles.map((article) => (
                <div key={String(article._id)} className="flex flex-col gap-3 rounded-[1.25rem] border bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-950">{article.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${article.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {article.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">/{article.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {formatRelativeDate(String(article.updatedAt))}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/articles/${String(article._id)}/edit`}>
                        <FilePenLine className="h-4 w-4" />
                        Открыть
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle>Setup checklist</CardTitle>
            <CardDescription>Что еще нужно для полного рабочего контура проекта.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="font-medium">1. Admin account</p>
              <p className="mt-1 text-muted-foreground">Создайте первого администратора через `npm run seed:admin -- --email ... --password ...`.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="font-medium">2. AI keys</p>
              <p className="mt-1 text-muted-foreground">Добавьте `GOOGLE_GENERATIVE_AI_API_KEY` и `UNSPLASH_ACCESS_KEY`, чтобы активировать Generate with AI.</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="font-medium">3. Start publishing</p>
              <p className="mt-1 text-muted-foreground">После публикации статьи сразу доступны в `/api/posts` и `/api/posts/[slug]`.</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/articles/new">
                Перейти к созданию статьи
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
