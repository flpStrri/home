import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error("Astro site is required to generate the RSS feed.");
  }

  const site = context.site;
  const articles = await getCollection("articles");
  const lastBuildDate = articles
    .map((article) => article.data.publishedAt)
    .sort((a, b) => b.getTime() - a.getTime())[0]
    ?.toUTCString();

  return rss({
    title: "Storarri Home",
    description: "Notes and stories from the Storarri family.",
    site,
    trailingSlash: false,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    customData: `
      <copyright>Copyright 2026 Storarri family</copyright>
      <pubDate>${lastBuildDate}</pubDate>
      <lastBuildDate>${lastBuildDate}</lastBuildDate>
      <atom:link href="${site}rss.xml" rel="self" type="application/rss+xml" />
      <image>
        <url>${site}favicon.svg</url>
        <title>Storarri Home</title>
        <link>${site}</link>
        <width>64</width>
        <height>64</height>
      </image>
    `,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishedAt,
      description: article.data.description,
      link: `/articles/${article.id}`,
      author: article.data.author,
    })),
  });
}
