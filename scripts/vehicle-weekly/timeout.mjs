export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_BACKOFF_MS = [1000, 2000, 4000];

export function timeoutError(cause) {
  const err = new Error("MCP_TIMEOUT");
  err.name = "TimeoutError";
  err.code = "MCP_TIMEOUT";
  if (cause) err.cause = cause;
  return err;
}

export function abortError(message = "Aborted") {
  const err = new Error(message);
  err.name = "AbortError";
  err.code = "ABORT_ERR";
  return err;
}

export function isTimeoutOrAbort(err) {
  return Boolean(
    err
    && (err.code === "MCP_TIMEOUT"
      || err.code === "ABORT_ERR"
      || err.name === "TimeoutError"
      || err.name === "AbortError"
      || err.name === "TimeoutAbortError")
  );
}

export function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `task(signal)` with a dedicated AbortController.
 * If `timeoutMs` elapses, abort that controller and reject with MCP_TIMEOUT.
 */
export async function withTimeout(task, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const timedOut = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError());
    }, timeoutMs);
  });
  const work = Promise.resolve().then(() => task(controller.signal));
  work.catch(() => {});
  try {
    return await Promise.race([work, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

export async function withRetry(task, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const sleep = options.sleep ?? defaultSleep;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await withTimeout(task, timeoutMs);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const wait = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 0;
        if (wait > 0) await sleep(wait);
      }
    }
  }
  throw lastError;
}

export function waitForAbortOrDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
