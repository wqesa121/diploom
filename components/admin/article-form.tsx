"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import type { ArticleActionState } from "@/actions/article-actions";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml } from "@/lib/markdown";
import { buildExcerpt, slugify } from "@/lib/utils";
import type { AiGeneratedPayload, SerializedArticle } from "@/types/article";

type ArticleFormProps = {
  mode: "create" | "edit";
  initialData?: SerializedArticle;
  action: (state: ArticleActionState, formData: FormData) => Promise<ArticleActionState>;
};

const initialState: ArticleActionState = {
  success: false,
};

export function ArticleForm({ mode, initialData, action }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [markdown, setMarkdown] = useState(initialData?.markdown ?? "");
  const [contentJson, setContentJson] = useState<Record<string, unknown>>(
    initialData?.content ?? { type: "doc", content: [] },
  );
  const [editorHtml, setEditorHtml] = useState("");
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") ?? "");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage ?? "");
  const [additionalImagesInput, setAdditionalImagesInput] = useState(initialData?.additionalImages.join(", ") ?? "");
  const [imageQuery, setImageQuery] = useState(initialData?.imageQuery ?? "");
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status ?? "draft");
  const [topic, setTopic] = useState(initialData?.title ?? "");
  const [keywords, setKeywords] = useState(initialData?.tags.join(", ") ?? "");
  const [desiredLength, setDesiredLength] = useState<"short" | "medium" | "long">("medium");
  const [toneOfVoice, setToneOfVoice] = useState("Экспертный и убедительный");
  const [targetAudience, setTargetAudience] = useState("Маркетологи, редакторы и founders digital-проектов");
  const [aiLoading, setAiLoading] = useState(false);

  const allImages = useMemo(() => {
    return Array.from(new Set([featuredImage, ...additionalImagesInput.split(",").map((item) => item.trim())].filter(Boolean)));
  }, [additionalImagesInput, featuredImage]);

  async function handleGenerateWithAI() {
    setAiLoading(true);

    try {
      const response = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          keywords,
          desiredLength,
          toneOfVoice,
          targetAudience,
        }),
      });

      if (!response.ok) {
        throw new Error("AI generation failed");
      }

      const payload = (await response.json()) as AiGeneratedPayload;
      hydrateFromAi(payload);
      toast.success("Контент сгенерирован и подставлен в форму.");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сгенерировать контент через AI.");
    } finally {
      setAiLoading(false);
    }
  }

  function hydrateFromAi(payload: AiGeneratedPayload) {
    setTitle(payload.title);
    setSlug(payload.slug);
    setMetaTitle(payload.metaTitle);
    setMetaDescription(payload.metaDescription);
    setExcerpt(payload.excerpt || buildExcerpt(payload.markdown, 180));
    setMarkdown(payload.markdown);
    setTagsInput(payload.tags.join(", "));
    setFeaturedImage(payload.featuredImage);
    setAdditionalImagesInput(payload.additionalImages.join(", "));
    setImageQuery(payload.imageQuery);
    setEditorHtml(markdownToHtml(payload.markdown));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="content" value={JSON.stringify(contentJson)} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="tags" value={tagsInput} />
        <input type="hidden" name="additionalImages" value={additionalImagesInput} />
        <input type="hidden" name="featuredImage" value={featuredImage} />
        <input type="hidden" name="imageQuery" value={imageQuery} />

        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "Создание статьи" : "Редактирование статьи"}</CardTitle>
            <CardDescription>
              Tiptap хранит структуру материала в JSON, а markdown source остается доступен для headless delivery и AI workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitle(nextTitle);
                    if (!slug || slug === slugify(title)) {
                      setSlug(slugify(nextTitle));
                    }
                  }}
                  placeholder="Например: Headless CMS для AI-driven редакции"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  className="min-h-[110px]"
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} required />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Rich Text Editor</Label>
              <RichTextEditor
                initialContent={initialData?.content}
                htmlContent={editorHtml}
                onChange={(value) => setContentJson(value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="markdown">Markdown Source</Label>
              <Textarea
                id="markdown"
                name="markdown"
                className="min-h-[320px] font-mono text-xs"
                value={markdown}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setMarkdown(nextValue);
                  if (!excerpt) {
                    setExcerpt(buildExcerpt(nextValue, 180));
                  }
                }}
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="seo, ai, headless cms" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageQuery">Image Search Query</Label>
                <Input id="imageQuery" value={imageQuery} onChange={(event) => setImageQuery(event.target.value)} placeholder="editorial ai workspace" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="featuredImageVisible">Featured Image</Label>
                <Input id="featuredImageVisible" value={featuredImage} onChange={(event) => setFeaturedImage(event.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="additionalImages">Additional Images</Label>
                <Textarea
                  id="additionalImages"
                  className="min-h-[110px]"
                  value={additionalImagesInput}
                  onChange={(event) => setAdditionalImagesInput(event.target.value)}
                  placeholder="Одна или несколько ссылок через запятую"
                />
              </div>
            </div>

            {allImages.length > 0 ? (
              <div className="space-y-3">
                <Label>Подобранные изображения</Label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {allImages.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setFeaturedImage(image)}
                      className={`overflow-hidden rounded-[1.25rem] border text-left transition ${featuredImage === image ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                    >
                      <div className="relative aspect-[4/3] bg-secondary">
                        <Image src={image} alt="Unsplash preview" fill className="object-cover" unoptimized />
                      </div>
                      <div className="p-3 text-xs text-muted-foreground">
                        {featuredImage === image ? "Featured image" : "Нажмите, чтобы сделать главным изображением"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {mode === "create" ? "Сохранить статью" : "Обновить статью"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSlug(slugify(title))}>
                Сгенерировать slug
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Generate with AI
            </div>
            <CardTitle>AI content assistant</CardTitle>
            <CardDescription>
              Дайте только тему, тон, длину и контекст аудитории. Gemini соберет SEO-структуру и подберет изображения через Unsplash.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Main title</Label>
              <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Headless CMS с AI-автоматизацией" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Textarea id="keywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} className="min-h-[90px]" />
            </div>
            <div className="space-y-2">
              <Label>Desired length</Label>
              <Select value={desiredLength} onValueChange={(value) => setDesiredLength(value as "short" | "medium" | "long")}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите длину" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toneOfVoice">Tone of voice</Label>
              <Input id="toneOfVoice" value={toneOfVoice} onChange={(event) => setToneOfVoice(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target audience</Label>
              <Textarea id="targetAudience" value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} className="min-h-[90px]" />
            </div>
            <Button type="button" className="w-full" size="lg" disabled={aiLoading} onClick={handleGenerateWithAI}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
