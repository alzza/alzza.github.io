import { getCollection } from "astro:content";

export type VehicleReportItem = {
  href: string;
  title: string;
  date: string;
  excerpt: string;
  weekStart: string;
  weekEnd: string;
  riskLevel: "normal" | "observe" | "caution" | "inspection_recommended" | "data_insufficient";
  distanceKm: number | null;
  chargingKwh: number | null;
  capacityKwh: number | null;
  degradationPercent: number | null;
  dailyMetrics: { date: string; distanceKm: number | null; chargingKwh: number | null }[];
  capacityTrend: { month: string; capacityKwh: number | null }[];
  tags: string[];
};

export const riskLabel = (level: VehicleReportItem["riskLevel"]) => ({
  normal: "정상",
  observe: "관찰",
  caution: "주의",
  inspection_recommended: "점검 권장",
  data_insufficient: "데이터 부족",
}[level]);

export async function listVehicleReports(): Promise<VehicleReportItem[]> {
  const reports = await getCollection("vehicleReports");
  return reports.map((report) => ({
    href: `/vehicle/${report.id}/`,
    title: report.data.title,
    date: report.data.date,
    excerpt: report.data.excerpt,
    weekStart: report.data.week_start,
    weekEnd: report.data.week_end,
    riskLevel: report.data.risk_level,
    distanceKm: report.data.distance_km,
    chargingKwh: report.data.charging_kwh,
    capacityKwh: report.data.capacity_kwh,
    degradationPercent: report.data.degradation_percent,
    dailyMetrics: report.data.daily_metrics.map((item) => ({ date: item.date, distanceKm: item.distance_km, chargingKwh: item.charging_kwh })),
    capacityTrend: report.data.capacity_trend.map((item) => ({ month: item.month, capacityKwh: item.capacity_kwh })),
    tags: report.data.tags,
  })).sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}
