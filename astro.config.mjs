import { defineConfig } from "astro/config";

import { getSiteUrl } from "./src/site-url";

const site = getSiteUrl(process.env);

export default defineConfig({
  site,
  trailingSlash: "never",
  output: "static",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
