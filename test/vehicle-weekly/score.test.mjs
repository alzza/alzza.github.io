import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scoreWeeklyReport } from "../../scripts/vehicle-weekly/score.mjs";
import { renderWeeklyMarkdown } from "../../scripts/vehicle-weekly/markdown.mjs";
import { unwrapToolResult } from "../../scripts/vehicle-weekly/parse.mjs";
import { filterRowsForSeoulWeek, previousCompletedWeek } from "../../scripts/vehicle-weekly/week.mjs";

const fixture = async (name) => JSON.parse(
  await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8")
);

test("normal fixture scores normal and keeps Sunday evening KST drive", async () => {
  const data = await fixture("normal");
  const report = scoreWeeklyReport({
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    generatedOn: "2026-08-31",
    drives: data.search_drives,
    chargingSessions: data.search_charging_sessions,
    batteryTrend: data.get_battery_capacity_trend,
  });
  assert.equal(report.riskLevel, "normal");
  assert.equal(report.driving.tripCount, 3);
  assert.equal(report.driving.distanceKm, 49.7);
  assert.equal(report.driving.durationMinutes, 92);
  assert.equal(report.charging.completedCount, 2);
  assert.equal(report.charging.incompleteCount, 0);
  assert.equal(report.charging.energyKwh, 37.6);
  assert.equal(report.capacityKwh, 60.2);
  const markdown = renderWeeklyMarkdown(report);
  assert.match(markdown, /week_start: "2026-08-24"/);
  assert.match(markdown, /week_end: "2026-08-30"/);
  assert.match(markdown, /date: "2026-08-31"/);
  assert.doesNotMatch(markdown, /02모/);
  assert.doesNotMatch(markdown, /5384/);
});

test("caution fixture requires 3+3 monthly points and >=2% recent drop", async () => {
  const data = await fixture("caution");
  const report = scoreWeeklyReport({
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    generatedOn: "2026-08-31",
    drives: { result: data.search_drives },
    chargingSessions: data.search_charging_sessions,
    batteryTrend: JSON.stringify({ result: data.get_battery_capacity_trend }),
  });
  const drives = unwrapToolResult({ result: data.search_drives });
  const trend = unwrapToolResult(JSON.stringify({ result: data.get_battery_capacity_trend }));
  assert.equal(drives.length, 1);
  assert.equal(trend.length, 7);
  const scored = scoreWeeklyReport({
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    generatedOn: "2026-08-31",
    drives,
    chargingSessions: data.search_charging_sessions,
    batteryTrend: trend,
  });
  assert.equal(scored.riskLevel, "caution");
  assert.ok(scored.battery.last3ChangePercent <= -2);
  assert.equal(scored.driving.longDriveCount, 0);
});

test("data_insufficient does not invent 0 km / 0 kWh", () => {
  const err = new Error("MCP_TIMEOUT");
  err.code = "MCP_TIMEOUT";
  const report = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    error: err,
  });
  assert.equal(report.riskLevel, "data_insufficient");
  assert.equal(report.distanceKm, null);
  assert.equal(report.chargingKwh, null);
  assert.equal(report.capacityKwh, null);
  const markdown = renderWeeklyMarkdown(report);
  assert.match(markdown, /risk_level: data_insufficient/);
  assert.match(markdown, /distance_km: null/);
  assert.match(markdown, /charging_kwh: null/);
  assert.match(markdown, /제한 시간/);
  assert.doesNotMatch(markdown, /총 주행거리는 0/);
});

test("empty successful queries stay normal with real zeros, not data_insufficient", () => {
  const report = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    drives: [],
    chargingSessions: [],
    batteryTrend: [{ month: "2026-08", avg_est_capacity_kwh: 60.1 }],
  });
  assert.equal(report.riskLevel, "normal");
  assert.equal(report.distanceKm, 0);
  assert.equal(report.chargingKwh, 0);
});

test("Sunday evening KST naive-UTC drive is kept; next Monday KST is dropped", () => {
  const rows = filterRowsForSeoulWeek([
    { start_date: "2026-08-30T14:30:00", distance_km: 12 },
    { start_date: "2026-08-30T15:30:00", distance_km: 99 },
    { start_date: "2026-08-23T15:00:00", distance_km: 8 },
  ], "2026-08-24", "2026-08-30");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.distance_km), [12, 8]);
});

test("previous completed week from KST Monday morning is last Mon-Sun", () => {
  const week = previousCompletedWeek(new Date("2026-08-30T23:30:00Z"));
  assert.deepEqual(week, { weekStart: "2026-08-24", weekEnd: "2026-08-30" });
});

test("inspection_recommended when latest 3 months are all below 55 kWh", () => {
  const report = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    drives: [],
    chargingSessions: [],
    batteryTrend: [
      { month: "2026-03", avg_est_capacity_kwh: 58 },
      { month: "2026-06", avg_est_capacity_kwh: 54.2 },
      { month: "2026-07", avg_est_capacity_kwh: 53.8 },
      { month: "2026-08", avg_est_capacity_kwh: 53.1 },
    ],
  });
  assert.equal(report.riskLevel, "inspection_recommended");
});

test("observe for a 100 km drive or speed_max >= 150", () => {
  const long = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    drives: [{ start_date: "2026-08-29T01:00:00", distance_km: 120, duration_min: 90, speed_max: 110 }],
    chargingSessions: [{ end_date: "2026-08-29T04:00:00", energy_added_kwh: 10 }],
    batteryTrend: [{ month: "2026-08", avg_est_capacity_kwh: 60 }],
  });
  assert.equal(long.riskLevel, "observe");
  const fast = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    drives: [{ start_date: "2026-08-29T01:00:00", distance_km: 20, duration_min: 20, speed_max: 151 }],
    chargingSessions: [],
    batteryTrend: [{ month: "2026-08", avg_est_capacity_kwh: 60 }],
  });
  assert.equal(fast.riskLevel, "observe");
});

test("completed charges require end_date; JSON text MCP payloads unwrap", () => {
  const rows = unwrapToolResult({
    content: [{ type: "text", text: JSON.stringify({ result: [
      { start_date: "2026-08-24T01:00:00", end_date: "2026-08-24T02:00:00", energy_added_kwh: 11 },
      { start_date: "2026-08-24T08:00:00", energy_added_kwh: 7 },
    ] }) }],
  });
  const report = scoreWeeklyReport({
    weekStart: "2026-08-24",
    weekEnd: "2026-08-30",
    generatedOn: "2026-08-31",
    drives: [],
    chargingSessions: rows,
    batteryTrend: [],
  });
  assert.equal(report.charging.completedCount, 1);
  assert.equal(report.charging.incompleteCount, 1);
  assert.equal(report.charging.energyKwh, 11);
  assert.equal(report.riskLevel, "observe");
});
