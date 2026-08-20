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

export const collections = { notes };
