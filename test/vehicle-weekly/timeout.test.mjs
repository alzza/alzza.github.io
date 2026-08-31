import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateWeeklyReport } from "../../scripts/vehicle-weekly/generate.mjs";
import { wrapMcpClient } from "../../scripts/vehicle-weekly/mcp-client.mjs";
import { renderWeeklyMarkdown } from "../../scripts/vehicle-weekly/markdown.mjs";
import { withRetry, waitForAbortOrDelay } from "../../scripts/vehicle-weekly/timeout.mjs";

test("delayed MCP call aborts via injectable short timeout and retries 3 times", async () => {
  let attempts = 0;
  const sleeps = [];
  await assert.rejects(
    () => withRetry(async (signal) => {
      attempts += 1;
      await waitForAbortOrDelay(400, signal);
      return "never";
    }, {
      timeoutMs: 25,
      maxAttempts: 3,
      backoffMs: [1, 1, 1],
      sleep: async (ms) => { sleeps.push(ms); },
    }),
    (err) => err.code === "MCP_TIMEOUT"
  );
  assert.equal(attempts, 3);
  assert.deepEqual(sleeps, [1, 1]);
});

test("delayed MCP fixture writes data_insufficient markdown without waiting 60s", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "vehicle-weekly-"));
  let connectAttempts = 0;
  const client = wrapMcpClient({
    timeoutMs: 30,
    maxAttempts: 3,
    backoffMs: [0, 0, 0],
    sleep: async () => {},
    connectFn: async (signal) => {
      connectAttempts += 1;
      await waitForAbortOrDelay(1000, signal);
    },
    callFn: async () => [],
  });

  const started = Date.now();
  const result = await generateWeeklyReport({
    client,
    now: new Date("2026-08-30T23:30:00Z"),
    outDir,
    force: true,
    timeoutMs: 30,
    maxAttempts: 3,
    backoffMs: [0, 0, 0],
    sleep: async () => {},
    env: { TESLAMATE_CAR_NAME: "test vehicle" },
  });
  const elapsed = Date.now() - started;

  assert.equal(result.wrote, true);
  assert.equal(result.report.riskLevel, "data_insufficient");
  assert.equal(result.report.distanceKm, null);
  assert.equal(result.report.chargingKwh, null);
  assert.ok(elapsed < 4000, `test waited too long: ${elapsed}ms`);
  assert.equal(connectAttempts, 3);

  const markdown = await readFile(result.file, "utf8");
  assert.equal(markdown, renderWeeklyMarkdown(result.report));
  assert.match(markdown, /risk_level: data_insufficient/);
  assert.match(markdown, /distance_km: null/);
  assert.match(markdown, /제한 시간/);
  assert.doesNotMatch(markdown, /Bearer /);
  assert.doesNotMatch(markdown, /0 km/);
});

test("existing week_end markdown is skipped unless force", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "vehicle-weekly-"));
  const client = {
    connect: async () => {},
    callTool: async () => [],
    close: async () => {},
  };
  const first = await generateWeeklyReport({
    client,
    now: new Date("2026-08-30T23:30:00Z"),
    outDir,
    force: true,
    env: { TESLAMATE_CAR_NAME: "test vehicle" },
  });
  assert.equal(first.wrote, true);
  const second = await generateWeeklyReport({
    client,
    now: new Date("2026-08-30T23:30:00Z"),
    outDir,
    force: false,
    env: { TESLAMATE_CAR_NAME: "test vehicle" },
  });
  assert.equal(second.skipped, true);
  assert.equal(second.wrote, false);
});
