import { notFound } from "next/navigation";

import { updateArticleAction } from "@/actions/article-actions";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleById } from "@/lib/articles";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  return <ArticleForm mode="edit" initialData={article} action={updateArticleAction.bind(null, article.id)} />;
}
