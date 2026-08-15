import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://alzza.github.io",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
