import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleTable } from "@/components/admin/article-table";
import { getAllArticles } from "@/lib/articles";

export default async function ArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Content library</CardTitle>
            <CardDescription>Управляйте всеми draft и published материалами из одного списка.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/articles/new">Новая статья</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ArticleTable articles={articles} />
        </CardContent>
      </Card>
    </div>
  );
}
