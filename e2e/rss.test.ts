import { expect, test } from "bun:test";

const baseUrl = process.env.E2E_BASE_URL ?? "";
const expectedArticleCount = Number(process.env.E2E_ARTICLE_COUNT);

async function getFeed(): Promise<{
  response: Response;
  body: string;
  channel: string;
  items: string[];
}> {
  const response = await fetch(`${baseUrl}/rss.xml`);
  const body = await response.text();
  const channel = body.match(/<channel>([\s\S]*?)<\/channel>/)?.[1] ?? "";
  const items = [...body.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
    (match) => match[1] ?? "",
  );

  return { response, body, channel, items };
}

function tagValue(xml: string, tagName: string): string {
  return (
    xml.match(
      new RegExp(`<${tagName}(?:\\s[^>]*)?>([^<]*)</${tagName}>`),
    )?.[1] ?? ""
  );
}

function itemValues(items: string[], tagName: string): string[] {
  return items.map((item) => tagValue(item, tagName));
}

test("RSS endpoint returns HTTP 200", async () => {
  const { response } = await getFeed();

  expect(response.status).toBe(200);
});

test("RSS endpoint returns XML", async () => {
  const { response } = await getFeed();

  expect(response.headers.get("content-type")).toContain("text/xml");
});

test("RSS document has an XML declaration", async () => {
  const { body } = await getFeed();

  expect(body).toContain("<?xml");
});

test("RSS document uses version 2.0", async () => {
  const { body } = await getFeed();

  expect(body).toContain('<rss version="2.0"');
});

test("RSS channel has the correct title", async () => {
  const { channel } = await getFeed();

  expect(tagValue(channel, "title")).toBe("Storarri Home");
});

test("RSS channel has the production image", async () => {
  const { body } = await getFeed();

  expect(body).toContain("<url>https://storarri.family/favicon.svg</url>");
});

test("RSS channel has a publication date", async () => {
  const { channel } = await getFeed();

  expect(tagValue(channel, "pubDate")).toMatch(/^\w{3}, \d{2} \w{3} \d{4} /);
});

test("RSS channel has a last build date", async () => {
  const { channel } = await getFeed();

  expect(tagValue(channel, "lastBuildDate")).toMatch(
    /^\w{3}, \d{2} \w{3} \d{4} /,
  );
});

test("RSS item count matches the Markdown article count", async () => {
  const { items } = await getFeed();

  expect(items).toHaveLength(expectedArticleCount);
});

test("every RSS item has a title", async () => {
  const { items } = await getFeed();

  expect(itemValues(items, "title").every(Boolean)).toBe(true);
});

test("every RSS article link is absolute", async () => {
  const { items } = await getFeed();
  const articleUrl = /^https:\/\/storarri\.family\/articles\//;

  expect(itemValues(items, "link").every((link) => articleUrl.test(link))).toBe(
    true,
  );
});

test("every RSS article link has no trailing slash", async () => {
  const { items } = await getFeed();

  expect(itemValues(items, "link").every((link) => !link.endsWith("/"))).toBe(
    true,
  );
});

test("every RSS item has a publication date", async () => {
  const { items } = await getFeed();
  const date = /^\w{3}, \d{2} \w{3} \d{4} /;

  expect(itemValues(items, "pubDate").every((value) => date.test(value))).toBe(
    true,
  );
});

test("every RSS item has an author", async () => {
  const { items } = await getFeed();

  expect(itemValues(items, "author").every(Boolean)).toBe(true);
});

test("every RSS item has a description", async () => {
  const { items } = await getFeed();

  expect(itemValues(items, "description").every(Boolean)).toBe(true);
});
