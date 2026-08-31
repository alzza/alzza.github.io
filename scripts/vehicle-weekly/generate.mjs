import { access, appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectWeeklyTeslaMateData, createTeslaMateMcpClient } from "./mcp-client.mjs";
import { renderWeeklyMarkdown, reportFilename } from "./markdown.mjs";
import { publicSafeReason, redactPublicText } from "./redact.mjs";
import { scoreWeeklyReport } from "./score.mjs";
import { previousCompletedWeek, seoulYmd, teslamateQueryDates } from "./week.mjs";
import { DEFAULT_TIMEOUT_MS } from "./timeout.mjs";

const DEFAULT_CAR_NAME = "[redacted]";

function log(message) {
  console.log(redactPublicText(message));
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function reportPath(outDir, weekEnd) {
  return path.join(outDir, reportFilename(weekEnd));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeGithubOutput(values) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n");
  await appendFile(file, `${lines}\n`);
}

export async function generateWeeklyReport(options = {}) {
  const now = options.now ?? new Date();
  const force = options.force ?? false;
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? path.join(cwd, "src/content/vehicle-reports");
  const week = options.week ?? previousCompletedWeek(now);
  const generatedOn = options.generatedOn ?? seoulYmd(now);
  const filename = reportFilename(week.weekEnd);
  const file = reportPath(outDir, week.weekEnd);
  const timeoutMs = options.timeoutMs ?? Number(env.MCP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const maxAttempts = options.maxAttempts ?? 3;
  const backoffMs = options.backoffMs ?? [1000, 2000, 4000];
  const sleep = options.sleep;

  log(`주간 리포트 대상: ${week.weekStart} ~ ${week.weekEnd}`);

  if (!force && await exists(file)) {
    log(`이미 해당 주 리포트가 있어 건너뜁니다: ${filename}`);
    await writeGithubOutput({ wrote: "false", filename, skipped: "true" });
    return { wrote: false, skipped: true, filename, file, week };
  }

  const query = teslamateQueryDates(week.weekStart, week.weekEnd);
  const carName = options.carName ?? env.TESLAMATE_CAR_NAME ?? DEFAULT_CAR_NAME;
  let client = options.client;
  let report;

  try {
    if (!client) {
      client = await createTeslaMateMcpClient({
        url: env.TESLAMATE_MCP_URL,
        token: env.TESLAMATE_MCP_TOKEN,
        timeoutMs,
        maxAttempts,
        backoffMs,
        sleep,
        connectFn: options.connectFn,
        callFn: options.callFn,
        closeFn: options.closeFn,
      });
    }
    await client.connect();
    const collected = await collectWeeklyTeslaMateData({
      client,
      carName,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      queryStart: query.start,
      queryEnd: query.end,
    });
    const allFailed = collected.failures.length === 4;
    report = scoreWeeklyReport({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      generatedOn,
      drives: collected.drives,
      chargingSessions: collected.chargingSessions,
      batteryTrend: collected.batteryTrend,
      toolsFailed: allFailed,
      error: allFailed ? collected.failures[0]?.err : null,
    });
  } catch (err) {
    log(`조회 실패, data_insufficient 리포트를 작성합니다: ${publicSafeReason(err)}`);
    report = scoreWeeklyReport({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      generatedOn,
      error: err,
    });
  } finally {
    await client?.close?.();
  }

  const markdown = renderWeeklyMarkdown(report);
  await mkdir(outDir, { recursive: true });
  await writeFile(file, markdown, "utf8");
  log(`작성 완료: ${filename} (${report.riskLevel})`);
  await writeGithubOutput({ wrote: "true", filename, skipped: "false", risk_level: report.riskLevel });
  return { wrote: true, skipped: false, filename, file, week, report, markdown };
}

function parseArgs(argv) {
  return {
    force: argv.includes("--force") || isTruthy(process.env.FORCE_OVERWRITE),
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  generateWeeklyReport({ force: args.force }).catch((err) => {
    console.error(redactPublicText(publicSafeReason(err)));
    process.exit(1);
  });
}
