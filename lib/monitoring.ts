type MonitoringSeverity = "info" | "warning" | "error" | "critical";

type MonitoringEvent = {
  source: string;
  requestId?: string;
  severity: MonitoringSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
};

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

function getWebhookUrl() {
  return process.env.MONITORING_WEBHOOK_URL?.trim() || null;
}

export function createRequestId() {
  return crypto.randomUUID();
}

export async function reportMonitoringEvent(event: MonitoringEvent) {
  const payload = {
    timestamp: new Date().toISOString(),
    source: event.source,
    requestId: event.requestId || null,
    severity: event.severity,
    message: event.message,
    metadata: event.metadata || {},
    error: event.error ? normalizeError(event.error) : null,
  };

  console.error(JSON.stringify(payload));

  const webhookUrl = getWebhookUrl();

  if (!webhookUrl || (event.severity !== "error" && event.severity !== "critical")) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (webhookError) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "monitoring-webhook",
        severity: "warning",
        message: "Failed to deliver monitoring event",
        error: normalizeError(webhookError),
      }),
    );
  }
}