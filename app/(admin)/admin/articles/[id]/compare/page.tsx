import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleById } from "@/lib/articles";
import { getArticleRevisionSnapshot, getArticleRevisions } from "@/lib/revisions";
import type { ArticleStatus, SerializedArticle } from "@/types/article";

type ComparePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ base?: string; target?: string }>;
};

type CompareSnapshot = {
  id: string;
  label: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  markdown: string;
  tags: string[];
  status: ArticleStatus;
  featured: boolean;
  scheduledAt: string | null;
  seoScore: number;
  createdAt: string;
  editorName: string;
  editorEmail: string;
};

function trimText(value: string, limit = 280) {
  return value.length > limit ? `${value.slice(0, limit).trimEnd()}...` : value;
}

function normalizeSnapshot(article: SerializedArticle): CompareSnapshot {
  return {
    id: article.id,
    label: "Current draft",
    title: article.title,
    slug: article.slug,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    excerpt: article.excerpt,
    markdown: article.markdown,
    tags: article.tags,
    status: article.status,
    featured: article.featured,
    scheduledAt: article.scheduledAt,
    seoScore: article.seoScore,
    createdAt: article.updatedAt,
    editorName: article.author.name,
    editorEmail: article.author.email,
  };
}

function summarizeChanges(base: CompareSnapshot, target: CompareSnapshot) {
  const changedFields = [
    ["Title", base.title !== target.title],
    ["Slug", base.slug !== target.slug],
    ["Meta title", base.metaTitle !== target.metaTitle],
    ["Meta description", base.metaDescription !== target.metaDescription],
    ["Excerpt", base.excerpt !== target.excerpt],
    ["Markdown", base.markdown !== target.markdown],
    ["Status", base.status !== target.status],
    ["Featured", base.featured !== target.featured],
    ["SEO score", base.seoScore !== target.seoScore],
    ["Schedule", (base.scheduledAt ?? "") !== (target.scheduledAt ?? "")],
    ["Tags", base.tags.join("|") !== target.tags.join("|")],
  ] as Array<[string, boolean]>;

  const changedFieldNames = changedFields.filter(([, changed]) => changed).map(([field]) => field);

  const addedTags = target.tags.filter((tag) => !base.tags.includes(tag));
  const removedTags = base.tags.filter((tag) => !target.tags.includes(tag));

  return { changedFields: changedFieldNames, addedTags, removedTags };
}

