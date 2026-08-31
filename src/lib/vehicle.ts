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
  accelerationWeek: { thresholdKw: number | null; secondaryThresholdKw: number | null; eventCount: number | null; secondaryEventCount: number | null; maxDischargePowerKw: number | null; avgPeakPowerSpeedKmh: number | null; maxPeakPowerSpeedKmh: number | null; coveredDistanceKm: number | null; eventsPer1000Km: number | null; dataQuality: "available" | "insufficient" | "sign_unverified" };
  accelerationTrend: { month: string; events180Kw: number | null; events200Kw: number | null; avgPeakPowerSpeedKmh: number | null; maxPeakPowerSpeedKmh: number | null; coveredDistanceKm: number | null; eventsPer1000Km: number | null }[];
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
    accelerationWeek: {
      thresholdKw: report.data.acceleration_week.threshold_kw,
      secondaryThresholdKw: report.data.acceleration_week.secondary_threshold_kw,
      eventCount: report.data.acceleration_week.event_count,
      secondaryEventCount: report.data.acceleration_week.secondary_event_count,
      maxDischargePowerKw: report.data.acceleration_week.max_discharge_power_kw,
      avgPeakPowerSpeedKmh: report.data.acceleration_week.avg_peak_power_speed_kmh,
      maxPeakPowerSpeedKmh: report.data.acceleration_week.max_peak_power_speed_kmh,
      coveredDistanceKm: report.data.acceleration_week.covered_distance_km,
      eventsPer1000Km: report.data.acceleration_week.events_per_1000km,
      dataQuality: report.data.acceleration_week.data_quality,
    },
    accelerationTrend: report.data.acceleration_trend.map((item) => ({ month: item.month, events180Kw: item.events_180kw, events200Kw: item.events_200kw, avgPeakPowerSpeedKmh: item.avg_peak_power_speed_kmh, maxPeakPowerSpeedKmh: item.max_peak_power_speed_kmh, coveredDistanceKm: item.covered_distance_km, eventsPer1000Km: item.events_per_1000km })),
    tags: report.data.tags,
  })).sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}
