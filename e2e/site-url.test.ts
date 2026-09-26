import { expect, test } from "bun:test";

import { getSiteUrl } from "../src/site-url";

test("site URL uses the production domain by default", () => {
  expect(getSiteUrl({})).toBe("https://storarri.family");
});

test("site URL uses the production domain on main", () => {
  expect(getSiteUrl({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toBe(
    "https://storarri.family",
  );
});

test("site URL sanitizes preview branch names", () => {
  expect(
    getSiteUrl({
      WORKERS_CI: "1",
      WORKERS_CI_BRANCH: "feature/Preview_test",
    }),
  ).toBe("https://feature-preview-test-home.storarri-family.workers.dev");
});

test("preview site URL never uses the production custom domain", () => {
  const site = getSiteUrl({
    WORKERS_CI: "1",
    WORKERS_CI_BRANCH: "feature/preview",
  });

  expect(new URL(site).hostname).not.toBe("storarri.family");
});

test("long preview branch names produce valid hostnames", () => {
  expect(
    getSiteUrl({
      WORKERS_CI: "1",
      WORKERS_CI_BRANCH: `feature/${"long-".repeat(12)}-name`,
    }),
  ).toBe(
    "https://feature-long-long-long-long-long-long-long-long-long--9596-home.storarri-family.workers.dev",
  );
});