function SnapshotCard({ title, snapshot }: { title: string; snapshot: CompareSnapshot }) {
  return (
    <Card className="h-full border-slate-200/80 bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-2">{snapshot.label}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={snapshot.status === "published" ? "default" : "secondary"}>{snapshot.status}</Badge>
            {snapshot.featured ? <Badge variant="outline">featured</Badge> : null}
            <Badge variant="outline">SEO {snapshot.seoScore}/100</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Title</p>
          <p className="mt-2 font-medium text-slate-950">{snapshot.title}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slug</p>
          <p className="mt-2 text-slate-800">/{snapshot.slug}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meta title</p>
          <p className="mt-2 text-slate-800">{snapshot.metaTitle}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meta description</p>
          <p className="mt-2 text-slate-800">{snapshot.metaDescription}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Excerpt</p>
          <p className="mt-2 text-slate-800">{snapshot.excerpt}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {snapshot.tags.length ? snapshot.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-muted-foreground">No tags</span>}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Markdown snapshot</p>
          <pre className="mt-2 overflow-x-auto rounded-[1rem] border bg-secondary/20 p-4 whitespace-pre-wrap font-mono text-xs text-slate-800">{trimText(snapshot.markdown, 900)}</pre>
        </div>
        <div className="grid gap-3 rounded-[1rem] border bg-secondary/15 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</p>
            <p className="mt-2 text-slate-800">{snapshot.scheduledAt ? new Date(snapshot.scheduledAt).toLocaleString("ru-RU") : "Publish on demand"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Edited by</p>
            <p className="mt-2 text-slate-800">{snapshot.editorName || snapshot.editorEmail || "Unknown user"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CompareRevisionPage({ params, searchParams }: ComparePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [article, revisions] = await Promise.all([getArticleById(id), getArticleRevisions(id, 12)]);

  if (!article) {
    notFound();
  }

  const baseRevisionId = query.base ?? revisions[0]?.id;
  const targetRevisionId = query.target ?? "current";

  if (!baseRevisionId) {
    notFound();
  }

  const baseRevision = await getArticleRevisionSnapshot(baseRevisionId);

  if (!baseRevision || baseRevision.articleId !== article.id) {
    notFound();
  }

  const currentSnapshot = normalizeSnapshot(article);
  const targetRevisionSnapshot = targetRevisionId === "current" ? null : await getArticleRevisionSnapshot(targetRevisionId);

  if (targetRevisionId !== "current" && (!targetRevisionSnapshot || targetRevisionSnapshot.articleId !== article.id)) {
    notFound();
  }

  const resolvedTargetRevision = targetRevisionId === "current" ? null : targetRevisionSnapshot;

  const baseSnapshot: CompareSnapshot = {
    id: baseRevision.id,
    label: `Revision v${baseRevision.revision}`,
    title: baseRevision.title,
    slug: baseRevision.slug,
    metaTitle: baseRevision.metaTitle,
    metaDescription: baseRevision.metaDescription,
    excerpt: baseRevision.excerpt,
    markdown: baseRevision.markdown,
    tags: baseRevision.tags,
    status: baseRevision.status,
    featured: baseRevision.featured,
    scheduledAt: baseRevision.scheduledAt,
    seoScore: baseRevision.seoScore,
    createdAt: baseRevision.createdAt,
    editorName: baseRevision.editorName,
    editorEmail: baseRevision.editorEmail,
  };

  const targetSnapshot: CompareSnapshot =
    targetRevisionId === "current"
      ? currentSnapshot
      : {
          id: resolvedTargetRevision!.id,
          label: `Revision v${resolvedTargetRevision!.revision}`,
          title: resolvedTargetRevision!.title,
          slug: resolvedTargetRevision!.slug,
          metaTitle: resolvedTargetRevision!.metaTitle,
          metaDescription: resolvedTargetRevision!.metaDescription,
          excerpt: resolvedTargetRevision!.excerpt,
          markdown: resolvedTargetRevision!.markdown,
          tags: resolvedTargetRevision!.tags,
          status: resolvedTargetRevision!.status,
          featured: resolvedTargetRevision!.featured,
          scheduledAt: resolvedTargetRevision!.scheduledAt,
          seoScore: resolvedTargetRevision!.seoScore,
          createdAt: resolvedTargetRevision!.createdAt,
          editorName: resolvedTargetRevision!.editorName,
          editorEmail: resolvedTargetRevision!.editorEmail,
        };

  const summary = summarizeChanges(baseSnapshot, targetSnapshot);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Revision compare</CardTitle>
            <CardDescription>Сравнение snapshot к snapshot по ключевым полям, SEO, schedule, тегам и markdown перед restore или publish.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/articles/${article.id}/edit`}>Back to editor</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/articles/${article.id}/preview`}>Open preview</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="grid gap-3 rounded-[1.5rem] border bg-secondary/30 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Base snapshot
              <select
                name="base"
                defaultValue={baseRevisionId}
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
              >
                {revisions.map((revision) => (
                  <option key={revision.id} value={revision.id}>
                    v{revision.revision} • {revision.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Target snapshot
              <select
                name="target"
                defaultValue={targetRevisionId}
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
              >
                <option value="current">Current article state</option>
                {revisions.map((revision) => (
                  <option key={revision.id} value={revision.id}>
                    v{revision.revision} • {revision.title}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Compare</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Changed fields: {summary.changedFields.length}</Badge>
            {summary.changedFields.map((field) => (
              <Badge key={field} variant="outline">{field}</Badge>
            ))}
          </div>

          {(summary.addedTags.length > 0 || summary.removedTags.length > 0) ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border bg-white p-4">
                <p className="text-sm font-medium text-slate-900">Added tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.addedTags.length ? summary.addedTags.map((tag) => <Badge key={tag}>{tag}</Badge>) : <span className="text-sm text-muted-foreground">No new tags</span>}
                </div>
              </div>
              <div className="rounded-[1.25rem] border bg-white p-4">
                <p className="text-sm font-medium text-slate-900">Removed tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.removedTags.length ? summary.removedTags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-sm text-muted-foreground">No removed tags</span>}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <SnapshotCard title="Base" snapshot={baseSnapshot} />
            <SnapshotCard title="Target" snapshot={targetSnapshot} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}