import { expect, test } from "bun:test";

const baseUrl = process.env.E2E_BASE_URL ?? "";

test("favicon is served as SVG", async () => {
  const response = await fetch(`${baseUrl}/favicon.svg`);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/svg+xml");
});

test("BIMI logo is served from the well-known path", async () => {
  const response = await fetch(`${baseUrl}/.well-known/bimi.svg`);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/svg+xml");
});
