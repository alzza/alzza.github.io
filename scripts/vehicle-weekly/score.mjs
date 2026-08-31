import { filterRowsForSeoulWeek } from "./week.mjs";
import { firstNumber, round, unwrapToolResult } from "./parse.mjs";
import { publicSafeReason } from "./redact.mjs";

const DISTANCE_KEYS = ["distance_km", "distance", "distanceKm"];
const DURATION_MIN_KEYS = ["duration_min", "duration_minutes", "durationMin"];
const DURATION_SEC_KEYS = ["duration_s", "duration_seconds", "durationSec"];
const SPEED_KEYS = ["speed_max", "max_speed", "max_speed_kph", "maxSpeed", "speedMax"];
const ENERGY_KEYS = ["energy_added_kwh", "charge_energy_added", "energy_kwh", "energy", "energyAddedKwh"];
const CAPACITY_KEYS = ["avg_est_capacity_kwh", "estimated_capacity_kwh", "usable_capacity_kwh", "capacity_kwh", "capacity"];

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function durationMinutes(row) {
  const minutes = firstNumber(row, DURATION_MIN_KEYS);
  if (minutes !== null) return minutes;
  const seconds = firstNumber(row, DURATION_SEC_KEYS);
  if (seconds !== null) return seconds / 60;
  const duration = firstNumber(row, ["duration"]);
  if (duration === null) return null;
  return duration > 1000 ? duration / 60 : duration;
}

function hasEndDate(row) {
  return Boolean(row?.end_date || row?.end_date_time || row?.endDate || row?.end_time || row?.ended_at);
}

function capacitySeries(rows) {
  return rows
    .map((row) => ({
      month: row.month ?? row.date ?? row.period ?? null,
      capacityKwh: firstNumber(row, CAPACITY_KEYS),
    }))
    .filter((row) => row.month && row.capacityKwh !== null)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)));
}

export function insufficientReport({ weekStart, weekEnd, generatedOn, reason, err }) {
  return {
    weekStart,
    weekEnd,
    generatedOn,
    riskLevel: "data_insufficient",
    distanceKm: null,
    chargingKwh: null,
    capacityKwh: null,
    degradationPercent: null,
    driving: {
      distanceKm: null,
      tripCount: null,
      durationMinutes: null,
      longDriveCount: null,
      highSpeed: false,
    },
    charging: {
      energyKwh: null,
      completedCount: null,
      incompleteCount: null,
    },
    battery: {
      latestKwh: null,
      baselineKwh: null,
      degradationPercent: null,
      last3Avg: null,
      prev3Avg: null,
      last3ChangePercent: null,
      last3AllBelow55: false,
      monthCount: 0,
    },
    reasons: [],
    warnings: [],
    insufficientReason: reason ?? publicSafeReason(err),
  };
}

export function scoreWeeklyReport({
  weekStart,
  weekEnd,
  generatedOn,
  drives = [],
  chargingSessions = [],
  batteryTrend = [],
  error = null,
  toolsFailed = false,
}) {
  if (error || toolsFailed) {
    return insufficientReport({ weekStart, weekEnd, generatedOn, err: error });
  }

  const driveRows = filterRowsForSeoulWeek(unwrapToolResult(drives), weekStart, weekEnd);
  const chargeRows = filterRowsForSeoulWeek(unwrapToolResult(chargingSessions), weekStart, weekEnd);
  const trend = capacitySeries(unwrapToolResult(batteryTrend));

  const tripCount = driveRows.length;
  const distanceKm = driveRows.reduce((sum, row) => sum + (firstNumber(row, DISTANCE_KEYS) ?? 0), 0);
  const durationMin = driveRows.reduce((sum, row) => sum + (durationMinutes(row) ?? 0), 0);
  const longDriveCount = driveRows.filter((row) => (firstNumber(row, DISTANCE_KEYS) ?? 0) >= 100).length;
  const highSpeed = driveRows.some((row) => (firstNumber(row, SPEED_KEYS) ?? 0) >= 150);

  const completed = chargeRows.filter(hasEndDate);
  const incompleteCount = chargeRows.length - completed.length;
  const energyKwh = completed.reduce((sum, row) => sum + (firstNumber(row, ENERGY_KEYS) ?? 0), 0);

  const baseline = trend.at(0)?.capacityKwh ?? null;
  const latest = trend.at(-1)?.capacityKwh ?? null;
  const degradationPercent = baseline && latest !== null ? ((latest - baseline) / baseline) * 100 : null;
  const last3 = trend.slice(-3).map((row) => row.capacityKwh);
  const prev3 = trend.slice(-6, -3).map((row) => row.capacityKwh);
  const last3Avg = average(last3);
  const prev3Avg = average(prev3);
  const last3ChangePercent = last3Avg !== null && prev3Avg !== null && prev3Avg !== 0
    ? ((last3Avg - prev3Avg) / prev3Avg) * 100
    : null;
  const last3AllBelow55 = last3.length === 3 && last3.every((value) => value < 55);

  const reasons = [];
  if (longDriveCount > 0) reasons.push(`100 km 이상 단일 운행 ${longDriveCount}회`);
  if (highSpeed) reasons.push("최대속도 150 km/h 이상 운행");
  if (incompleteCount > 0) reasons.push(`불완전 충전 세션 ${incompleteCount}건`);
  if (last3ChangePercent !== null && last3ChangePercent < 0) {
    reasons.push("최근 추정 가용용량 하락 신호");
  }

  let riskLevel = "normal";
  if ((degradationPercent !== null && degradationPercent <= -10) || last3AllBelow55) {
    riskLevel = "inspection_recommended";
  } else if (
    last3ChangePercent !== null
    && last3ChangePercent <= -2
    && last3.length === 3
    && prev3.length === 3
  ) {
    riskLevel = "caution";
  } else if (reasons.length > 0) {
    riskLevel = "observe";
  }

  return {
    weekStart,
    weekEnd,
    generatedOn,
    riskLevel,
    distanceKm: round(distanceKm),
    chargingKwh: round(energyKwh),
    capacityKwh: round(latest),
    degradationPercent: round(degradationPercent),
    driving: {
      distanceKm: round(distanceKm),
      tripCount,
      durationMinutes: round(durationMin, 0),
      longDriveCount,
      highSpeed,
    },
    charging: {
      energyKwh: round(energyKwh),
      completedCount: completed.length,
      incompleteCount,
    },
    battery: {
      latestKwh: round(latest),
      baselineKwh: round(baseline),
      degradationPercent: round(degradationPercent),
      last3Avg: round(last3Avg),
      prev3Avg: round(prev3Avg),
      last3ChangePercent: round(last3ChangePercent),
      last3AllBelow55,
      monthCount: trend.length,
    },
    reasons,
    warnings: driveRows.length >= 50 ? ["운행 기록이 조회 한도에 닿아 일부만 집계했을 수 있습니다."] : [],
    insufficientReason: null,
  };
}
