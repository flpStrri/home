import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://storarri.family",
  trailingSlash: "never",
  output: "static",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
