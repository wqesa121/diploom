import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticleBySlug, getRelatedPublishedArticles } from "@/lib/articles";
import { markdownToHtml } from "@/lib/markdown";
import { formatRelativeDate } from "@/lib/utils";

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
          <header className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{article.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{article.metaDescription}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Автор: {article.author.name}</span>
              <span>Обновлено {formatRelativeDate(article.updatedAt)}</span>
              <span>SEO Score: {article.seoScore}/100</span>
            </div>
          </header>

          {article.featuredImage ? (
            <div className="relative aspect-[16/8] overflow-hidden rounded-[2rem] border bg-secondary">
              <Image src={article.featuredImage} alt={article.title} fill className="object-cover" unoptimized priority />
            </div>
          ) : null}

          <div className="rounded-[2rem] border bg-white/90 p-6 shadow-sm md:p-10">
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>

          {article.additionalImages.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Галерея</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {article.additionalImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border bg-secondary">
                    <Image src={image} alt={`${article.title} image ${index + 1}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Article summary</CardTitle>
              <CardDescription>{article.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Slug: /posts/{article.slug}</p>
              <p>Author: {article.author.email}</p>
              <p>Image query: {article.imageQuery || "-"}</p>
            </CardContent>
          </Card>

          {relatedArticles.length > 0 ? (
            <Card>
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