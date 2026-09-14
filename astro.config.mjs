import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://alzza.github.io",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
  integrations: [
    starlight({
      title: "현장 적용 문서",
      defaultLocale: "root",
      locales: {
        root: { label: "한국어", lang: "ko" },
      },
      sidebar: [
        {
          label: "테스트",
          items: [{ label: "Finger Retry ON/OFF", slug: "docs/finger-retry-onoff" }],
        },
      ],
      customCss: ["./src/styles/starlight-ld.css"],
      components: {
        Head: "./src/components/starlight/Head.astro",
      },
    }),
  ],
});
