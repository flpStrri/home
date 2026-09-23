import { expect, test } from "bun:test";

const baseUrl = process.env.E2E_BASE_URL ?? "";

async function getIndex() {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.text();

  return { response, body };
}

test("index returns HTTP 200", async () => {
  const { response } = await getIndex();

  expect(response.status).toBe(200);
});

test("index has the expected title", async () => {
  const { body } = await getIndex();

  expect(body).toContain("<title>Hello, world</title>");
});

test("index has the expected heading", async () => {
  const { body } = await getIndex();

  expect(body).toContain("<h1>Hello, world!</h1>");
});

test("index links the favicon", async () => {
  const { body } = await getIndex();

  expect(body).toContain('href="/favicon.svg"');
});

test("index links the first article", async () => {
  const { body } = await getIndex();

  expect(body).toContain('href="/articles/the-first-mark"');
});

test("index links the second article", async () => {
  const { body } = await getIndex();

  expect(body).toContain('href="/articles/after-noon"');
});
