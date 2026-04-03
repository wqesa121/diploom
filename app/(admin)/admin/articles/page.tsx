import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleTable } from "@/components/admin/article-table";
import { getAllArticles } from "@/lib/articles";

type ArticlesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "draft" | "published" | "all";
    tag?: string;
  }>;
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const allArticles = await getAllArticles();
  const search = normalize(params.search);
  const status = params.status && params.status !== "all" ? params.status : "all";
  const tag = params.tag?.trim() ?? "";

  const availableTags = Array.from(new Set(allArticles.flatMap((article) => article.tags))).sort((a, b) => a.localeCompare(b, "ru"));

  const articles = allArticles.filter((article) => {
    const matchesSearch =
      !search ||
      article.title.toLowerCase().includes(search) ||
      article.slug.toLowerCase().includes(search) ||
      article.metaTitle.toLowerCase().includes(search) ||
      article.tags.some((item) => item.toLowerCase().includes(search));

    const matchesStatus = status === "all" ? true : article.status === status;
    const matchesTag = !tag ? true : article.tags.includes(tag);

    return matchesSearch && matchesStatus && matchesTag;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Content library</CardTitle>
            <CardDescription>Управляйте всеми draft и published материалами из одного списка.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/articles/new">Новая статья</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="grid gap-3 rounded-[1.5rem] border bg-secondary/30 p-4 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_auto] lg:items-end">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Поиск
              <input
                type="text"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Title, slug, meta title или tag"
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Статус
              <select
                name="status"
                defaultValue={status}
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
              >
                <option value="all">Все</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Тег
              <select
                name="tag"
                defaultValue={tag}
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Все теги</option>
                {availableTags.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Применить</Button>
              <Button asChild type="button" variant="outline" className="flex-1">
                <Link href="/admin/articles">Сбросить</Link>
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Результатов: {articles.length}</Badge>
            <Badge variant="outline">Всего материалов: {allArticles.length}</Badge>
            {status !== "all" ? <Badge variant="outline">Статус: {status}</Badge> : null}
            {tag ? <Badge variant="outline">Тег: {tag}</Badge> : null}
            {search ? <Badge variant="outline">Поиск: {search}</Badge> : null}
          </div>

          <ArticleTable articles={articles} />
        </CardContent>
      </Card>
    </div>
  );
}
