import { createArticleAction } from "@/actions/article-actions";
import { ArticleForm } from "@/components/admin/article-form";

export default function NewArticlePage() {
  return <ArticleForm mode="create" action={createArticleAction} />;
}
