"use client";

import Link from "next/link";
import { Clock3, Eye, Pencil, Send, ShieldAlert, Undo2 } from "lucide-react";

import { updateArticleWorkflowAction } from "@/actions/article-actions";
import { ReviewNotesPanel } from "@/components/admin/review-notes-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { formatRelativeDate } from "@/lib/utils";
import type { SerializedArticle } from "@/types/article";

type ReviewQueueProps = {
  articles: SerializedArticle[];
  role: UserRole;
};

function getReviewPriority(article: SerializedArticle) {
  const scheduledTime = article.scheduledAt ? new Date(article.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
  const hoursSinceUpdate = Math.max(0, (Date.now() - new Date(article.updatedAt).getTime()) / (1000 * 60 * 60));
  const seoGap = Math.max(0, 85 - article.seoScore);

  return {
    score: seoGap * 4 + Math.min(hoursSinceUpdate, 72),
    scheduledTime,
  };
}

export function ReviewQueue({ articles, role }: ReviewQueueProps) {
  if (!articles.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review queue is clear</CardTitle>
          <CardDescription>Сейчас нет материалов в статусе `in review`. Новые статьи можно отправлять на ревью прямо из library.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sortedArticles = [...articles].sort((left, right) => {
    const leftPriority = getReviewPriority(left);
    const rightPriority = getReviewPriority(right);

    if (leftPriority.scheduledTime !== rightPriority.scheduledTime) {
      return leftPriority.scheduledTime - rightPriority.scheduledTime;
    }

    if (leftPriority.score !== rightPriority.score) {
      return rightPriority.score - leftPriority.score;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sortedArticles.map((article, index) => {
        const scheduledTime = article.scheduledAt ? new Date(article.scheduledAt).getTime() : null;
        const isScheduled = !!scheduledTime && scheduledTime > Date.now();
        const needsSeoWork = article.seoScore < 80;

        return (
          <Card key={article.id} className="border-slate-200/80 bg-white/90">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Priority #{index + 1}</Badge>
                    <Badge variant="outline">SEO {article.seoScore}/100</Badge>
                    {isScheduled ? <Badge variant="outline">Scheduled</Badge> : null}
                    {needsSeoWork ? <Badge variant="outline">Needs SEO pass</Badge> : null}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{article.title}</CardTitle>
                    <CardDescription className="mt-2 max-w-2xl">{article.excerpt}</CardDescription>
                  </div>
                </div>
                <div className="rounded-2xl border bg-secondary/40 px-3 py-2 text-right text-sm text-muted-foreground">
                  <p>Updated {formatRelativeDate(article.updatedAt)}</p>
                  <p>{article.author.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-[1.25rem] border bg-secondary/20 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slug</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">/{article.slug}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Review risk</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    {needsSeoWork ? "SEO требует доработки" : "Готово к публикации"}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {article.scheduledAt ? new Date(article.scheduledAt).toLocaleString("ru-RU") : "Publish on demand"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {hasPermission(role, "articles:publish") ? (
                  <form action={updateArticleWorkflowAction.bind(null, article.id, "published")}>
                    <Button size="sm">
                      <Send className="h-4 w-4" />
                      Publish now
                    </Button>
                  </form>
                ) : null}
                <form action={updateArticleWorkflowAction.bind(null, article.id, "draft")}>
                  <Button variant="outline" size="sm">
                    <Undo2 className="h-4 w-4" />
                    Return to draft
                  </Button>
                </form>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/admin/articles/${article.id}/preview`}>
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={hasPermission(role, "articles:edit") ? `/admin/articles/${article.id}/edit` : `/admin/articles/${article.id}/compare`}>
                    <Pencil className="h-4 w-4" />
                    {hasPermission(role, "articles:edit") ? "Open editor" : "Open compare"}
                  </Link>
                </Button>
              </div>

              <ReviewNotesPanel
                articleId={article.id}
                notes={article.reviewNotes}
                redirectTo="/admin/review"
                title="Reviewer notes"
                description="Оставляйте контекст по доработкам, спорным местам и причинам возврата без выхода из очереди ревью."
                compact
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}