import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { getOptionalAppName } from "@/lib/env";

type HealthStatus = "ok" | "degraded";

type DatabaseHealth = {
  status: HealthStatus;
  readyState: number;
  latencyMs: number | null;
  error?: string;
};

export type HealthReport = {
  status: HealthStatus;
  service: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: DatabaseHealth;
  };
};

async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = Date.now();

  try {
    const connection = await connectToDatabase();
    await connection.connection.db?.admin().ping();

    return {
      status: "ok",
      readyState: mongoose.connection.readyState,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "degraded",
      readyState: mongoose.connection.readyState,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const database = await getDatabaseHealth();

  return {
    status: database.status === "ok" ? "ok" : "degraded",
    service: getOptionalAppName(),
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      database,
    },
  };
}