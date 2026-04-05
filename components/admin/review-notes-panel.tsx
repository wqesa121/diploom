"use client";

import { MessageSquareQuote } from "lucide-react";

import { addArticleReviewNoteAction } from "@/actions/article-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeDate } from "@/lib/utils";
import type { ArticleReviewNote } from "@/types/article";

type ReviewNotesPanelProps = {
  articleId: string;
  notes: ArticleReviewNote[];
  redirectTo: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export function ReviewNotesPanel({
  articleId,
  notes,
  redirectTo,
  title = "Review notes",
  description = "Фиксируйте замечания редактора, причины возврата в draft и контекст перед публикацией.",
  compact = false,
}: ReviewNotesPanelProps) {
  return (
    <Card className="border-white/70 bg-white/90">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <MessageSquareQuote className="h-3.5 w-3.5" />
          Editorial feedback
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={addArticleReviewNoteAction.bind(null, articleId)} className="space-y-3 rounded-[1.25rem] border bg-secondary/20 p-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Textarea
            name="body"
            required
            minLength={10}
            maxLength={1000}
            placeholder="Например: сократить лид, добавить конкретику в блок с источниками, проверить формулировку в meta description."
            className={compact ? "min-h-[110px]" : "min-h-[140px]"}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Заметка сохранится в истории статьи и будет видна в review queue.</p>
            <Button type="submit" size="sm">Add note</Button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed bg-secondary/20 p-4 text-sm text-muted-foreground">
            Пока нет review notes. Добавьте первую заметку, чтобы у команды был редакторский контекст по статье.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-[1.25rem] border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{note.authorName || note.authorEmail || "Unknown editor"}</p>
                    <p className="text-xs text-muted-foreground">{note.authorEmail || "No email"}</p>
                  </div>
                  <Badge variant="outline">{formatRelativeDate(note.createdAt)}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}