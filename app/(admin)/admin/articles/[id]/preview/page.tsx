import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePenLine } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalPreviewActions } from "@/components/admin/external-preview-actions";
import { getPreviewToken } from "@/lib/env";
import { getArticleById } from "@/lib/articles";
import { markdownToHtml } from "@/lib/markdown";
import { DEFAULT_ROLE, getDefaultAdminPath, hasPermission } from "@/lib/permissions";
import { formatRelativeDate } from "@/lib/utils";

type ArticlePreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePreviewPage({ params }: ArticlePreviewPageProps) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role ?? DEFAULT_ROLE;
  const article = await getArticleById(id);
  const previewToken = getPreviewToken();

  if (!article) {
    notFound();
  }

  const contentHtml = markdownToHtml(article.markdown);
  const externalPreviewHref = previewToken ? `/preview/${article.slug}?token=${encodeURIComponent(previewToken)}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={getDefaultAdminPath(role)}>
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
        {hasPermission(role, "articles:edit") ? (
          <Button asChild>
            <Link href={`/admin/articles/${article.id}/edit`}>
              <FilePenLine className="h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        ) : null}
        {externalPreviewHref ? (
          <Button asChild variant="secondary">
            <Link href={externalPreviewHref} target="_blank" rel="noreferrer">
              External preview
            </Link>
          </Button>
        ) : null}
      </div>

      <article className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status}</Badge>
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl leading-tight">{article.title}</CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">{article.metaDescription}</CardDescription>
              </div>
            </CardHeader>
            {article.featuredImage ? (
              <CardContent className="space-y-6">
                <div className="relative aspect-[16/8] overflow-hidden rounded-[1.5rem] border bg-secondary">
                  <Image src={article.featuredImage} alt={article.title} fill className="object-cover" unoptimized priority />
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardContent className="p-6 md:p-10">
              <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </CardContent>
          </Card>

          {article.additionalImages.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные изображения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {article.additionalImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border bg-secondary">
                      <Image src={image} alt={`${article.title} preview ${index + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Preview meta</CardTitle>
              <CardDescription>Внутренний просмотр статьи до публикации.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Slug: /posts/{article.slug}</p>
              <p>Meta title: {article.metaTitle}</p>
              <p>SEO score: {article.seoScore}/100</p>
              <p>Updated: {formatRelativeDate(article.updatedAt)}</p>
              <p>Author: {article.author.name}</p>
              <p>Scheduled: {article.scheduledAt ? new Date(article.scheduledAt).toLocaleString("ru-RU") : "not set"}</p>
              <p>External preview: {externalPreviewHref ? "enabled" : "disabled (set PREVIEW_TOKEN)"}</p>
            </CardContent>
          </Card>

          {externalPreviewHref ? (
            <Card>
              <CardHeader>
                <CardTitle>Share preview</CardTitle>
                <CardDescription>Скопируйте или отправьте приватную ссылку на внешний preview.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExternalPreviewActions href={externalPreviewHref} />
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </article>
    </div>
  );
}