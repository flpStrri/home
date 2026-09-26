# Engineering Specification

## 1. Purpose

This document is the canonical engineering specification for a
performance-first editorial website deployed entirely on Cloudflare.

The site is primarily content-oriented. Articles should be easy to
author and publish while the delivered website remains extremely fast,
cache-friendly, and operationally simple.

This specification records engineering decisions. Visual design
decisions such as typography selection, colors, spacing, and detailed
layout remain intentionally open unless explicitly added later.

## 2. Engineering Priorities

In priority order:

1. Excellent end-user performance.
2. Minimal client-side JavaScript.
3. Simple article authoring.
4. Static generation wherever possible.
5. Global delivery through Cloudflare.
6. Reproducible local, CI, and deployment environments.
7. Low operational complexity.
8. Small dependency and asset footprint.

Performance is a product requirement, not a post-build optimization.

## 3. Architecture

The baseline architecture is:

```text
Markdown content
      |
      v
    Astro
      |
      v
Pre-rendered HTML + CSS + static assets
      |
      v
Cloudflare Workers Static Assets
      |
      v
Cloudflare edge network
```

There is no traditional origin application server in the baseline
architecture.

Astro is responsible for static site generation. Cloudflare Workers
Static Assets is responsible for production delivery.

Dynamic or server-side behavior must be introduced only when a concrete
requirement justifies it.

## 4. Application Framework

### Decision

Use **Astro**.

### Rationale

Astro provides the content-oriented authoring and templating
capabilities needed for an editorial site while allowing pages to be
emitted as static HTML.

The default architectural posture is static generation rather than
shipping a client-side application.

### Constraints

* Pages should be pre-rendered whenever possible.
* Client-side hydration is opt-in.
* Interactive islands may be introduced when a feature genuinely
  requires browser-side behavior.
* A UI framework must not be introduced globally merely for component
  authoring.

## 5. Content

Articles are authored primarily in **Markdown**.

Astro converts source content into pre-rendered pages during the build.

The content model and frontmatter schema are not yet finalized.

Potential future concerns include:

* article metadata;
* authors;
* publication and modification dates;
* categories/tags;
* social metadata;
* feeds;
* structured data.

These are not architectural commitments yet.

## 6. Styling

Use **plain CSS** as the baseline styling technology.

No CSS framework or component/UI framework is included by default.

CSS should favor:

* a small global stylesheet;
* reusable CSS custom properties where appropriate;
* minimal generated CSS;
* no client-side styling runtime;
* styles scoped or organized according to actual maintainability
  needs.

Typography, colors, spacing scales, and the visual system remain design
decisions.

## 7. JavaScript Policy

The default client-side JavaScript budget is **zero**.

JavaScript may be shipped to the browser when functionality requires it,
but each addition should be intentional.

Build-time JavaScript is unrestricted by this rule. Astro, Bun,
Wrangler, and other development tooling do not contribute to the browser
runtime unless their output explicitly does so.

## 8. Fonts

Custom fonts are permitted.

### Delivery policy

Fonts must be:

* self-hosted;
* delivered from the Cloudflare-hosted site rather than a third-party
  font CDN;
* served as WOFF2 where practical;
* subset to the glyph ranges actually required;
* limited to the weights/styles actually used.

Critical fonts may be preloaded when measurement shows that doing so
improves the user experience.

`font-display` behavior must avoid unnecessarily blocking first render.

### Current design direction

A display serif is expected for prominent editorial/hero typography.

The exact typeface is deliberately **undecided**.

Body typography is also a design decision and is not fixed by this
specification.

## 9. Images and Media

Images should be optimized before or during the build process.

Baseline requirements:

* appropriate image dimensions;
* responsive image variants where useful;
* modern efficient formats where appropriate;
* explicit dimensions to reduce layout shift;
* lazy loading for non-critical/below-the-fold imagery;
* critical imagery treated separately from lazy-loaded content.

The exact image pipeline is not yet selected.

## 10. Cloudflare Platform

### Hosting

Use **Cloudflare Workers Static Assets** for the generated site.

The architecture should take advantage of Cloudflare's edge delivery and
caching rather than introducing a conventional origin server.

### Runtime portability

Application/runtime-facing code should prefer Web Platform and
Cloudflare Workers-compatible APIs.

Build tooling may use Bun-specific functionality where useful, but
application architecture should not unnecessarily couple runtime
behavior to Bun.

Cloudflare Workers production execution must not be treated as a Bun
runtime.

## 11. Development Toolchain

### mise

**mise** is the canonical toolchain manager and task runner.

`mise.toml` is the source of truth for:

* tool versions;
* development commands;
* build commands;
* validation tasks;
* deployment tasks.

Developers, CI, and Cloudflare should invoke the same mise tasks rather
than reimplementing project commands independently.

### Bun

Use **Bun** as the JavaScript package manager and build-time JavaScript
runtime.

Bun is pinned through mise.

Bun is a development/build-tooling decision and does not imply that
production requests execute in Bun.

Commit:

```text
mise.toml
mise.lock
bun.lock
```

where applicable to the selected mise/Bun versions.

