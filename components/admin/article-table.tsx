import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { deleteArticleAction } from "@/actions/article-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeDate } from "@/lib/utils";
import type { SerializedArticle } from "@/types/article";

type ArticleTableProps = {
  articles: SerializedArticle[];
};

export function ArticleTable({ articles }: ArticleTableProps) {
  if (!articles.length) {
    return <div className="rounded-[1.5rem] border border-dashed bg-white/70 p-10 text-center text-muted-foreground">Пока нет статей. Создайте первую через Generate with AI.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
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
              <div className="space-y-1">
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-muted-foreground">/{article.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status}</Badge>
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
            <TableCell>{formatRelativeDate(article.updatedAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
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
  );
}
