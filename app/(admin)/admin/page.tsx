import Link from "next/link";
import { ArrowRight, Clock3, FilePenLine, History } from "lucide-react";

import { auth } from "@/auth";
import { DashboardMetrics } from "@/components/admin/dashboard-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/activity";
import { connectToDatabase } from "@/lib/db";
import { formatRelativeDate } from "@/lib/utils";
import { Article } from "@/models/Article";

function getActivityLabel(action: string) {
  switch (action) {
    case "created":
      return "создал материал";
    case "updated":
      return "обновил материал";
    case "deleted":
      return "удалил материал";
    case "password_changed":
      return "сменил пароль";
    default:
      return "выполнил действие";
  }
}

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const session = await auth();
  const now = Date.now();

  const articles = await Article.find().sort({ updatedAt: -1 }).lean();
  const liveArticles = articles.filter(
    (article) => article.status === "published" && (!article.scheduledAt || new Date(article.scheduledAt).getTime() <= now),
  );
  const scheduledArticles = articles
    .filter((article) => article.status === "published" && article.scheduledAt && new Date(article.scheduledAt).getTime() > now)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
  const draftArticles = articles.filter((article) => article.status === "draft");
  const reviewArticles = articles.filter((article) => article.status === "in_review");
  const uniqueTags = new Set(articles.flatMap((article) => article.tags));
  const recentArticles = articles.slice(0, 5);
  const averageSeoScore = articles.length
    ? Math.round(articles.reduce((total, article) => total + (article.seoScore || 0), 0) / articles.length)
    : 0;
  const upcomingScheduled = scheduledArticles.slice(0, 3);
  const recentActivity = await getRecentActivity(6);

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
            <CardTitle className="text-2xl">Publishing pulse</CardTitle>
            <CardDescription className="text-slate-300">
              Dashboard теперь показывает состояние live и scheduled публикаций, а не только общий объём контента.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Live now: {liveArticles.length}</p>
            <p>Scheduled queue: {scheduledArticles.length}</p>
            <p>In review: {reviewArticles.length}</p>
            <p>Average SEO score: {averageSeoScore}/100</p>
          </CardContent>
        </Card>
      </section>

      <DashboardMetrics
        totalArticles={articles.length}
        liveArticles={liveArticles.length}
        scheduledArticles={scheduledArticles.length}
        draftArticles={draftArticles.length}
        reviewArticles={reviewArticles.length}
        totalTags={uniqueTags.size}
        averageSeoScore={averageSeoScore}
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
                      {article.status === "published" && article.scheduledAt && new Date(article.scheduledAt).getTime() > now ? (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">scheduled</span>
                      ) : null}
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

        <div className="space-y-6">
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

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <CardTitle>Upcoming releases</CardTitle>
            <CardDescription>Ближайшие материалы, которые уже запланированы к публикации.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingScheduled.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed bg-secondary/40 p-4 text-sm text-muted-foreground">
                Сейчас нет материалов в scheduled queue.
              </div>
            ) : (
              upcomingScheduled.map((article) => (
                <div key={String(article._id)} className="rounded-[1.25rem] border bg-white p-4">
                  <p className="font-medium text-slate-950">{article.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">/{article.slug}</p>
                  <p className="mt-3 text-sm text-slate-700">{new Date(article.scheduledAt).toLocaleString("ru-RU")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <History className="h-3.5 w-3.5" />
              Activity log
            </div>
            <CardTitle>Последние действия</CardTitle>
            <CardDescription>Краткая история изменений в админке.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed bg-secondary/40 p-4 text-sm text-muted-foreground">
                История пока пуста. Действия появятся после создания, обновления или удаления материалов.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border bg-white p-4">
                  <p className="text-sm font-medium text-slate-950">
                    {item.actorName} {getActivityLabel(item.action)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.entityTitle || item.details || item.entityType}
                  </p>
                  {item.details ? <p className="mt-2 text-xs text-slate-600">{item.details}</p> : null}
                  <p className="mt-3 text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </div>
      </section>
    </div>
  );
}
