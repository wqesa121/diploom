import { spawnSync } from "node:child_process";

type Check = {
  label: string;
  command: string;
  args: string[];
};

function runCheck(check: Check) {
  console.log(`\n[release-check] ${check.label}`);

  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `${check.command} ${check.args.join(" ")}`], {
          stdio: "inherit",
          env: process.env,
        })
      : spawnSync(check.command, check.args, {
          stdio: "inherit",
          env: process.env,
        });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${check.label} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

async function runHealthCheck() {
  const healthUrl = process.env.HEALTHCHECK_URL?.trim();

  if (!healthUrl) {
    console.log("\n[release-check] HEALTHCHECK_URL not set, skipping live health probe.");
    return;
  }

  console.log(`\n[release-check] Probing ${healthUrl}`);
  const response = await fetch(healthUrl, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Health probe failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { status?: string; checks?: { database?: { status?: string } } };

  if (payload.status !== "ok" || payload.checks?.database?.status !== "ok") {
    throw new Error("Health endpoint returned a non-ok status.");
  }

  console.log("[release-check] Health probe passed.");
}

async function main() {
  const checks: Check[] = [
    { label: "Smoke tests", command: "npm", args: ["run", "test:smoke"] },
    { label: "Production build", command: "npm", args: ["run", "build"] },
  ];

  for (const check of checks) {
    runCheck(check);
  }

  await runHealthCheck();
  console.log("\n[release-check] All checks passed.");
}

main().catch((error) => {
  console.error("\n[release-check]", error instanceof Error ? error.message : error);
  process.exit(1);
});