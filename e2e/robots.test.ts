import { expect, test } from "bun:test";

const baseUrl = process.env.E2E_BASE_URL ?? "";

async function getRobots() {
  const response = await fetch(`${baseUrl}/robots.txt`);
  const body = await response.text();

  return { response, body };
}

test("robots.txt returns HTTP 200", async () => {
  const { response } = await getRobots();

  expect(response.status).toBe(200);
});

test("robots.txt returns plain text", async () => {
  const { response } = await getRobots();

  expect(response.headers.get("content-type")).toContain("text/plain");
});

test("robots.txt defines the default user agent", async () => {
  const { body } = await getRobots();

  expect(body).toContain("User-agent: *");
});

test("robots.txt blocks Cloudflare internal paths", async () => {
  const { body } = await getRobots();

  expect(body).toContain("Disallow: /cdn-cgi/");
});

test("robots.txt blocks the RSS feed", async () => {
  const { body } = await getRobots();

  expect(body).toContain("Disallow: /rss.xml");
});
