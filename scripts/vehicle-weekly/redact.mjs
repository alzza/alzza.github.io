function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namesToRedact(explicitName) {
  const names = [];
  for (const raw of [explicitName, process.env.TESLAMATE_CAR_NAME]) {
    const name = String(raw ?? "").trim();
    if (!name) continue;
    names.push(name);
    names.push(name.replace(/\s+/g, ""));
  }
  return [...new Set(names)];
}

export function redactPublicText(text, carName) {
  let out = String(text ?? "");
  for (const name of namesToRedact(carName)) {
    const flexible = escapeRegExp(name).replace(/\s+/g, "\\s*");
    out = out.replace(new RegExp(flexible, "g"), "차량");
  }
  return out
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b-?\d{1,3}\.\d{5,}\s*,\s*-?\d{1,3}\.\d{5,}\b/g, "[location]")
    .replace(/\b(?:lat(?:itude)?|lon(?:gitude)?|lng)\s*[:=]\s*-?\d+(?:\.\d+)?/gi, "[location]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[ip]");
}

export function publicSafeReason(err) {
  if (!err) return "TeslaMate 데이터를 가져오지 못했습니다.";
  if (err.code === "MCP_CONFIG") {
    return "TeslaMate 조회 설정이 없어 데이터를 가져오지 못했습니다.";
  }
  if (err.code === "MCP_TIMEOUT" || err.name === "TimeoutError" || err.name === "AbortError" || err.code === "ABORT_ERR") {
    return "TeslaMate 조회가 제한 시간을 초과했습니다.";
  }
  return "TeslaMate 데이터를 가져오지 못했습니다.";
}
