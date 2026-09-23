import { expect, test } from "bun:test";

const baseUrl = process.env.E2E_BASE_URL ?? "";
const articleSlugs: string[] = ["the-first-mark", "after-noon"];

test("article routes work without trailing slashes", async () => {
  for (const slug of articleSlugs) {
    const url = `${baseUrl}/articles/${slug}`;
    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(response.url).toBe(url);
  }
});
