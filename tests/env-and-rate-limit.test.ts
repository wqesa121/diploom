import assert from "node:assert/strict";
import test from "node:test";

import { getAiRateLimitConfig, getMonitoringWebhookUrl, getOptionalAppName, getRevalidateRateLimitConfig } from "../lib/env";
import { getRequestRateLimitKey } from "../lib/rate-limit";

test("rate limit config falls back to safe defaults", () => {
  const previousAiMax = process.env.AI_RATE_LIMIT_MAX;
  const previousAiWindow = process.env.AI_RATE_LIMIT_WINDOW_SECONDS;
  const previousRevalidateMax = process.env.REVALIDATE_RATE_LIMIT_MAX;
  const previousRevalidateWindow = process.env.REVALIDATE_RATE_LIMIT_WINDOW_SECONDS;

  delete process.env.AI_RATE_LIMIT_MAX;
  delete process.env.AI_RATE_LIMIT_WINDOW_SECONDS;
  delete process.env.REVALIDATE_RATE_LIMIT_MAX;
  delete process.env.REVALIDATE_RATE_LIMIT_WINDOW_SECONDS;

  assert.deepEqual(getAiRateLimitConfig(), { limit: 10, windowSeconds: 3600 });
  assert.deepEqual(getRevalidateRateLimitConfig(), { limit: 30, windowSeconds: 60 });

  process.env.AI_RATE_LIMIT_MAX = previousAiMax;
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS = previousAiWindow;
  process.env.REVALIDATE_RATE_LIMIT_MAX = previousRevalidateMax;
  process.env.REVALIDATE_RATE_LIMIT_WINDOW_SECONDS = previousRevalidateWindow;
});

test("rate limit config accepts valid overrides", () => {
  const previousAiMax = process.env.AI_RATE_LIMIT_MAX;
  const previousAiWindow = process.env.AI_RATE_LIMIT_WINDOW_SECONDS;

  process.env.AI_RATE_LIMIT_MAX = "25";
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS = "120";

  assert.deepEqual(getAiRateLimitConfig(), { limit: 25, windowSeconds: 120 });

  process.env.AI_RATE_LIMIT_MAX = previousAiMax;
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS = previousAiWindow;
});

test("app name fallback stays stable", () => {
  const previousAppName = process.env.NEXT_PUBLIC_APP_NAME;
  delete process.env.NEXT_PUBLIC_APP_NAME;
  assert.equal(getOptionalAppName(), "NeuraCMS");
  process.env.NEXT_PUBLIC_APP_NAME = "Studio CMS";
  assert.equal(getOptionalAppName(), "Studio CMS");
  process.env.NEXT_PUBLIC_APP_NAME = previousAppName;
});

test("monitoring webhook env stays optional", () => {
  const previousWebhook = process.env.MONITORING_WEBHOOK_URL;
  delete process.env.MONITORING_WEBHOOK_URL;
  assert.equal(getMonitoringWebhookUrl(), null);
  process.env.MONITORING_WEBHOOK_URL = "https://hooks.example.test/monitoring";
  assert.equal(getMonitoringWebhookUrl(), "https://hooks.example.test/monitoring");
  process.env.MONITORING_WEBHOOK_URL = previousWebhook;
});

test("request rate limit key prefers forwarded ip and falls back predictably", () => {
  const forwardedRequest = new Request("http://localhost/api/test", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 70.41.3.18",
      "x-real-ip": "198.51.100.5",
    },
  });
  assert.equal(getRequestRateLimitKey(forwardedRequest, "fallback-key"), "203.0.113.10");

  const realIpRequest = new Request("http://localhost/api/test", {
    headers: {
      "x-real-ip": "198.51.100.5",
    },
  });
  assert.equal(getRequestRateLimitKey(realIpRequest, "fallback-key"), "198.51.100.5");

  const anonymousRequest = new Request("http://localhost/api/test");
  assert.equal(getRequestRateLimitKey(anonymousRequest, "fallback-key"), "fallback-key");
});