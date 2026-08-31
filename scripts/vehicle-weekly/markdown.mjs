import { redactPublicText } from "./redact.mjs";

const RISK_LABEL = {
  normal: "정상",
  observe: "관찰",
  caution: "주의",
  inspection_recommended: "점검 권장",
  data_insufficient: "데이터 부족",
};

function yamlScalar(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return JSON.stringify(String(value));
}

function numberOrUnknown(value, suffix = "") {
  if (value === null || value === undefined) return "확인하지 못함";
  return `${value}${suffix}`;
}

function drivingSection(report) {
  const d = report.driving;
  if (d.tripCount === null) {
    return ["## 주행", "", "주행 데이터를 이번 주에 확정하지 못했습니다. 거리를 0 km로 가정하지 않았습니다.", ""];
  }
  const long = d.longDriveCount > 0
    ? `100 km 이상 단일 운행이 ${d.longDriveCount}회 있었습니다.`
    : "100 km 이상 단일 운행은 없었습니다.";
  return [
    "## 주행",
    "",
    `총 주행거리는 ${numberOrUnknown(d.distanceKm, " km")}, 운행 ${d.tripCount}회, 총 운행 시간 ${numberOrUnknown(d.durationMinutes, "분")}입니다. ${long}`,
    "",
  ];
}

function chargingSection(report) {
  const c = report.charging;
  if (c.completedCount === null) {
    return ["## 충전", "", "충전 데이터를 이번 주에 확정하지 못했습니다. 충전량을 0 kWh로 가정하지 않았습니다.", ""];
  }
  return [
    "## 충전",
    "",
    `종료된 세션의 충전량 합계는 ${numberOrUnknown(c.energyKwh, " kWh")}입니다. 완료 ${c.completedCount}회, 불완전 ${c.incompleteCount}회입니다.`,
    "",
  ];
}

function batterySection(report) {
  const b = report.battery;
  if (b.monthCount === 0 || b.latestKwh === null) {
    return [
      "## 배터리 추세",
      "",
      "월별 추정 가용용량을 이번 주에 확인하지 못했습니다. 이 값은 충전 세션 기반 추정치이며 진단이 아닙니다.",
      "",
    ];
  }
  const compare = b.last3Avg !== null && b.prev3Avg !== null
    ? `최근 3개월 평균 ${b.last3Avg} kWh, 이전 3개월 평균 ${b.prev3Avg} kWh입니다.`
    : "최근·이전 3개월을 나란히 비교할 월별 표본이 부족합니다.";
  return [
    "## 배터리 추세",
    "",
    `최신 월 추정 가용용량은 ${b.latestKwh} kWh이고, 최초 기록 대비 ${numberOrUnknown(b.degradationPercent, "%")}입니다. ${compare}`,
    "이 수치는 충전 세션 기반 추정치와 추세이며, 배터리 상태를 진단한 결과가 아닙니다.",
    "",
  ];
}

function judgementSection(report) {
  const label = RISK_LABEL[report.riskLevel] ?? report.riskLevel;
  if (report.riskLevel === "data_insufficient") {
    return [
      "## 판정",
      "",
      `데이터 부족. ${report.insufficientReason}`,
      "공개 수치를 0으로 채우지 않았습니다.",
      "",
    ];
  }
  const extra = report.reasons.length ? ` 사유: ${report.reasons.join(", ")}.` : " 특이 신호는 없습니다.";
  const speed = report.driving.highSpeed ? " 최대속도 150 km/h 이상 운행이 있어 관찰 사유에 포함했습니다." : "";
  return ["## 판정", "", `${label}.${extra}${speed}`, ""];
}

export function renderWeeklyMarkdown(report) {
  const excerpt = report.riskLevel === "data_insufficient"
    ? "이번 주 주행·충전·배터리 데이터를 충분히 확인하지 못했습니다"
    : "지난주 주행·충전·배터리 추세 요약";
  const body = report.riskLevel === "data_insufficient"
    ? [
        "## 데이터 부족",
        "",
        report.insufficientReason,
        "주행·충전 숫자를 0으로 가정하지 않았습니다. 다음 주 자동 수집에서 다시 확인합니다.",
        "",
      ]
    : [
        ...drivingSection(report),
        ...chargingSection(report),
        ...batterySection(report),
        ...judgementSection(report),
        ...(report.warnings.length ? ["## 참고", "", ...report.warnings.map((line) => `- ${line}`), ""] : []),
      ];

  const markdown = [
    "---",
    `title: ${yamlScalar(`차량 건강 주간 리포트 · ${report.weekEnd}`)}`,
    `date: ${yamlScalar(report.generatedOn)}`,
    `excerpt: ${yamlScalar(excerpt)}`,
    `week_start: ${yamlScalar(report.weekStart)}`,
    `week_end: ${yamlScalar(report.weekEnd)}`,
    `risk_level: ${report.riskLevel}`,
    `distance_km: ${yamlScalar(report.distanceKm)}`,
    `charging_kwh: ${yamlScalar(report.chargingKwh)}`,
    `capacity_kwh: ${yamlScalar(report.capacityKwh)}`,
    `degradation_percent: ${yamlScalar(report.degradationPercent)}`,
    "tags: [TeslaMate, 차량관리, 주간리포트]",
    "---",
    "",
    ...body,
  ].join("\n");

  return redactPublicText(markdown).endsWith("\n")
    ? redactPublicText(markdown)
    : `${redactPublicText(markdown)}\n`;
}

export function reportFilename(weekEnd) {
  return `${weekEnd}-vehicle-health.md`;
}
