const ARRAY_KEYS = [
  "result",
  "data",
  "results",
  "items",
  "rows",
  "drives",
  "charging_sessions",
  "sessions",
  "trend",
];

export function unwrapToolResult(raw, depth = 0) {
  if (raw == null || depth > 6) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      return unwrapToolResult(JSON.parse(trimmed), depth + 1);
    } catch {
      return [];
    }
  }
  if (typeof raw !== "object") return [];
  if (raw.isError) {
    const err = new Error("MCP_TOOL_ERROR");
    err.code = "MCP_TOOL_ERROR";
    throw err;
  }
  if (Array.isArray(raw.content)) {
    const text = raw.content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n");
    if (text.trim()) {
      try {
        return unwrapToolResult(JSON.parse(text), depth + 1);
      } catch {
        /* fall through to structuredContent */
      }
    }
    if (raw.structuredContent) return unwrapToolResult(raw.structuredContent, depth + 1);
  }
  if (raw.structuredContent) return unwrapToolResult(raw.structuredContent, depth + 1);
  for (const key of ARRAY_KEYS) {
    if (Array.isArray(raw[key])) return raw[key];
    if (typeof raw[key] === "string") {
      try {
        const parsed = JSON.parse(raw[key]);
        if (Array.isArray(parsed)) return parsed;
        const inner = unwrapToolResult(parsed, depth + 1);
        if (inner.length) return inner;
      } catch {
        /* ignore */
      }
    }
  }
  return [];
}

export function asNumber(value) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstNumber(record, keys) {
  for (const key of keys) {
    const value = asNumber(record?.[key]);
    if (value !== null) return value;
  }
  return null;
}

export function round(value, digits = 1) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
