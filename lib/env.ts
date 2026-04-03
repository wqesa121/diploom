import { z } from "zod";

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
});

const aiEnvSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required"),
  UNSPLASH_ACCESS_KEY: z.string().min(1, "UNSPLASH_ACCESS_KEY is required"),
});

export function getMongoUri() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGO_URI or MONGODB_URI in environment variables.");
  }

  return uri;
}

export function getOptionalAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME || "NeuraCMS";
}

export function getAuthEnv() {
  return authEnvSchema.parse({
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  });
}

export function getAiEnv() {
  return aiEnvSchema.parse({
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  });
}
