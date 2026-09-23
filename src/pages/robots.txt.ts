export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /cdn-cgi/
Disallow: /rss.xml
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
