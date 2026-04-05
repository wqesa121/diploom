import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseTags(input: string | string[]) {
  const source = Array.isArray(input) ? input.join(",") : input;

  return source
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 15);
}

export function buildExcerpt(content: string, limit = 180) {
  const plain = content.replace(/[#*_>`\-]/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > limit ? `${plain.slice(0, limit - 1)}…` : plain;
}

export function estimateSeoScore(params: {
  title: string;
  metaDescription: string;
  content: string;
  tags: string[];
}) {
  let score = 0;

  if (params.title.length >= 40 && params.title.length <= 65) score += 25;
  if (params.metaDescription.length >= 150 && params.metaDescription.length <= 160) score += 25;
  if (params.content.length >= 1500) score += 25;
  if (params.tags.length >= 8) score += 25;

  return score;
}

export function formatRelativeDate(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ru,
  });
}

export function formatCalendarDate(date: Date | string) {
  return format(new Date(date), "d MMMM yyyy", {
    locale: ru,
  });
}

export function estimateReadingTime(content: string, wordsPerMinute = 220) {
  const wordCount = content
    .replace(/[#*_>`\-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
