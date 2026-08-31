const SEOUL = "Asia/Seoul";

export function addDays(ymd, days) {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function seoulYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function seoulWeekday(date = new Date()) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: SEOUL,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

/** Most recently completed Mon–Sun in Asia/Seoul. */
export function previousCompletedWeek(now = new Date()) {
  const today = seoulYmd(now);
  const daysSinceMonday = (seoulWeekday(now) + 6) % 7;
  const thisMonday = addDays(today, -daysSinceMonday);
  return {
    weekStart: addDays(thisMonday, -7),
    weekEnd: addDays(thisMonday, -1),
  };
}

/**
 * Widen the TeslaMate date filter so naive-UTC search_* rows
 * that fall on Sunday evening KST (or Monday 00:00 KST) are not dropped.
 */
export function teslamateQueryDates(weekStart, weekEnd) {
  return {
    start: addDays(weekStart, -1),
    end: addDays(weekEnd, 1),
  };
}

export function parseNaiveUtc(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00.000Z`);
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const asUtc = new Date(`${normalized}Z`);
  return Number.isNaN(asUtc.getTime()) ? null : asUtc;
}

export function seoulYmdFromNaiveUtc(value) {
  const parsed = parseNaiveUtc(value);
  return parsed ? seoulYmd(parsed) : null;
}

export function inSeoulWeek(value, weekStart, weekEnd) {
  const ymd = seoulYmdFromNaiveUtc(value);
  if (!ymd) return true;
  return ymd >= weekStart && ymd <= weekEnd;
}

export function rowTimestamp(row) {
  return row?.start_date ?? row?.start_date_time ?? row?.started_at ?? row?.start_time
    ?? row?.date ?? row?.end_date ?? row?.end_date_time ?? row?.ended_at ?? null;
}

export function filterRowsForSeoulWeek(rows, weekStart, weekEnd) {
  return rows.filter((row) => inSeoulWeek(rowTimestamp(row), weekStart, weekEnd));
}
