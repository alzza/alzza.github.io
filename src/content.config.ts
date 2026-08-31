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
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { notes, vehicleReports };
