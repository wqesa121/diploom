import Link from "next/link";

import { ReviewQueue } from "@/components/admin/review-queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllArticles } from "@/lib/articles";

export default async function ReviewPage() {
  const allArticles = await getAllArticles();
  const reviewArticles = allArticles.filter((article) => article.status === "in_review");
  const scheduledReview = reviewArticles.filter(
    (article) => !!article.scheduledAt && new Date(article.scheduledAt).getTime() > Date.now(),
  ).length;
  const strongSeoCount = reviewArticles.filter((article) => article.seoScore >= 80).length;
  const averageSeo = reviewArticles.length
    ? Math.round(reviewArticles.reduce((total, article) => total + article.seoScore, 0) / reviewArticles.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Review queue</CardTitle>
            <CardDescription>Отдельный поток для редактора: все материалы в статусе `in review`, приоритеты и быстрый выпуск без перехода в общую library.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/articles?status=in_review">Open filtered library</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/articles/new">Create article</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">In review: {reviewArticles.length}</Badge>
            <Badge variant="outline">Ready for publish: {strongSeoCount}</Badge>
            <Badge variant="outline">Scheduled: {scheduledReview}</Badge>
            <Badge variant="outline">Average SEO: {averageSeo}/100</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border bg-secondary/20 p-5">
              <p className="text-sm font-medium text-muted-foreground">Queue size</p>
              <p className="mt-3 text-3xl font-semibold">{reviewArticles.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Материалы, ожидающие редакторского решения.</p>
            </div>
            <div className="rounded-[1.5rem] border bg-secondary/20 p-5">
              <p className="text-sm font-medium text-muted-foreground">SEO-ready items</p>
              <p className="mt-3 text-3xl font-semibold">{strongSeoCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Статьи с SEO score 80+, которые можно выпускать без дополнительного pass.</p>
            </div>
            <div className="rounded-[1.5rem] border bg-secondary/20 p-5">
              <p className="text-sm font-medium text-muted-foreground">Scheduled review</p>
              <p className="mt-3 text-3xl font-semibold">{scheduledReview}</p>
              <p className="mt-2 text-sm text-muted-foreground">Материалы с назначенным окном публикации.</p>
            </div>
          </div>

          <ReviewQueue articles={reviewArticles} />
        </CardContent>
      </Card>
    </div>
  );
}