Do not maintain an npm-based parallel workflow unless a concrete
compatibility requirement appears.

## 12. Canonical Task Interface

The intended interface is conceptually:

```text
mise run install
mise run dev
mise run check
mise run test
mise run build
mise run deploy
```

The exact task definitions will live in `mise.toml`.

Consumers of the repository should interact with these tasks rather than
reproducing their underlying Bun/Astro/Wrangler commands.

## 13. Repository Shape

Initial target structure:

```text
.
├── mise.toml
├── mise.lock
├── bun.lock
├── package.json
├── astro.config.mjs
├── wrangler.jsonc
├── scripts/
│   └── mise
├── src/
│   ├── content/
│   ├── layouts/
│   ├── pages/
│   └── styles/
└── public/
    ├── fonts/
    └── images/
```

This structure is provisional and may evolve with the content model.

## 14. Continuous Integration

Use **GitHub Actions** for quality gates.

GitHub Actions should:

1. install/bootstrap mise;
2. run `mise install`;
3. execute the same mise tasks used by developers;
4. validate the project before merge.

Expected gates include:

```text
mise run check
mise run test
mise run build
```

Performance-budget checks may be added to CI as the site becomes
measurable.

Required CI checks should pass before changes are merged into the
production branch.

GitHub Actions is responsible for validation; Cloudflare Workers Builds
is responsible for deployment.

## 15. Continuous Deployment

Use **Cloudflare Workers Builds**.

The production branch is `main` unless changed later.

Cloudflare should not contain an independent copy of the project's build
logic. It bootstraps mise and invokes repository-defined tasks.

Conceptually:

```text
Git push
   |
   +--> GitHub Actions
   |       |
   |       +--> mise --> validation
   |
   +--> Cloudflare Workers Builds
           |
           +--> bootstrap mise
           +--> mise install
           +--> mise run build
           +--> mise run deploy
                        |
                        v
                     Wrangler
                        |
                        v
              Workers Static Assets
```

### Cloudflare dependency installation

Set:

```text
SKIP_DEPENDENCY_INSTALL=1
```

Cloudflare's automatic dependency installation should be disabled
because dependency management belongs to the repository-defined mise/Bun
workflow.

### Bootstrap

The repository should contain a minimal bootstrap mechanism, such as
`scripts/mise`, whose responsibility is to make mise available in build
environments that do not already provide it.

After bootstrap, all meaningful build/deployment behavior belongs to
mise tasks.

### Tool version ownership

Do not separately configure Bun versions in Cloudflare when mise already
owns that version.

The desired ownership model is:

```text
Cloudflare knows how to invoke mise.
GitHub Actions knows how to invoke mise.
Developers know how to invoke mise.
mise knows the toolchain and project tasks.
```

## 16. Deployment Tooling

Use **Wrangler** for Cloudflare deployment.

Wrangler should be invoked through the repository's pinned toolchain
rather than assumed to exist globally.

Cloudflare-specific configuration belongs in `wrangler.jsonc` unless a
future requirement makes another supported format preferable.

## 17. Caching

The caching strategy should distinguish immutable build artifacts from
HTML.

Fingerprint/hash versioned assets should receive aggressive long-lived
caching.

HTML caching must permit content updates to propagate correctly and
should not blindly use the immutable asset policy.

Exact cache-control values will be specified once the generated asset
structure and deployment behavior are finalized.

## 18. Performance Requirements

Performance is a first-class engineering constraint.

The site should optimize for:

* fast initial HTML delivery;
* low transfer size;
* minimal render-blocking resources;
* minimal JavaScript execution;
* stable layout;
* efficient font loading;
* efficient image delivery;
* effective edge/browser caching;
* strong Core Web Vitals.

### Performance-budget checks

Performance budgets will be enforced in CI using two complementary classes of checks:

1. **Deterministic build-output budgets** for asset sizes and page weight.
2. **Browser-based lab checks** for rendering and loading behavior.

Field metrics will be monitored separately after deployment because some Core Web Vitals, especially INP, require real-user data and should not be treated as deterministic CI signals.

#### Build-output budgets

After `mise run build`, CI will inspect Astro's generated output and fail when committed changes exceed configured limits.

Budgets should cover at least:

* total JavaScript shipped per page;
* total CSS shipped per page;
* critical/preloaded font bytes;
* individual image size;
* total initial page weight for representative pages;
* number of client-side JavaScript resources;
* number of render-blocking resources where practical.

The checks should operate on compressed transfer size where that reflects actual delivery cost, while also retaining raw-size limits where useful for catching regressions.

Budgets must live in the repository so changes to them are code-reviewed rather than configured manually in CI.

A small repository-owned script may perform these checks directly against the generated `dist/` tree. It should be exposed through mise, for example:

```text
mise run perf:size
```

#### Browser-based performance checks

Use Lighthouse CI, or an equivalent headless-browser tool, against a locally served production build during CI.

The CI flow should be conceptually:

```text
mise run build
mise run preview
mise run perf:lighthouse
```

Lighthouse should run against a small set of representative URLs rather than every generated page.

At minimum, the suite should include:

