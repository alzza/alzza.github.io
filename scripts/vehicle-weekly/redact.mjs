const PLATE = /02모\s*5384/g;
const BEARER = /Bearer\s+\S+/gi;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const COORD = /\b-?\d{1,3}\.\d{5,}\s*,\s*-?\d{1,3}\.\d{5,}\b/g;
const LATLNG = /\b(?:lat(?:itude)?|lon(?:gitude)?|lng)\s*[:=]\s*-?\d+(?:\.\d+)?/gi;

export function redactPublicText(text) {
  return String(text ?? "")
    .replace(PLATE, "차량")
    .replace(BEARER, "Bearer [redacted]")
    .replace(COORD, "[location]")
    .replace(LATLNG, "[location]")
    .replace(IPV4, "[ip]");
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
