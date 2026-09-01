import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    kicker: z.string().optional(),
    tags: z.array(z.string()).default([]),
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
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { notes, vehicleReports, vehicleData };
