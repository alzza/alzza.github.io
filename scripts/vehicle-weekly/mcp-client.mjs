import { unwrapToolResult } from "./parse.mjs";
import { withRetry, DEFAULT_TIMEOUT_MS, DEFAULT_MAX_ATTEMPTS, DEFAULT_BACKOFF_MS } from "./timeout.mjs";

function retryOptions(options) {
  return {
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxAttempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    backoffMs: options.backoffMs ?? DEFAULT_BACKOFF_MS,
    sleep: options.sleep,
  };
}

export function wrapMcpClient(options) {
  const retry = retryOptions(options);
  const connectFn = options.connectFn;
  const callFn = options.callFn;
  const closeFn = options.closeFn ?? (async () => {});

  return {
    async connect() {
      if (!connectFn) return;
      await withRetry((signal) => connectFn(signal), retry);
    },
    async callTool(name, args) {
      const raw = await withRetry((signal) => callFn(name, args, signal), retry);
      return unwrapToolResult(raw);
    },
    async close() {
      try {
        await closeFn();
      } catch {
        /* ignore close errors */
      }
    },
  };
}

export async function createTeslaMateMcpClient(options = {}) {
  if (options.connectFn || options.callFn) {
    if (!options.callFn) throw new Error("callFn is required when injecting an MCP client");
    return wrapMcpClient(options);
  }

  const url = options.url ?? process.env.TESLAMATE_MCP_URL;
  const token = options.token ?? process.env.TESLAMATE_MCP_TOKEN;
  if (!url) {
    const err = new Error("MCP_CONFIG");
    err.code = "MCP_CONFIG";
    throw err;
  }

  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  let client;
  let transport;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const closeFn = async () => {
    try {
      await client?.close();
    } catch {
      /* ignore */
    }
    client = undefined;
    transport = undefined;
  };

  const connectFn = async (signal) => {
    await closeFn();
    transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });
    client = new Client({ name: "alzza-vehicle-weekly", version: "1.0.0" });
    await client.connect(transport, { signal, timeout: timeoutMs });
  };

  const callFn = async (name, args, signal) => {
    if (!client) throw new Error("MCP client is not connected");
    const raw = await client.callTool({ name, arguments: args }, undefined, {
      signal,
      timeout: timeoutMs,
    });
    return raw;
  };

  return wrapMcpClient({ ...options, connectFn, callFn, closeFn });
}

export async function collectWeeklyTeslaMateData({
  client,
  carName,
  weekStart,
  weekEnd,
  queryStart,
  queryEnd,
}) {
  const calls = [
    ["driveSummary", "get_drive_summary_per_day", { car_name: carName, days: 10, limit: 10 }],
    ["drives", "search_drives", { car_name: carName, start_date: queryStart, end_date: queryEnd, limit: 50 }],
    ["chargingSessions", "search_charging_sessions", { car_name: carName, start_date: queryStart, end_date: queryEnd, limit: 50 }],
    ["batteryTrend", "get_battery_capacity_trend", { car_name: carName, days: 365 }],
  ];

  const settled = await Promise.allSettled(
    calls.map(([, name, args]) => client.callTool(name, args))
  );

  const collected = {
    driveSummary: [],
    drives: [],
    chargingSessions: [],
    batteryTrend: [],
    failures: [],
  };

  for (const [index, result] of settled.entries()) {
    const key = calls[index][0];
    if (result.status === "fulfilled") {
      collected[key] = result.value;
    } else {
      collected.failures.push({ key, err: result.reason });
    }
  }

  return collected;
}
