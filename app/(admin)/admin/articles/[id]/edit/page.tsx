import { notFound } from "next/navigation";

import { updateArticleAction } from "@/actions/article-actions";
import { ArticleForm } from "@/components/admin/article-form";
import { ArticleRevisionList } from "@/components/admin/article-revision-list";
import { ReviewNotesPanel } from "@/components/admin/review-notes-panel";
import { getArticleById } from "@/lib/articles";
import { getArticleRevisions } from "@/lib/revisions";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const [article, revisions] = await Promise.all([getArticleById(id), getArticleRevisions(id)]);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ArticleForm mode="edit" initialData={article} action={updateArticleAction.bind(null, article.id)} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <ArticleRevisionList articleId={article.id} revisions={revisions} />
        <ReviewNotesPanel articleId={article.id} notes={article.reviewNotes} redirectTo={`/admin/articles/${article.id}/edit`} />
      </div>
    </div>
  );
}
