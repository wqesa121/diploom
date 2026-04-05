import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Gauge, Newspaper } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticleBySlug, getRelatedPublishedArticles } from "@/lib/articles";
import { markdownToHtml } from "@/lib/markdown";
import { estimateReadingTime, formatCalendarDate, formatRelativeDate } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      images: article.featuredImage ? [{ url: article.featuredImage }] : [],
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedPublishedArticles(article, 3);
  const contentHtml = markdownToHtml(article.markdown);
  const readingTime = estimateReadingTime(article.markdown);

  return (
    <main className="container space-y-8 py-10 md:py-14">
      <div>
        <Button asChild variant="outline">
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4" />
            Все публикации
          </Link>
        </Button>
      </div>

      <article className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <header className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]">
            {article.featuredImage ? (
              <div className="relative aspect-[16/8] min-h-[320px] bg-secondary">
                <Image src={article.featuredImage} alt={article.title} fill className="object-cover" unoptimized priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 xl:p-10">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-white/10 bg-white/10 text-white">Feature</Badge>
                    {article.tags.slice(0, 4).map((item) => (
                      <Badge key={item} className="border-white/10 bg-white/5 text-white/90">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 max-w-4xl space-y-4">
                    <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{article.title}</h1>
                    <p className="max-w-3xl text-base leading-7 text-white/80 md:text-lg md:leading-8">{article.metaDescription}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 xl:p-10">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 space-y-4">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{article.title}</h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{article.metaDescription}</p>
                </div>
              </div>
            )}
            <div className="grid gap-4 border-t border-border/70 bg-white/90 p-6 md:grid-cols-4 md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Автор</p>
                <p className="mt-2 font-medium text-slate-950">{article.author.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Дата</p>
                <p className="mt-2 font-medium text-slate-950">{formatCalendarDate(article.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reading time</p>
                <p className="mt-2 font-medium text-slate-950">{readingTime} мин</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">SEO score</p>
                <p className="mt-2 font-medium text-slate-950">{article.seoScore}/100</p>
              </div>
            </div>
          </header>

          <div className="rounded-[2rem] border border-accent/40 bg-accent/50 p-6 md:p-8">
            <p className="max-w-4xl text-xl font-medium leading-8 text-slate-900 md:text-2xl md:leading-9">
              {article.excerpt}
            </p>
          </div>

          <div className="rounded-[2rem] border bg-white/90 p-6 shadow-sm md:p-10">
            <div className="prose prose-slate prose-headings:tracking-tight prose-p:leading-8 prose-li:leading-7 max-w-none prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:not-italic prose-strong:text-slate-950" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>

          {article.additionalImages.length > 0 ? (
            <section className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Gallery</p>
                <h2 className="text-2xl font-semibold tracking-tight">Визуальные материалы статьи</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {article.additionalImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border bg-secondary">
                    <Image src={image} alt={`${article.title} image ${index + 1}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <Card className="border-white/70 bg-slate-950 text-white">
            <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                  <Newspaper className="h-4 w-4" />
                  Continue reading
                </p>
                <h2 className="text-2xl font-semibold">Исследуйте другие публикации NeuraCMS</h2>
                <p className="max-w-2xl text-sm leading-7 text-white/70">
                  Этот public layer работает поверх той же headless модели данных, что и API, preview и scheduled publishing workflow.
                </p>
              </div>
              <Button asChild variant="secondary" className="bg-white text-slate-950 hover:bg-white/90">
                <Link href="/posts">
                  Все статьи
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Reading brief</CardTitle>
              <CardDescription>{article.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2"><BookOpenText className="h-4 w-4" /> {readingTime} мин чтения</p>
              <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatRelativeDate(article.updatedAt)}</p>
              <p className="inline-flex items-center gap-2"><Gauge className="h-4 w-4" /> SEO Score: {article.seoScore}/100</p>
              <p>Slug: /posts/{article.slug}</p>
              <p>Author: {article.author.email}</p>
              <p>Image query: {article.imageQuery || "-"}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-primary/5">
            <CardHeader>
              <CardTitle>Topics in focus</CardTitle>
              <CardDescription>Навигация по теме через связанные теги текущего материала.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {article.tags.map((item) => (
                <Button key={item} asChild variant="outline" size="sm">
                  <Link href={`/posts?tag=${encodeURIComponent(item)}`}>{item}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {relatedArticles.length > 0 ? (
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Похожие материалы</CardTitle>
                <CardDescription>Еще несколько публикаций по близким тегам и теме.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedArticles.map((item) => (
                  <Link key={item.id} href={`/posts/${item.slug}`} className="block rounded-[1.25rem] border p-4 transition-colors hover:bg-secondary/50">
                    <p className="font-medium text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Читать
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </article>
    </main>
  );
}