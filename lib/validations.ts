import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Введите текущий пароль"),
    newPassword: z.string().min(8, "Новый пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string().min(8, "Подтвердите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Подтверждение пароля не совпадает",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Новый пароль должен отличаться от текущего",
    path: ["newPassword"],
  });

export const articleSchema = z.object({
  title: z.string().min(5).max(120),
  slug: z.string().min(3).max(140),
  metaTitle: z.string().min(10).max(70),
  metaDescription: z.string().min(140).max(160),
  excerpt: z.string().min(20).max(220),
  markdown: z.string().min(120),
  content: z.string().min(2),
  tags: z.array(z.string().min(1)).min(1).max(15),
  featuredImage: z.string().url().or(z.literal("")),
  additionalImages: z.array(z.string().url()).max(6),
  imageQuery: z.string().max(120).optional().default(""),
  status: z.enum(["draft", "in_review", "published"]),
  featured: z.enum(["true", "false"]).transform((value) => value === "true"),
  scheduledAt: z
    .string()
    .optional()
    .default("")
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Укажите корректную дату отложенной публикации"),
});

export const aiGenerateSchema = z.object({
  topic: z.string().min(5).max(120),
  keywords: z.string().optional().default(""),
  desiredLength: z.enum(["short", "medium", "long"]),
  toneOfVoice: z.string().min(3).max(60),
  targetAudience: z.string().optional().default(""),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;
