import Link from "next/link";
import { GitBranch, History, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";

type ArticleRevisionListProps = {
  articleId: string;
  revisions: Array<{
    id: string;
    revision: number;
    title: string;
    slug: string;
    status: "draft" | "published";
    featured: boolean;
    seoScore: number;
    editorName: string;
    editorEmail: string;
    scheduledAt: string | null;
    createdAt: string;
  }>;
};

export function ArticleRevisionList({ articleId, revisions }: ArticleRevisionListProps) {
  return (
    <Card className="border-white/70 bg-white/90">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <History className="h-3.5 w-3.5" />
          Version history
        </div>
        <CardTitle>Последние revisions</CardTitle>
        <CardDescription>Снимки статьи после каждого сохранения. Это даёт редактору прозрачную историю правок.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {revisions.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed bg-secondary/30 p-4 text-sm text-muted-foreground">
            Пока нет сохранённых revisions. Первая версия появится после сохранения статьи.
          </div>
        ) : (
          revisions.map((revision) => (
            <div key={revision.id} className="rounded-[1.25rem] border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>
                      <GitBranch className="mr-1 h-3 w-3" />
                      v{revision.revision}
                    </Badge>
                    <Badge variant={revision.status === "published" ? "default" : "secondary"}>{revision.status}</Badge>
                    {revision.featured ? <Badge variant="outline">featured</Badge> : null}
                  </div>
                  <p className="font-medium text-slate-950">{revision.title}</p>
                  <p className="text-sm text-muted-foreground">/{revision.slug}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatRelativeDate(revision.createdAt)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Editor: {revision.editorName}</p>
                <p>SEO score: {revision.seoScore}/100</p>
                <p>Scheduled: {revision.scheduledAt ? new Date(revision.scheduledAt).toLocaleString("ru-RU") : "not set"}</p>
                <p>Email: {revision.editorEmail || "-"}</p>
              </div>
            </div>
          ))
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href={`/admin/articles/${articleId}/preview`}>
            <Sparkles className="h-4 w-4" />
            Открыть текущий preview
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}