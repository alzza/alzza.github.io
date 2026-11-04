import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    kicker: z.string().optional(),
    tags: z.array(z.string()).default([]),
    redirect: z.string().optional(),
  }),
});

const vehicleReports = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/vehicle-reports" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    week_start: z.string(),
    week_end: z.string(),
    risk_level: z.enum(["normal", "observe", "caution", "inspection_recommended", "data_insufficient"]),
    distance_km: z.number().nullable().default(null),
    charging_kwh: z.number().nullable().default(null),
    capacity_kwh: z.number().nullable().default(null),
    degradation_percent: z.number().nullable().default(null),
    daily_metrics: z.array(z.object({
      date: z.string(),
      distance_km: z.number().nullable().default(null),
      charging_kwh: z.number().nullable().default(null),
    })).default([]),
    capacity_trend: z.array(z.object({
      month: z.string(),
      capacity_kwh: z.number().nullable().default(null),
    })).default([]),
    acceleration_week: z.object({
      threshold_kw: z.number().nullable().default(null),
      secondary_threshold_kw: z.number().nullable().default(null),
      event_count: z.number().nullable().default(null),
      secondary_event_count: z.number().nullable().default(null),
      max_discharge_power_kw: z.number().nullable().default(null),
      avg_peak_power_speed_kmh: z.number().nullable().default(null),
      max_peak_power_speed_kmh: z.number().nullable().default(null),
      covered_distance_km: z.number().nullable().default(null),
      events_per_1000km: z.number().nullable().default(null),
      data_quality: z.enum(["available", "insufficient", "sign_unverified"]).default("insufficient"),
    }).default({ data_quality: "insufficient" }),
    acceleration_trend: z.array(z.object({
      month: z.string(),
      events_180kw: z.number().nullable().default(null),
      events_200kw: z.number().nullable().default(null),
      avg_peak_power_speed_kmh: z.number().nullable().default(null),
      max_peak_power_speed_kmh: z.number().nullable().default(null),
      covered_distance_km: z.number().nullable().default(null),
      events_per_1000km: z.number().nullable().default(null),
    })).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const vehicleData = defineCollection({
  loader: glob({ pattern: "**/[^_]*.json", base: "./src/content/vehicle-data" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    week_start: z.string(),
    week_end: z.string(),
    risk_level: z.enum(["normal", "observe", "caution", "inspection_recommended", "data_insufficient"]),
    distance_km: z.number().nullable().default(null),
    charging_kwh: z.number().nullable().default(null),
    capacity_kwh: z.number().nullable().default(null),
    degradation_percent: z.number().nullable().default(null),
    monthly_summary: z.array(z.object({
      month: z.string(),
      max_discharge_power_kw: z.number().nullable().default(null),
      max_peak_power_speed_kmh: z.number().nullable().default(null),
      capacity_kwh: z.number().nullable().default(null),
      data_quality: z.enum(["available", "insufficient", "sign_unverified"]).default("available"),
    })).max(12).default([]),
    weekly_power_events: z.array(z.object({
      event_no: z.number(),
      threshold_kw: z.number(),
      max_discharge_power_kw: z.number().nullable().default(null),
      speed_at_peak_power_kmh: z.number().nullable().default(null),
      battery_level_at_peak_pct: z.number().nullable().default(null),
      data_quality: z.enum(["available", "insufficient", "sign_unverified"]).default("available"),
    })).default([]),
    daily_metrics: z.array(z.object({ date: z.string(), distance_km: z.number().nullable().default(null), charging_kwh: z.number().nullable().default(null) })).default([]),
    capacity_trend: z.array(z.object({ month: z.string(), capacity_kwh: z.number().nullable().default(null) })).default([]),
    acceleration_week: z.object({
      threshold_kw: z.number().nullable().default(null), secondary_threshold_kw: z.number().nullable().default(null),
      event_count: z.number().nullable().default(null), secondary_event_count: z.number().nullable().default(null),
      max_discharge_power_kw: z.number().nullable().default(null), avg_peak_power_speed_kmh: z.number().nullable().default(null),
      max_peak_power_speed_kmh: z.number().nullable().default(null), covered_distance_km: z.number().nullable().default(null),
      events_per_1000km: z.number().nullable().default(null), data_quality: z.enum(["available", "insufficient", "sign_unverified"]).default("insufficient"),
    }).default({ data_quality: "insufficient" }),
    acceleration_trend: z.array(z.object({ month: z.string(), events_180kw: z.number().nullable().default(null), events_200kw: z.number().nullable().default(null), avg_peak_power_speed_kmh: z.number().nullable().default(null), max_peak_power_speed_kmh: z.number().nullable().default(null), covered_distance_km: z.number().nullable().default(null), events_per_1000km: z.number().nullable().default(null) })).default([]),
    report_version: z.string().optional(),
    drive_summary: z.object({ distance_km: z.number().nullable().default(null), drive_count: z.number().nullable().default(null), drive_time_min: z.number().nullable().default(null), avg_speed_kmh: z.number().nullable().default(null), max_speed_kmh: z.number().nullable().default(null), longest_drive_km: z.number().nullable().default(null), longest_drive_date: z.string().nullable().default(null) }).optional(),
    lifetime_totals: z.object({ as_of: z.string().nullable().default(null), odometer_km: z.number().nullable().default(null), drive_count: z.number().nullable().default(null), charge_count: z.number().nullable().default(null), charged_kwh: z.number().nullable().default(null) }).optional(),
    charging_cost: z.object({
      week: z.object({ home_kwh: z.number().nullable().default(null), home_cost_krw: z.number().nullable().default(null), work_kwh: z.number().nullable().default(null), work_cost_krw: z.number().nullable().default(null), work_discount_krw: z.number().nullable().default(null), other_kwh: z.number().nullable().optional(), other_cost_krw: z.number().nullable().optional(), fast_kwh: z.number().nullable().optional(), fast_cost_krw: z.number().nullable().optional(), total_kwh: z.number().nullable().default(null), total_cost_krw: z.number().nullable().default(null), cost_per_km_krw: z.number().nullable().default(null) }),
      months: z.array(z.object({ month: z.string(), home_kwh: z.number().nullable().default(null), home_cost_krw: z.number().nullable().default(null), work_kwh: z.number().nullable().default(null), work_cost_krw: z.number().nullable().default(null), work_discount_krw: z.number().nullable().default(null), work_discount_cap_krw: z.number().nullable().default(null), other_kwh: z.number().nullable().optional(), other_cost_krw: z.number().nullable().optional(), fast_kwh: z.number().nullable().optional(), fast_cost_krw: z.number().nullable().optional(), known_cost_krw: z.number().nullable().optional(), total_cost_krw: z.number().nullable().optional() })).default([]),
      rates: z.record(z.string(), z.number()).optional(),
      note: z.string().optional(),
    }).optional(),
    efficiency: z.object({ wh_per_km: z.number().nullable().default(null), prior_wh_per_km: z.number().nullable().default(null), wh_per_km_delta: z.number().nullable().default(null), parked_drain_pct_per_day: z.number().nullable().default(null), prior_parked_drain_pct_per_day: z.number().nullable().default(null), method: z.string().optional() }).optional(),
    battery_condition: z.object({
      range_at_100_trend: z.array(z.object({ week_start: z.string(), range_at_100_km: z.number().nullable().default(null), ma4_km: z.number().nullable().default(null) })).default([]),
      avg_charge_end_soc_pct: z.number().nullable().default(null), high_power_drive_count: z.number().nullable().default(null), high_power_threshold_kw: z.number().nullable().default(null), high_power_peak_kw: z.number().nullable().default(null),
      dc_fast_charge_count: z.number().nullable().default(null), dc_fast_charge_threshold_kw: z.number().nullable().default(null), note: z.string().optional(),
    }).optional(),
    vehicle_info: z.object({ software_version: z.string().nullable().default(null), update_history: z.array(z.object({ version: z.string(), date: z.string() })).default([]) }).optional(),
    observation_note: z.string().optional(),
    week_compare: z.object({
      prior_week_end: z.string().nullable().default(null),
      distance_km_delta: z.number().nullable().default(null),
      charging_kwh_delta: z.number().nullable().default(null),
      capacity_kwh_delta: z.number().nullable().default(null),
      events_180_delta: z.number().nullable().default(null),
      events_per_1000km_delta: z.number().nullable().default(null),
      max_discharge_power_kw_delta: z.number().nullable().default(null),
      wh_per_km_delta: z.number().nullable().optional(),
      drive_count_delta: z.number().nullable().optional(),
      cost_krw_delta: z.number().nullable().optional(),
    }).nullable().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: z.object({
      date: z.string().optional(),
    }),
  }),
});

export const collections = { notes, vehicleReports, vehicleData, docs };
