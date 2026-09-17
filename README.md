# powerbi-theme-lab

A Power BI theming system generated from code, demonstrated on a real report.

Everything here was built with AI. Not a single visual was positioned, coloured or adjusted by hand
in Power BI Desktop — the pages, the harness and the theme are all written by scripts, which is the
whole reason a theme swap can be trusted to change nothing but the palette. The design can be pushed
considerably further than this; the point is not that it is finished, but how far a report can be
taken this way.

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

It is one HTML file. `gallery/assemble.mjs` stitches `gallery/head.html`, `gallery/body.html` and a
generated block of JavaScript into `docs/index.html`, and the page builds its own grid from that
block at run time. No framework, no bundler, no build step in CI; the only thing it fetches from the
network is a Google Fonts stylesheet.

GitHub Pages serves the committed `/docs` folder of `main` directly. There is no workflow file and
nothing to deploy — pushing a commit that changes `docs/` publishes it. On the Free plan Pages
serves a repository only while it is public, which is why this one is.

## How it works

Three diagrams, in [HOW-IT-WORKS.md](HOW-IT-WORKS.md): the compiler and the page-generator lane
beside it, the loop this is worked in, and where the numbers come from. They are written once,
there, rather than copied into this file, so they cannot drift out of step with each other.

The one rule worth stating twice: **a page generator runs first and `build.mjs` runs last.**
Backwards, the generator rewrites its page from scratch and drops the canvas colour the build had
just stamped into it. The page then renders on Power BI's default grey, the validator still reports
zero errors, and nothing anywhere says why.

For the full reference — what a theme file actually reaches and what it does not — see
[`theme-lab/README.md`](theme-lab/README.md). It is long on purpose, and written for someone who has
not done this before.

**To use this on your own report**, go straight to
[section 9, Starting a new project](theme-lab/README.md#9-starting-a-new-project-step-by-step): ten
steps from copying the folder to the first themed screenshot. It works against any PBIP project:
nothing in `theme-lab/` knows a report's name, and the one in the screenshots is only the report it
happened to be demonstrated on.

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

The two PowerShell scripts beside it are for preparing the images, not for building the page.
`gallery/conv.ps1` is the one in the loop: it crops a Power BI Desktop capture to the report canvas,
resizes it and encodes the JPEG that lands in `docs/shots/`. Its crop rectangle is measured from
one particular Desktop window geometry, so crop one capture and look at it before running the whole
set. `gallery/crop.ps1` is a bench tool that cuts out a rectangle and blows it up without smoothing,
for settling an argument about a border or a letterform at the pixel level. Nothing calls it; you
run it when you need it.

## What runs here and what does not

Being precise about this, because the folder looks more self-sufficient than it is:

- **`theme-lab/tokens.mjs` and `theme-lab/theme.mjs` run here.** They are the compiler: tokens in, a
  complete Power BI theme JSON and a contrast audit out. Nothing in them refers to a report.
- **`theme-lab/build.mjs` and `theme-lab/harness.mjs` do not.** They rewire a PBIR report —
  `report.json`, the resource package, the canvas stamp on every page — and no report is committed
  here. They also import `../project.config.mjs`, which is why that file sits beside the folder
  rather than inside it. Point `reportDir` at your own PBIP and both run. Point it at nothing, as
  this repository does, and each stops with `no PBIR report at ...` before writing a byte.

## Copying it into your own project

`theme-lab/` is designed to be copied between projects unchanged. Nothing report-specific is allowed
to live in it, and every path, field and name it needs arrives from `project.config.mjs`, one folder
up. Copying is the intended distribution model, not a shortcut — there is no package to install and
no version to track.

That claim is checkable rather than asserted: grep the folder for anything that names a report and
you get nothing back. The only line in any of the four scripts that reaches outside `theme-lab/` is
`import { project } from '../project.config.mjs'`.

The cost of distributing by copy is that copies drift. If you keep more than one, fix them together
— the folder is small enough that a hash comparison settles it in one command.

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

## Related projects

[**rdiguglielmo/sec-edgar-financial-pipeline**](https://github.com/rdiguglielmo/sec-edgar-financial-pipeline)
— the data engineering half: SEC EDGAR extraction, DuckDB, a dbt star schema, 156 quality checks and
the Parquet export the report reads.

Two repositories because they are two disciplines. That one answers whether the numbers are right;
this one is about how a report is dressed.

The dependency runs one way and only as far as the screenshots: this repository borrowed that report
because a theming system needs something real to be judged on. No code here imports anything from
there, and `theme-lab/` names no report at all — every path, field and measure it touches comes from
`project.config.mjs`.

## Licence

[MIT](LICENSE). The screenshots show public-domain SEC filing data.