* the home page;
* a typical article page;
* the heaviest legitimate article/page template;
* any page with materially different rendering behavior.

The checks should enforce budgets for metrics that are reasonably stable in a controlled lab environment, such as:

* Lighthouse Performance score;
* Largest Contentful Paint (LCP);
* Cumulative Layout Shift (CLS);
* Total Blocking Time (TBT);
* Speed Index;
* transferred resource size where useful.

Lighthouse runs can exhibit noise. CI should therefore use multiple runs and evaluate the median result rather than failing on a single anomalous run.

#### Core Web Vitals and field data

CI lab tests are regression guards, not a substitute for production measurements.

After launch, real-user monitoring should track at least:

* LCP;
* CLS;
* INP.

Field measurements should be evaluated at the appropriate percentile, normally the 75th percentile, and segmented by page type/device class when enough data exists.

If Cloudflare Web Analytics or another RUM source is selected later, its field data should become the production feedback loop. CI budgets remain the pre-merge guardrail.

#### Pull-request behavior

Performance checks should run for pull requests that can affect rendered output or assets.

A pull request should fail when it violates a hard budget.

Where useful, CI may also publish a comparison against the base branch showing:

* asset-size delta;
* page-weight delta;
* Lighthouse metric delta.

Relative regression reporting is useful, but hard absolute budgets remain authoritative. A page should not be allowed to become permanently slow merely because each individual regression was small.

#### Initial budget policy

Exact numerical thresholds remain **TBD** until the first representative implementation exists.

The initial process will be:

1. build representative production pages;
2. measure them under controlled CI conditions;
3. establish budgets slightly above the measured baseline to allow normal variance;
4. commit those limits to the repository;
5. ratchet budgets downward when optimizations create durable headroom.

Budgets should be strict enough to catch regressions but not so tight that harmless measurement variance causes flaky CI.

#### Intended task interface

The eventual mise interface should expose the checks explicitly:

```text
mise run perf:size
mise run perf:lighthouse
mise run perf
```

`mise run perf` should execute all required performance-budget checks and be suitable for use both locally and in GitHub Actions.

Performance checks that require external production data should not be included in the deterministic pre-merge task.

Exact numerical budgets are currently **TBD** and should be established once the first representative pages exist.

## 19. Explicit Non-Goals / Defaults

Unless requirements change, the baseline does **not** include:

* a SPA architecture;
* a global client-side JavaScript framework;
* a UI component framework;
* a CSS framework;
* third-party font hosting;
* a traditional application origin server;
* a database;
* a CMS;
* runtime rendering for content that can be statically generated;
* duplicated build logic across local development, GitHub Actions, and
  Cloudflare.

These can be reconsidered when a concrete requirement justifies the
additional complexity.

## 20. Decisions Still Open

The following are intentionally unresolved:

* visual design;
* exact display serif font;
* body font strategy;
* color palette;
* layout and spacing system;
* detailed Markdown/frontmatter content schema;
* image processing implementation;
* exact cache-control policy;
* exact performance budgets;
* analytics;
* SEO/structured-data implementation details;
* search;
* comments or other interactive editorial features.

## 21. Decision Log

### Astro over hand-authored static HTML

Articles require a maintainable authoring workflow. Astro provides
Markdown/content tooling while preserving static output and minimal
browser runtime.

### Workers Static Assets as the delivery platform

The project is Cloudflare-native and optimized around static edge
delivery without a conventional origin server.

### Plain CSS

The current site does not justify the runtime or tooling complexity of a
styling framework. Plain CSS provides maximum control over output and
keeps the dependency surface small.

### Self-hosted fonts

Self-hosting avoids a third-party font request path and gives the
project direct control over subsetting, caching, preloading, and file
formats.

### Bun as build-time JavaScript tooling

Bun provides a compact development toolchain and package-management
workflow. This choice does not affect production request execution.

### mise as the toolchain boundary

mise makes tool versions and tasks repository-owned. The same interface
can therefore be used locally, in GitHub Actions, and in Cloudflare
Workers Builds.

### GitHub Actions for CI; Cloudflare Workers Builds for CD

Validation and deployment have separate responsibilities. GitHub gates
changes; Cloudflare owns deployment to the target platform.

---

## Status

**Phase:** Initial architecture specification

This document should be updated when engineering decisions change.
Superseded decisions should be reflected in the decision log rather than
silently leaving contradictory configuration in the repository.



Building a performance-first editorial site on Cloudflare Workers Static Assets using Astro to generate static HTML from Markdown.
No origin server, JavaScript is zero by default, with hydration only when justified.
Plain CSS only, no UI framework.
Fonts self-hosted as WOFF2, subset, limited weights, minimal preloads.
Images are optimized at build with responsive sizes and lazy loading.
Performance budgets enforced in CI, measure Core Web Vitals.
Toolchain and task runner is mise; bun pinned underneath. Use mise tasks locally and in CI. No global node or bun assumptions.
Repo on GitHub. GitHub Actions runs quality gates via mise.
Cloudflare Workers Builds handles preview and production deploys from the main.
Require CI pass before merge.
