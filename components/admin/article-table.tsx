"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { bulkArticleAction, deleteArticleAction } from "@/actions/article-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeDate } from "@/lib/utils";
import type { SerializedArticle } from "@/types/article";

type ArticleTableProps = {
  articles: SerializedArticle[];
};

export function ArticleTable({ articles }: ArticleTableProps) {
  const now = Date.now();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"publish" | "draft" | "delete">("publish");
  const allSelected = useMemo(() => articles.length > 0 && selectedIds.length === articles.length, [articles.length, selectedIds.length]);

  if (!articles.length) {
    return <div className="rounded-[1.5rem] border border-dashed bg-white/70 p-10 text-center text-muted-foreground">Пока нет статей. Создайте первую через Generate with AI.</div>;
  }

  function toggleArticleSelection(articleId: string) {
    setSelectedIds((current) =>
      current.includes(articleId) ? current.filter((value) => value !== articleId) : [...current, articleId],
    );
  }

  function toggleAllSelection() {
    setSelectedIds((current) => (current.length === articles.length ? [] : articles.map((article) => article.id)));
  }

  return (
    <div className="space-y-4">
      <form action={bulkArticleAction} className="flex flex-col gap-3 rounded-[1.25rem] border bg-secondary/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950">Bulk actions</p>
          <p className="text-sm text-muted-foreground">Выбрано: {selectedIds.length} из {articles.length}</p>
        </div>
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="articleIds" value={id} />
        ))}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            name="bulkAction"
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value as "publish" | "draft" | "delete")}
            className="flex h-11 min-w-[220px] rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
          >
            <option value="publish">Publish selected</option>
            <option value="draft">Move selected to draft</option>
            <option value="delete">Delete selected</option>
          </select>
          <Button type="submit" disabled={selectedIds.length === 0} variant={bulkAction === "delete" ? "destructive" : "default"}>
            Apply
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input type="checkbox" checked={allSelected} onChange={toggleAllSelection} aria-label="Select all articles" />
            </TableHead>
            <TableHead>Article</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>SEO</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(article.id)}
                  onChange={() => toggleArticleSelection(article.id)}
                  aria-label={`Select ${article.title}`}
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{article.title}</p>
                  <p className="text-sm text-muted-foreground">/{article.slug}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status}</Badge>
                  {article.featured ? <Badge>featured</Badge> : null}
                  {article.status === "published" && article.scheduledAt && new Date(article.scheduledAt).getTime() > now ? (
                    <Badge variant="outline">scheduled</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex max-w-[300px] flex-wrap gap-2">
                  {article.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{article.seoScore}/100</TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p>{formatRelativeDate(article.updatedAt)}</p>
                  {article.scheduledAt ? <p className="text-xs text-muted-foreground">Publish: {new Date(article.scheduledAt).toLocaleString("ru-RU")}</p> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/articles/${article.id}/preview`}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <form action={deleteArticleAction.bind(null, article.id)}>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
