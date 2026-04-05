import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticles } from "@/lib/articles";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NeuraCMS Posts",
  description: "Публичный каталог опубликованных материалов NeuraCMS.",
};

type PostsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tag?: string;
  }>;
};

function buildPageHref(page: number, search?: string, tag?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1"));
  const search = params.search?.trim() || "";
  const tag = params.tag?.trim() || "";

  const { data, pagination } = await getPublishedArticles({
    page,
    limit: 9,
    search,
    tag,
  });

  const availableTags = Array.from(new Set(data.flatMap((article) => article.tags))).slice(0, 12);

  return (
    <main className="container space-y-8 py-12">
      <section className="space-y-4">
        <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Public Publishing Layer
        </div>
        <div className="space-y-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">Публичный каталог публикаций NeuraCMS</h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Здесь опубликованные материалы доступны как обычный контент-сайт, при этом API остается чистым headless-источником для любых внешних клиентов.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <form className="grid gap-3 rounded-[1.5rem] border bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Поиск
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Тема, мета-заголовок или тег"
                  className="h-11 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm shadow-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Тег
              <select name="tag" defaultValue={tag} className="h-11 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm outline-none transition-colors focus:border-primary">
                <option value="">Все теги</option>
                {availableTags.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Найти</Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/posts">Сбросить</Link>
              </Button>
            </div>
          </form>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((article) => (
              <Card key={article.id} className="overflow-hidden border-white/70 bg-white/90">
                {article.featuredImage ? (
                  <div className="relative aspect-[4/3] bg-secondary">
                    <Image src={article.featuredImage} alt={article.title} fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-2xl leading-tight">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3 leading-6">{article.excerpt}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{article.author.name}</span>
                    <span>{formatRelativeDate(article.updatedAt)}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/posts/${article.slug}`}>
                      Читать статью
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed bg-white/70 p-10 text-center text-muted-foreground">
              Опубликованные статьи по текущему фильтру не найдены.
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-[1.5rem] border bg-white/80 p-4">
            <Button asChild variant="outline" disabled={pagination.page <= 1}>
              <Link href={buildPageHref(Math.max(1, pagination.page - 1), search, tag)} aria-disabled={pagination.page <= 1}>
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Страница {pagination.page} из {pagination.totalPages}
            </p>
            <Button asChild variant="outline" disabled={pagination.page >= pagination.totalPages}>
              <Link href={buildPageHref(Math.min(pagination.totalPages, pagination.page + 1), search, tag)} aria-disabled={pagination.page >= pagination.totalPages}>
                Вперед
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Почему это важно</CardTitle>
              <CardDescription>NeuraCMS теперь работает и как headless backend, и как готовая публичная publishing surface.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Опубликованные материалы автоматически открываются по SEO-friendly URL.</p>
              <p>Контент можно читать как обычный сайт без внешнего фронтенда.</p>
              <p>При этом `/api/posts` и `/api/posts/[slug]` остаются основным headless API для интеграций.</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}