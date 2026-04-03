import Link from "next/link";

import { auth } from "@/auth";
import { DashboardMetrics } from "@/components/admin/dashboard-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectToDatabase } from "@/lib/db";
import { Article } from "@/models/Article";

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const session = await auth();

  const articles = await Article.find().sort({ updatedAt: -1 }).lean();
  const publishedArticles = articles.filter((article) => article.status === "published");
  const uniqueTags = new Set(articles.flatMap((article) => article.tags));

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
    </div>
  );
}
