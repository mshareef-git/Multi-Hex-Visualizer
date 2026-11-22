import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  integrations: [sitemap()],
});