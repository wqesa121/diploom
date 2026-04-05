import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleBySlug } from "@/lib/articles";
import { getPreviewToken } from "@/lib/env";
import { markdownToHtml } from "@/lib/markdown";
import { formatRelativeDate } from "@/lib/utils";

type PreviewPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

function isValidPreviewToken(token?: string) {
  const previewToken = getPreviewToken();

  if (!previewToken || !token) {
    return false;
  }

  return token === previewToken;
}

export async function generateMetadata({ params, searchParams }: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!isValidPreviewToken(token)) {
    return {
      title: "Preview not available",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Preview not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${article.metaTitle} | Preview`,
    description: article.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ExternalPreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!isValidPreviewToken(token)) {
    notFound();
  }

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const contentHtml = markdownToHtml(article.markdown);

  return (
    <main className="container space-y-8 py-10 md:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4" />
            Все публикации
          </Link>
        </Button>
        <Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status}</Badge>
        <div className="text-sm text-muted-foreground">Private preview link for draft review</div>
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
              <CardTitle>Preview mode</CardTitle>
              <CardDescription>Черновик или опубликованная статья доступны только по приватному токену.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Slug: /preview/{article.slug}</p>
              <p>Status: {article.status}</p>
              <p>Author: {article.author.email}</p>
              <p>Image query: {article.imageQuery || "-"}</p>
            </CardContent>
          </Card>
        </aside>
      </article>
    </main>
  );
}