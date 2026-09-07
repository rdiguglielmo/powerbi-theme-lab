# powerbi-theme-lab

A Power BI theming system generated from code, demonstrated on a real report.

`theme-lab/` compiles a complete Power BI theme from a short list of design tokens, audits every
colour pair it produces against the WCAG contrast formula, and rewires the report to load the
result. Change the tokens and the same report arrives in a different set of clothes without a single
page being edited.

The gallery is the evidence: three pages of a dashboard built on SEC EDGAR XBRL filings, rendered in
each of six themes, where every figure is identical and only the palette moves.

| Ledger, the theme that shipped | Performance Dark |
|---|---|
| [![The theme harness in Ledger](docs/harness/ledger.jpg)](docs/harness/ledger.jpg) | [![The theme harness in Performance Dark](docs/harness/perf-dark.jpg)](docs/harness/perf-dark.jpg) |

That is the harness page: one visual of every type worth theming, with real data and no colour set
by hand anywhere. It is the surface a theme is judged on. All six are in
[HOW-IT-WORKS.md](HOW-IT-WORKS.md).

## The gallery

**[Open the gallery](https://rdiguglielmo.github.io/powerbi-theme-lab/)** — eighteen renders, three
report pages across six themes, switchable by theme or by page, each with its measured contrast
ratio.

It is a single page with no build step and no dependencies, served by GitHub Pages from `/docs`.

## How it works

Three diagrams, in [HOW-IT-WORKS.md](HOW-IT-WORKS.md): the compiler and the page-generator lane
beside it, the loop this is worked in, and where the numbers come from. They are written once,
there, rather than copied into this file, so they cannot drift out of step with each other.

The one rule worth stating twice: **a page generator runs first and `build.mjs` runs last.**
Backwards, the generator rewrites its page from scratch and drops the canvas colour the build had
just stamped into it. The page then renders on Power BI's default grey, the validator still reports
zero errors, and nothing anywhere says why.

For the full reference — what a theme file actually reaches, what it does not, and how to lift the
folder into another project — see [`theme-lab/README.md`](theme-lab/README.md). It is long on
purpose, and written for someone who has not done this before.

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

That writes `gallery/theme-gallery.html`, a single self-contained file with every screenshot inlined
as a data URI. It works offline, from a USB stick or as a mail attachment, and it is what a host
with a strict content security policy needs. Its output is gitignored: two megabytes of base64
rewritten in full on every screenshot change does not belong in git history.

## What runs here and what does not

Being precise about this, because the folder looks more self-sufficient than it is:

- **`theme-lab/tokens.mjs` and `theme-lab/theme.mjs` run here.** They are the compiler: tokens in, a
  complete Power BI theme JSON and a contrast audit out. Nothing in them refers to a report.
- **`theme-lab/build.mjs` and `theme-lab/harness.mjs` do not.** They rewire a PBIR report —
  `report.json`, the resource package, the canvas stamp on every page — and no report is committed
  here. They also import `../project.config.mjs`, which is why that file sits beside the folder
  rather than inside it. The report they were built against lives in the pipeline project.

## Two copies of `theme-lab/`, and which one wins

`theme-lab/` is designed to be copied between projects unchanged — nothing report-specific is
allowed to live in it, and every path and name it needs comes from `project.config.mjs`. Copying is
the intended distribution model, not a shortcut.

The consequence is that two copies exist and can drift: this one, and the one in the pipeline
project, which still needs it to build its own theme. **The copy in this repository is the canonical
one.** A fix made in one belongs in the other.

## How this was worked

Nothing in a Power BI theme fails out loud. A property with the wrong name is ignored. A property
with the right name and a wrong-typed value is also ignored. A page that lost its background colour
still validates clean. So the method here is not code review, it is measurement — and it earns its
keep, because it has caught things that looked finished.

**A fix that validated clean and moved nothing.** A change to remove a double border on the cards
was written, well commented, and completely inert. Two independent reasons, and from the outside
both look the same: the spacing properties of `layout` turn out to have no visual effect on
`cardVisual` whatever value they are given, and the margins were written as `0D` where the property
is an integer and wants `0L`. Power BI discards a literal of the wrong type without a word. It was
caught by regenerating and comparing the screenshot, not by reading the diff.

**A fix that could never have run.** A band height raised from 112 to 128 to stop a card clipping its
own descenders. The file timestamps gave it away: it had been edited two minutes after the last time
the generators ran, so that number had never been generated. It could not have been — the three
pages already sum to exactly the canvas height, and the guard that adds them up throws at 1096. The
guard was right there and would have caught it on the first run. Nobody ran it.

**A screenshot that lied about the theme.** Capturing the harness in six themes, three of the six
came back with the matrix and the table showing their rows but washed out — which reads exactly like
a contrast bug in the palette. It was the capture racing the render. What ruled out the theme was
finding an older screenshot of the same theme where the same visual looks perfect.

What catches this class of problem is boring and it is always the same three things: write down what
the number or the page is supposed to look like **before** running anything, measure rather than
reason, and look at every single render instead of trusting that it worked.

The same method applied to the data half — four errors that reached work in progress on that
project, every one of them returning a believable number, and how each was caught by measuring —
is written up in the pipeline repository under
[What I Learned](https://github.com/rdiguglielmo/sec-edgar-financial-pipeline#what-i-learned).

## The dashboard behind the screenshots

The data engineering half — SEC EDGAR extraction, DuckDB, a dbt star schema, 156 quality checks and
the Parquet export the report reads — is a separate project:

[rdiguglielmo/sec-edgar-financial-pipeline](https://github.com/rdiguglielmo/sec-edgar-financial-pipeline)

Two repositories because they are two disciplines. That one answers whether the numbers are right;
this one is about how a report is dressed.

## Licence

[MIT](LICENSE). The screenshots show public-domain SEC filing data.
