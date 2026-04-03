import { GoogleGenerativeAI } from "@google/generative-ai";

import { getAiEnv } from "@/lib/env";
import { buildExcerpt, estimateSeoScore, parseTags, slugify } from "@/lib/utils";
import type { AiGenerateInput } from "@/lib/validations";
import type { AiGeneratedPayload } from "@/types/article";

function extractJson(input: string) {
  return input.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function generateArticleWithAI(input: AiGenerateInput): Promise<AiGeneratedPayload> {
  const env = getAiEnv();
  const client = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a senior SEO editor. Respond with valid JSON only. Generate a Russian-language article package for a headless CMS.
Fields required: title, metaTitle, metaDescription, slug, markdown, tags, imageQuery.
Rules:
- title should be SEO friendly and human readable
- metaDescription must be 150-160 characters
- slug must be latin lowercase words separated by hyphens
- markdown must include H1, H2, H3, bullet lists and bold text where relevant
- tags must contain 10-15 unique relevant tags
- imageQuery should be short and visually descriptive for Unsplash
Input:
Topic: ${input.topic}
Keywords: ${input.keywords || ""}
Desired length: ${input.desiredLength}
Tone of voice: ${input.toneOfVoice}
Target audience: ${input.targetAudience || ""}`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = JSON.parse(extractJson(text)) as {
    title: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
    markdown: string;
    tags: string[] | string;
    imageQuery: string;
  };

  const tags = parseTags(parsed.tags);
  const images = await fetchUnsplashImages(parsed.imageQuery || input.topic);
  const markdown = parsed.markdown.trim();

  return {
    title: parsed.title.trim(),
    metaTitle: parsed.metaTitle.trim(),
    metaDescription: parsed.metaDescription.trim().slice(0, 160),
    slug: slugify(parsed.slug || parsed.title),
    markdown,
    excerpt: buildExcerpt(markdown, 180),
    tags,
    imageQuery: parsed.imageQuery?.trim() || input.topic,
    featuredImage: images[0] ?? "",
    additionalImages: images.slice(1, 6),
    seoScore: estimateSeoScore({
      title: parsed.metaTitle || parsed.title,
      metaDescription: parsed.metaDescription,
      content: markdown,
      tags,
    }),
  };
}

export async function fetchUnsplashImages(query: string) {
  const env = getAiEnv();
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "6");
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unsplash request failed");
  }

  const data = (await response.json()) as {
    results: Array<{ urls: { regular: string } }>;
  };

  return data.results.map((item) => item.urls.regular).filter(Boolean);
}
