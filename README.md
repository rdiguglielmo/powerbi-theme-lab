# powerbi-theme-lab

A Power BI theming system generated from code, demonstrated on a real report.

`theme-lab/` compiles a complete Power BI theme from about twenty-five design tokens, audits every
colour pair it produces against the WCAG contrast formula, and rewires the report to load the
result. Change the tokens and the same report arrives in a different set of clothes without a
single page being edited. The gallery is the evidence: three pages of a dashboard built on SEC
EDGAR XBRL filings, rendered in each of six themes, where every figure is identical and only the
palette moves.

> **This README is a placeholder.** The repository is being built in three phases and this is the
> end of the first: the gallery has a home. The diagrams and the full write-up come next.

## The gallery

`docs/index.html` — open it in a browser. Eighteen renders: three report pages across six themes,
switchable by theme or by page, each with its measured contrast ratio.

It will be served by GitHub Pages from `/docs` once this repository is public.

## Building it

Node, no dependencies, nothing to install.

```bash
node gallery/assemble.mjs
```

That writes `docs/index.html` with the screenshots linked as files — the mode that gets committed,
so changing one screenshot changes one file.

```bash
node gallery/assemble.mjs --embed
```

That writes `gallery/theme-gallery.html`, a single self-contained file with every screenshot
inlined as a data URI. It works offline, from a USB stick or as a mail attachment, and it is what a
host with a strict content security policy needs. Its output is gitignored: two megabytes of base64
rewritten in full on every screenshot change does not belong in git history.

## What runs here and what does not

Being precise about this, because the folder looks more self-sufficient than it is:

- **`theme-lab/tokens.mjs` and `theme-lab/theme.mjs` run here.** They are the compiler: tokens in,
  a complete Power BI theme JSON and a contrast audit out. Nothing in them refers to a report.
- **`theme-lab/build.mjs` and `theme-lab/harness.mjs` do not.** They rewire a PBIR report —
  `report.json`, the resource package, the canvas stamp on every page — and no report is committed
  here. They also import `../project.config.mjs`, which is why that file sits beside the folder
  rather than inside it. The report they were built against lives in the pipeline project.

## Two copies of `theme-lab/`, and which one wins

`theme-lab/` is designed to be copied between projects unchanged — nothing report-specific is
allowed to live in it, and every path and name it needs comes from `project.config.mjs`. Copying is
the intended distribution model, not a shortcut.

The consequence is that two copies exist and can drift: this one, and the one in the pipeline
project, which still needs it to build its own theme. **The copy in this repository is the
canonical one.** A fix made in one belongs in the other.

## The dashboard behind the screenshots

The data engineering half — SEC EDGAR extraction, DuckDB, a dbt star schema, 156 quality checks and
the Parquet export the report reads — is a separate project:

[rdiguglielmo/sec-edgar-financial-pipeline](https://github.com/rdiguglielmo/sec-edgar-financial-pipeline)

Two repositories because they are two disciplines. That one answers whether the numbers are right;
this one is about how a report is dressed.

## Licence

[MIT](LICENSE). The screenshots show public-domain SEC filing data.
