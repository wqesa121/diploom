import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createArticleAction } from "@/actions/article-actions";
import { ArticleForm } from "@/components/admin/article-form";
import { DEFAULT_ROLE, getDefaultAdminPath, hasPermission } from "@/lib/permissions";

export default async function NewArticlePage() {
  const session = await auth();
  const role = session?.user?.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "articles:create")) {
    redirect(getDefaultAdminPath(role));
  }

  return <ArticleForm mode="create" action={createArticleAction} />;
}
