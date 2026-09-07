# Theme Lab

A small set of scripts that build Power BI themes from a short list of design decisions,
register them into a report, and check them.

This README is written for someone who has not done this before. It assumes you know your
way around Power BI Desktop but not around theme JSON, and it explains the whole idea from
the beginning. It is also deliberately generic: nothing below depends on the report this
folder currently sits next to, and the last section covers lifting it into another repo.

---

## Contents

1. [What a theme actually is](#1-what-a-theme-actually-is)
2. [Why we generate the file instead of writing it](#2-why-we-generate-the-file-instead-of-writing-it)
3. [The files, one by one](#3-the-files-one-by-one)
4. [What `build.mjs` does, step by step](#4-what-buildmjs-does-step-by-step)
5. [The everyday loop](#5-the-everyday-loop)
6. [The harness page](#6-the-harness-page)
7. [The contrast check, in plain terms](#7-the-contrast-check-in-plain-terms)
8. [Four rules that keep it working](#8-four-rules-that-keep-it-working)
9. [Starting a new project, step by step](#9-starting-a-new-project-step-by-step)
10. [Where the report itself gets designed](#10-where-the-report-itself-gets-designed)
11. [Keep it simple: what not to build](#11-keep-it-simple-what-not-to-build)
12. [When something looks wrong](#12-when-something-looks-wrong)

---

## 1. What a theme actually is

Open a report with forty visuals. Each one has its own formatting pane with dozens of
settings: font, font size, text colour, background, border, corner radius, gridlines, axis
labels, padding. If you set those by hand you are making well over a thousand small choices,
and you are making them one visual at a time.

Three things go wrong when you do that:

- **Drift.** The card on page one ends up 11pt and the card on page three ends up 12pt,
  because you set them a week apart.
- **Changing your mind is expensive.** "Make the accent a bit darker" means visiting every
  visual that uses it.
- **Nothing is written down.** The design lives in the file, not in a decision you can read.

A **theme** is a single JSON file that answers those questions once, for every visual in the
report at the same time. It says things like "all chart axis labels are 9pt in this grey",
"all visual containers have a white background, a 1px border in this colour, and 12px
rounded corners", "the chart colour sequence is these eight colours in this order".

Power BI reads that file and applies it everywhere. You stop formatting visuals and start
making design decisions.

### What a theme reaches, and what it does not

This trips everyone up at first, so it is worth stating plainly.

**A theme reaches** every visual's formatting: fonts, text colours, backgrounds, borders,
chart colours, gridlines, axis labels, table styling, slicer styling, button styling.

**A theme does not reach:**

| Thing | Why | What we do instead |
|---|---|---|
| The page canvas colour | It is a page property, and the page does not inherit the theme's structural background | `build.mjs` writes it into every `page.json` for you |
| The filter pane | Same reason | Also written into `page.json` by `build.mjs` |
| Anything you hardcoded on a visual | An explicit colour on a visual always beats the theme | Don't hardcode colours — see [rule 1](#8-four-rules-that-keep-it-working) |
| Colours inside a DAX-generated image | Those are text inside a formula; the theme has no way in | See [section 10](#10-keep-it-simple-what-not-to-build) |

---

## 2. Why we generate the file instead of writing it

You could write the theme JSON by hand. Here is why we don't.

**It is long.** The file this folder produces is just over 26,000 characters, built from a
token file of about 200 lines. Almost all of that expansion is repetition: the same handful
of colours restated across dozens of visual types and their sub-objects.

**The property names are not guessable.** Power BI's internal names rarely match what the
formatting pane calls them. The toggle labelled "Smooth line" is `interpolationSmooth`, and
it takes `monotoneX` or `cardinal` rather than true or false. "Corner radius" on a button is
`roundEdge`, and it does nothing until you also set `tileShape`. Getting one wrong usually
produces no error at all — the property is just silently ignored.

**Variants must stay in step.** A light theme and a dark theme should differ only in which
colour each role points at. If they are two hand-written files, they drift apart, and you
discover it when something is invisible on one of them.

So we split the problem in two:

```
tokens.mjs   →   theme.mjs   →   a big theme JSON file
(decisions)      (expression)    (what Power BI reads)
```

- **Tokens** are the roughly twenty-five decisions you actually make. "The accent is this
  blue. Cards sit on white. Body text is this near-black. Corners are 12px."
- **The builder** turns those into the thousands of lines Power BI expects, putting each
  token wherever it belongs.

Change one token, rebuild, and every place that used it updates together. That is the whole
idea. If you have met CSS variables, it is the same thought.

---

## 3. The files, one by one

### `tokens.mjs` — the one you actually edit

Your design decisions, as named values. Each theme is an object with a colour set, a type
scale, corner radii and a chart colour sequence.

```js
export const perfLight = {
  id: 'perf-light',
  label: 'Performance Light',
  polarity: 'light',
  color: {
    canvas:        '#F3F4F8',  // the page background
    surface:       '#FFFFFF',  // cards sit on this
    line:          '#E4E7EC',  // borders
    textPrimary:   '#26282C',  // body text
    textSecondary: '#565D68',  // labels, axis text
    accent:        '#3B82F6',  // charts and accent marks
    accentStrong:  '#2563EB',  // wherever WHITE TEXT sits on the fill
    // ...
  },
  radius: { visual: 12, control: 8 },
  series: ['#3B82F6', '#0EA5A5', /* ...eight in all */],
};
```

Two things in there are worth understanding, because they are design decisions rather than
plumbing:

**Colours are named by ROLE, not by appearance.** The token is called `surface`, not
`white`. In the dark theme `surface` is a mid blue-grey. Because the builder only ever asks
for "the surface colour", both themes work without the builder knowing anything about light
or dark.

**`accent` and `accentStrong` are two different tokens on purpose.** A colour needs more
contrast to carry small white text than it needs to be a bar in a chart. `#3B82F6` is fine
as a chart colour and not fine behind 9pt white button text. `accentStrong` is the darker
version used wherever text sits on top of the fill. Keeping them separate is what lets the
contrast check pass without making the charts muddy.

### `theme.mjs` — the builder

One function that takes a token set and returns the theme JSON. This is where every Power BI
property name lives.

You edit this file when you want to **theme something you have not themed before** — "I want
slicer headers styled", "buttons should have rounded corners". You do not edit it to change
a colour; that is `tokens.mjs`.

Because there is one builder for every theme, all your themes are structurally identical by
construction. They cannot drift.

> **Look property names up, don't remember them.** If you have the Power BI authoring CLI
> installed, `powerbi-report-author formatting describe-object <visualType> <object>` lists
> every property and its type. The comments in `theme.mjs` note the places where that output
> is misleading.

### `build.mjs` — the one command you run

Builds the project's theme, installs it into the report, checks it. Takes no arguments: it
reads which theme from the config. See [section 4](#4-what-buildmjs-does-step-by-step).

```bash
node theme-lab/build.mjs
```

### `harness.mjs` — makes the test page

Generates a page containing one of every visual type worth theming, so you can look at a
theme instead of imagining it. See [section 6](#6-the-harness-page).

### `../project.config.mjs` — the one you edit per project

Not in this folder, on purpose. It holds the four paths, the one theme id, the canvas size,
and the fields the harness borrows. **Everything in this folder reads from it, and nothing in
this folder names a report.** That is what lets the folder be copied into another repository
without opening a single file inside it.

If you ever find yourself editing a path inside `theme-lab/`, the value belongs in the config
instead.

### What is NOT in this folder

Page generators — the scripts that decide which pages exist and what is on them. Those are
specific to one report and live in `../pages/`. See
[section 10](#10-where-the-report-itself-gets-designed).

---

## 4. What `build.mjs` does, step by step

Running one command does seven things. Most of them exist because of a specific way Power BI
will otherwise waste your afternoon.

**1. Builds the theme JSON** from the token set named by `theme` in the config.

**2. Writes it under a brand-new filename** with a random suffix, like
`perf-light-42c9ff4b.json`.

This is the important one. **Power BI Desktop caches themes by filename.** If you edit a
theme file in place and keep the name, Desktop keeps showing you the *old* theme no matter
how many times you reload. Nothing errors. You change a colour, reload, see no change, and
conclude the theme system is broken.

Rotating the filename on every build sidesteps the cache completely. This single behaviour is
the main reason this is a script and not a hand edit.

**3. Deletes the previously generated theme**, so only one is on disk and there is never a
question about which file is live.

**4. Rewires the four places the report names the theme.** A new filename is useless if the
report still points at the old one, and the name appears in four places that must agree:

- the theme JSON's own internal `name` (which must equal the filename, `.json` included)
- `report.json` → `themeCollection.customTheme.name`
- `report.json` → the resource package item's `name`
- `report.json` → the resource package item's `path`

**5. Stamps the page canvas and filter pane into every `page.json`**, because those do not
inherit from the theme (see the table in section 1).

**6. Runs a contrast check** and prints it. See [section 7](#7-the-contrast-check-in-plain-terms).

**7. Validates the report** and prints the error count.

A normal run ends with `all scored pairs pass` and `errors 0`. One warning about a schema
that could not be downloaded is expected and harmless — the validator fetches schemas from
the internet and carries on without them.

---

## 5. The everyday loop

Once Power BI Desktop has the project open, changing the design is a three-step loop that
takes seconds.

**Change a decision:**

```bash
node theme-lab/build.mjs
```

**Tell Desktop to re-read the files:**

```bash
powerbi-desktop reload --pid <the Desktop process id>
```

**Look at it:**

```bash
powerbi-desktop screenshot <page-id> --pid <pid> --output shot.png
```

Then repeat. Edit a token, rebuild, reload, look.

Two things about this loop:

- **Reload is not refresh.** Reload makes Desktop re-read the report files. Refresh reloads
  *data* from the source, takes far longer, and is not what you want here. Only model
  changes need a refresh, and those need Desktop closed and reopened first.
- **Screenshots can be taken before the render finishes.** If a visual comes back blank,
  take the screenshot again before you start debugging. This is common and it will fool you
  at least once. The blank case is the kind one; the half-rendered case is worse. A matrix
  and a table are the slowest visuals on a page, and caught mid-render they come back with
  their rows present but washed out — which looks exactly like a contrast bug in the theme,
  not like a race. Give the page a few seconds after the reload and take it again.

---

## 6. The harness page

You cannot judge a theme by reading JSON. You need to see it on real visuals.

`harness.mjs` generates a page with one of every visual type worth theming — cards, bar,
column and line charts, a table, a matrix, all three kinds of slicer, a text box, a shape, a
button, an image. Build a theme, look at the harness, and you can see immediately that the
table header is too light or the card border has vanished.

It also works as a regression test. Swap to another theme, look at the same page, and
anything that fails to change is something you hardcoded by mistake.

> **The one rule for this page: no hardcoded colours on it, ever.**
>
> The harness is only meaningful if everything on it takes its colour from the theme. The
> moment one visual has a colour set directly on it, that visual stops responding to theme
> swaps — and because it still looks fine in the theme you built it in, you will not notice.
> A harness with a hardcoded colour is not a weaker test; it is a test that lies to you.

Structural settings on the harness are fine — which field a chart uses, whether a title
shows, how things are aligned. It is specifically **colour** that must always come from the
theme.

---

## 7. The contrast check, in plain terms

Every build prints a table like this:

```
ok   text secondary on surface       #565D68 on #FFFFFF   6.64:1  min 4.5
ok   accent as text on surface       #3B82F6 on #FFFFFF   3.68:1  min 3
info surface vs canvas               #FFFFFF on #F3F4F8   1.10:1  separation only
```

**Contrast ratio** measures how different two colours are in brightness. 1:1 is identical
and invisible; 21:1 is black on white. The accessibility guidelines (WCAG) set minimums:

- **4.5:1 for text.** Below this, ordinary body text is hard to read for a lot of people —
  and not only people with a diagnosed impairment. It also covers a laptop screen in
  sunlight and a projector in a bright room.
- **3:1 for graphics.** A chart bar or a status dot needs to be distinguishable, but it does
  not need to be as strong as text.

The check runs on the pairs that actually occur in the design — this text colour on that
background — and fails the build's report if any of them fall short.

Some rows are marked `info` and never scored. A gridline is *supposed* to be nearly
invisible; holding it to a text threshold would be inventing a rule rather than applying one.
Those rows are printed so you can see the number, not judged.

**Why bother:** it catches the mistake that is genuinely hard to see by eye. A grey that
looks fine on your monitor can be well under the threshold. Two of the greys sampled from a
professional reference dashboard failed, and were darkened here to pass while keeping the
same relationship between them.

---

## 8. Four rules that keep it working

**1. Never hardcode a colour on a page or a visual.**

This is the rule everything else depends on. A colour set directly on a visual overrides the
theme permanently, and you find out three themes later.

Structural settings are fine — which field, show or hide, alignment, padding, orientation.
The rule is specifically about colour.

Need a card-style panel behind some content? Turn the background **on** without naming a
colour. It then resolves from the theme, and it re-themes correctly.

**2. Always run `build.mjs` last.**

If any other script regenerates a page, it rewrites that `page.json` from scratch and drops
the canvas and filter-pane settings that `build.mjs` put there. Run the page generator first,
`build.mjs` second. Get it backwards and the page renders on a default grey canvas and you
will not know why.

**3. Never edit the generated theme JSON directly.**

It is output. Your next build overwrites it, and because of the filename cache you may not
even see your edit take effect in the meantime. Edit `tokens.mjs` or `theme.mjs`.

**4. Look at every change.**

Reload and screenshot. Do not reason about whether a property worked. A surprising number of
Power BI formatting properties fail silently — no error, no warning, a clean validation, and
no visible effect. The only reliable detector is your eyes.

---

## 9. Starting a new project, step by step

This is the whole procedure, written so that someone who has never opened any of these files
can follow it. **One project, one theme, one PBIP.**

Nothing inside `theme-lab/` names a report, a theme, or a location on your disk. That is
deliberate: it means you copy the folder into a new project and never open anything inside
it. Everything specific to *your* project goes in one file that sits outside the folder.

### What you need first

- **Node.js installed.** Type `node --version` in a terminal; if you get a version number you
  are fine. There is nothing to install beyond that — these scripts use only what Node ships
  with.
- **A PBIP project** — a Power BI file saved in the "Power BI project" format, which produces
  a `.pbip` file plus two folders beside it.
- Optionally the Power BI authoring CLI, for the validation step at the end. Without it, add
  `--no-validate` to the build command and everything else still works.

### The shape you are aiming for

```
powerbi/
  project.config.mjs          the ONLY file you edit per project
  <name>.pbip                 the file you double-click to open Power BI
  <name>.Report/              how the report LOOKS - pages, visuals, theme
  <name>.SemanticModel/       the DATA - tables, relationships, measures
  theme-lab/                  copied here unchanged, never edited per project
      tokens.mjs  theme.mjs  build.mjs  harness.mjs  README.md
  pages/                      this report's page generators - see section 10
```

Power BI creates the first four for you when you save as a PBIP. You add the last two.

---

### Step 1. Copy `theme-lab/` into the new project

Copy the whole folder — all five files. Do not rename them, and **do not open anything
inside**.

*Why not?* Because the moment you edit a file in here to suit one project, this folder stops
being the same folder in every project. Next time you copy it you will not remember which
version you took. Keeping it untouched is what makes it reusable.

The one exception is `tokens.mjs`, which is where colours live. You will edit that when you
design a theme — but you edit it as a *design* decision, not a project setting.

### Step 2. Copy `project.config.mjs` one level up

Not into `theme-lab/`. One level above it, beside the `.pbip` file:

```
powerbi/
  project.config.mjs     <- HERE
  theme-lab/             <- not in here
```

*Why does the position matter?* The scripts look for it at exactly `../project.config.mjs` —
"one folder up from me". Put it inside `theme-lab/` and they will not find it.

*Why outside at all?* Because `theme-lab/` is the part you copy between projects. A file
naming *this* report has no business inside the folder you are trying to keep generic.

### Step 3. Fill in the folder names

Open `powerbi/project.config.mjs` in any text editor. Near the top:

```js
  reportDir: 'sec-edgar-financial.Report',
  semanticModelDir: 'sec-edgar-financial.SemanticModel',
```

**Yes — you just type the new names between the quotes.** Nothing else.

These are **folder names, not paths.** They mean "the folder called this, sitting next to me".
So if your Power BI file is `quarterly-sales.pbip`, Power BI will have created
`quarterly-sales.Report` and `quarterly-sales.SemanticModel` beside it, and you write exactly
those two names:

```js
  reportDir: 'quarterly-sales.Report',
  semanticModelDir: 'quarterly-sales.SemanticModel',
```

Then, a little further down:

```js
  parquetDir: 'output/parquet',
```

This one is measured from the **top of the repository**, not from the config file, because
the data usually lives well away from the Power BI folder. `output/parquet` means "starting
at the top of the repo, go into `output`, then into `parquet`".

#### "What if the root gets changed?"

Good question, and the answer is reassuring. There are two kinds of location in this system.

**Relative locations — everything in the config.** These say "the folder next to me" or
"counting from the top of the repo". They never mention a drive letter or a username. You can
move the whole project to another folder, another drive, or another computer, and **you
change nothing**. Every one of them still points at the right place, because they are
described in terms of each other rather than in terms of your disk.

**One absolute location — and only one.** The semantic model has to tell Power Query where
the data files are, and Power Query will only accept a full path like
`C:\Users\roman\...\output\parquet\`. There is no way around this: Power Query has no way to
ask "which folder am I in?" — the function simply does not exist. So that one value **does**
break when the project moves.

The fix is one command, run from the top of the repo:

```bash
node powerbi/set-parquet-folder.mjs
```

That script works out where it is sitting on disk, builds the correct full path from that,
and rewrites the single line in the model. Run it with Power BI Desktop **closed**. If the
path was already right it says so and changes nothing, so it is safe to run any time.

A rule of thumb covering both cases:

| What you changed | What to do |
|---|---|
| Moved or renamed anything **above** the `powerbi` folder — moved the repo, cloned it, new machine | Run `node powerbi/set-parquet-folder.mjs` |
| Renamed a folder **inside** `powerbi` — e.g. renamed the report | Update the name in `project.config.mjs` |
| Moved where the data files live | Update `parquetDir`, then run the script above |

### Step 4. Choose your one theme

**File:** `powerbi/project.config.mjs`
**Line 26.** It currently reads:

```js
  theme: 'perf-light',
```

Change the text between the single quotes. That is the entire change:

```js
  theme: 'orchard',
```

Keep the quotes and the comma. Only the word inside changes.

**What can go there?** Only a theme that exists. To see the list, open
`theme-lab/tokens.mjs` and look at the very last line of the file:

```js
export const themes = { 'perf-light': perfLight, 'perf-dark': perfDark, orchard };
```

The valid values are the names on the left of each colon — so right now: `perf-light`,
`perf-dark`, `orchard`. If you type something that is not in that list, the build stops
immediately and tells you, rather than producing a broken report.

> **Why only one?** A Power BI report cannot change its theme while somebody is looking at
> it. Not with a slicer, not with a button, not with a bookmark. The page background is a
> fixed value stored in the file, and a page has no query behind it, so there is nothing for
> a viewer's click to act on. Building machinery to hold several themes would be paying real
> complexity for a flexibility nobody can ever use.
>
> If you want the same report in a second look, **copy the whole project folder and change
> this one line in the copy.** You then open both in two windows side by side, which is also
> a far better conversation with a client than one file trying to be two things.

### Step 5. Point the harness at four of your own fields

The harness is a single test page carrying one of every kind of visual — cards, bar chart,
line chart, table, matrix, three kinds of slicer, a button. Its job is to let you *look* at a
theme instead of imagining it from JSON.

For those visuals to draw anything, they need some data. The harness does not care what the
data means — it only needs something of roughly the right **shape** in each slot. So the four
slots are named after the shape they need, not after any business meaning:

```js
    fields: {
      category:  ['dim_company', 'company_name', 'Company'],
      timeline:  ['dim_date', 'calendar_year', 'Year'],
      list:      ['dim_statement', 'statement_name'],
      fewValues: ['dim_account', 'period_type'],
    },
```

**How to read one of those lines.** Each is a list of two or three pieces:

```js
[ 'dim_company' , 'company_name' , 'Company' ]
   table name      column name      label shown on screen (optional)
```

So `['dim_company', 'company_name', 'Company']` means *"the column `company_name`, in the
table `dim_company`, and write **Company** above it"*. Drop the third piece and Power BI uses
the raw column name.

**What each slot needs, with examples:**

| Slot | What it needs and why | This project uses | A sales model might use |
|---|---|---|---|
| `category` | Around ten distinct values. It fills the bar chart, the table and the matrix rows. Fewer than about five looks empty; many more and the bar chart scrolls in your screenshot. | Company name | Region, or Product Category |
| `timeline` | Something with a natural order, for the column and line charts. A year or a month works; a text field does not, because the line would wander. | Calendar year | Order Year, or Month |
| `list` | About eight distinct values, for the tall list slicer. | Statement name | Sales Channel, or Country |
| `fewValues` | Two or three values only, for the small tile slicer. Give it twenty and the tiles shrink to nothing. | Period type | Online / In-store |

Just below, three measures:

```js
    measures: {
      primary:   '# Financial Facts',
      secondary: '# Filings',
      tertiary:  '# Companies',
    },
```

`primary` is the main number — it drives the bar chart and the line chart. `secondary` drives
the column chart and appears in the table. `tertiary` only appears on the cards. Any three
measures that exist in your model will do; use your biggest, most-used number as `primary`.

For a sales model these might be `'$ Sales Amount'`, `'# Orders'`, `'# Customers'`.

> **Where do I find my field and measure names?** Open the PBIP in Power BI Desktop and look
> at the Data pane on the right. Table names are the headings, column names are the items
> underneath, and measures are the ones with a calculator icon. Type them exactly as shown,
> including spaces, capitals, and symbols like `#` or `$`.

### Step 6. Generate the harness page

Open a terminal in the `powerbi` folder and run:

```bash
node theme-lab/harness.mjs
```

It prints a list of the visuals it placed and their positions. Nothing has been styled yet.

### Step 7. Build the theme

```bash
node theme-lab/build.mjs
```

**No arguments.** It reads which theme to use from line 26 of your config.

*What it just did:* turned your colour decisions into the several-thousand-line file Power BI
expects, saved it under a brand-new filename, rewired the four places the report refers to
that filename, stamped the page background onto every page, checked every colour pair for
readability, and validated the report.

A clean run ends with:

```
  all scored pairs pass.
  result succeeded   errors 0   warnings 0
```

If it says `contrast failure`, two of your colours are too close together to read. Darken the
text colour or lighten the background in `tokens.mjs` — do not lower the threshold.

> **Always run this LAST.** If you later add page generators (section 10), they must run
> *before* this command. A page generator rewrites its page from scratch and throws away the
> background colour this step stamped on. Run them in the wrong order and your page appears
> on a default grey background, with no error message anywhere to explain why.

### Step 8. Open it and look at it

Open the `.pbip` file in Power BI Desktop and refresh the data. Then look at the harness page.

**This step is not optional.** A surprising number of Power BI formatting settings fail
silently — no error, no warning, a clean validation, and no visible effect on screen. Your
eyes are the only reliable detector.

If a visual comes back blank, wait a moment and look again. Power BI often has not finished
drawing, and this will fool you at least once.

### Step 9. Adjust and repeat

Change a colour in `theme-lab/tokens.mjs`, then run steps 7 and 8 again. Each loop takes
seconds.

**Colours are only ever changed in `tokens.mjs`.** Never in the theme file the build
produces — that is output, and your next build overwrites it. And never directly on a visual,
which would override the theme permanently and quietly.

### Step 10. Now design the actual report

Everything so far produced a *look*. None of it decided which pages exist or what is on them.
That is a separate layer — see [section 10](#10-where-the-report-itself-gets-designed).

---

### While designing: trying the other themes and picking one

`tokens.mjs` ships six: `perf-light`, `perf-dark`, `orchard`, `ledger`, `graphite` and
`cypress`. Only one can be registered at a time, so comparing them means building each in
turn and looking at the same pages.

**Build any of them without changing what the project ships:**

```bash
node theme-lab/build.mjs --use graphite
```

#### The loop, start to finish

**1. Open the report in Desktop and refresh the data once.** Only once — the data does not
change between themes, and a refresh takes far longer than a reload.

**2. Get the process id.** It changes every time Desktop restarts, so read it, do not
remember it:

```bash
powerbi-desktop status
```

**3. For each theme: build, reload, look.**

```bash
node theme-lab/build.mjs --use ledger
powerbi-desktop reload --pid <pid>
powerbi-desktop screenshot-all --pid <pid> --output-dir shots/ledger
```

**Reload, never refresh.** Refresh reloads data from the source and is not what a theme
change needs. And if a visual comes back blank, take the shot again before concluding
anything — screenshots regularly race the render.

The page ids, so you do not have to go digging in `pages.json` for them:

| Page | Id |
|---|---|
| Executive Overview | `e1a2b3c4d5e6f7081920` |
| Company Comparison | `f2b3c4d5e6f708192021` |
| Data Confidence | `a3c4d5e6f70819202122` |

`screenshot-all` captures all three; `screenshot <page-id>` captures one.

**4. Put the project back when you are done looking:**

```bash
node theme-lab/build.mjs
```

#### What `--use` does and does not leave alone

`--use` does not touch `project.config.mjs`, so it cannot change what the project ships by
accident. **It does change the working tree**, and the earlier wording here implied
otherwise. Every build, `--use` or not:

- writes a new theme file under a fresh GUID and **deletes the previous one**
- rewrites all three theme references in `report.json`
- re-stamps the canvas colour into every `page.json`

So trying three themes leaves a dirty repository. That is expected and harmless. The plain
`node theme-lab/build.mjs` in step 4 restores the project's own theme — but note it also
rotates the GUID, so even going back to where you started produces a diff. Nothing is wrong;
the filename is a cache-busting device, not a version.

#### Shipping the one you chose

Change the single `theme:` line in `../project.config.mjs`, build once with no arguments,
then look at the pages one last time before committing.

> **Stage the theme file by its NEW name.** The GUID rotates on every build, so staging the
> name you saw earlier commits a reference to a file that is not in the repository — the
> report then points at a theme nobody else can load. This has happened here. Two lines
> settle it, and they must name the same file:
>
> ```bash
> git ls-tree -r HEAD --name-only | grep RegisteredResources
> git show HEAD:<report-dir>/definition/report.json | grep -o "[a-z-]*-[a-f0-9]\{8\}.json"
> ```

---

## 10. Where the report itself gets designed

Everything above is report-agnostic: it produces a design *system* and proves it on a test
page. None of it decides which pages exist or what is on them. That is a separate layer, and
it lives outside this folder.

| Layer | Where | Reusable? | Answers |
|---|---|---|---|
| Design system | `theme-lab/tokens.mjs` + `theme.mjs` | any report | what does *any* visual look like |
| Installer | `theme-lab/build.mjs` | any report | get the theme in without Desktop caching it |
| Proof surface | `theme-lab/harness.mjs` | any report | does the system actually look right |
| **The report** | **`pages/*.mjs`** | **no, by nature** | **which pages, which visuals, where** |

**One generator script per page**, in `../pages/`. `harness.mjs` is the working template for
one: it already carries the `add(visualType, position, body)` helper, the `measure()` and
`column()` field builders, the grid, and the code that writes `page.json` and registers the
page in `pages.json`. A page generator is that skeleton with a curated list of visuals
instead of one of everything.

**A page generator sets no colours at all.** Only structure: which field, which position,
show or hide, titles, display units. Every colour arrives from the theme at render time.
That is what makes the finished report re-themable by editing one token.

**The order is not negotiable:**

```bash
node pages/01-executive-overview.mjs     # generator FIRST
node theme-lab/build.mjs                 # build LAST
powerbi-desktop reload --pid <pid>       # then look
```

Backwards, and the generator wipes the canvas stamp `build.mjs` wrote. The page then renders
on a default grey background with no error anywhere to tell you why.

### What a page generator actually looks like

Stripped to its bones, this is a whole page — a title, a KPI card, and a ranked bar chart:

```js
// pages/01-executive-overview.mjs
import { project } from '../project.config.mjs';

add('textbox', { x: 32, y: 32, width: 900, height: 48 }, textbox([
  { value: 'Executive Overview',
    textStyle: { fontFamily: 'Segoe UI Variable Display', fontSize: '28px' } },
]));

add('cardVisual', { x: 32, y: 104, width: 920, height: 152 }, {
  query: { queryState: { Data: { projections: [
    measure('$ Annual Consolidated Value'),
    measure('# Companies'),
  ] } } },
});

add('barChart', { x: 32, y: 272, width: 920, height: 320 }, {
  query: { queryState: {
    Category: { projections: [column('dim_company', 'company_name', 'Company')] },
    Y:        { projections: [measure('$ Annual Consolidated Value')] },
  } },
});
```

Three things to notice, because they are the whole discipline:

**Every line is either a position or a field.** `x`, `y`, `width`, `height` say where; the
`projections` say what data. That is the entire vocabulary of report design here.

**There is not a single colour anywhere.** No hex code, no colour name, nothing. The card's
background, its border, the bar colour, the title's typeface and size — all of it arrives
from the theme when Power BI draws the page. This is what lets you change one value in
`tokens.mjs` and have the whole report follow.

**It reads like the page looks.** Title at the top, cards under it, chart under those, with
the `y` values climbing. Someone can read the file and picture the page.

Structural settings *are* allowed and often necessary — which field, whether a title shows,
how a table sorts, what the display units are. The rule is only ever about colour.

---


## 11. Keep it simple: what not to build

This section exists because the project this folder came from built something more
complicated than it needed, and it is worth writing down so nobody repeats it.

### The temptation

DAX can generate an **SVG** — an image described in text — and Power BI will display it. That
lets you draw marks Power BI has no native version of: lollipop charts, progress rings,
pill-shaped table cells.

The catch is that the colours inside that image are just text inside a formula. The theme
cannot reach them. Swap from a light theme to a dark one and your carefully drawn mark stays
resolutely light-mode, because nothing told it otherwise.

So it is very tempting to build machinery to fix that: a hidden table holding the palette, a
lookup wrapped around every colour in every formula, and a hidden filter pinning the right
row. It works. It is also a lot of moving parts.

### Why it is not worth it

**A Power BI report cannot change its theme at runtime.** Not with a slicer, not with a
button, not with a bookmark. The page background is a fixed value in the file, and a page has
no query behind it, so there is nothing for a user's selection to act on.

Which means: if the whole report cannot change appearance while someone is looking at it,
there is no benefit to one image inside it being able to. You are paying real complexity for
a flexibility nobody can ever use.

That complexity is not free. Every colour becomes a lookup instead of a value. Every formula
gets longer and harder to read. The hidden table is part of the data model, so touching it
means closing Power BI Desktop, reopening and refreshing — minutes, every time.

### What to do instead

**One project, one theme, colours written as plain values in the formula.**

```
VAR _Accent = "rgb(59,130,246)"
```

If you later need the same report in a different look, build a second copy and change that
line. Changing a handful of literals in one file, once, beats maintaining a lookup system
forever.

### And before you reach for a DAX image at all

Ask whether Power BI already has something close enough. A generated image is a **picture**,
and it gives up more than people expect:

- no tooltips
- no cross-filtering — clicking it does nothing
- no conditional formatting
- **no sorting** — turn a table's numeric column into an image and it becomes a text string
  of markup; sorting it sorts the markup, which is meaningless
- nothing for a screen reader

For a signature mark on one hero page, that trade can be worth it. For a column somebody
needs to sort, rank or interrogate, it is not. A slightly plainer native visual that works
properly beats a beautiful one that does not.

### Two rules if you do use one

1. **Colours must be written as `rgb(r,g,b)`, never as escaped hex.** Hex fails in a way
   that will genuinely mislead you: the text still draws, and every stroked line silently
   disappears. It looks like a layout bug, not a colour bug.
2. **A generated image needs to be told its size.** In a table cell you must set both a width
   and a height. Set only the height and wide artwork is squeezed to a few pixels tall —
   perfectly correct and completely unreadable.

---

## 12. When something looks wrong

| What you see | What it usually is |
|---|---|
| Changed a colour, reloaded, nothing happened | The theme filename did not change. Always go through `build.mjs`; never edit the generated JSON. |
| The page background is grey / not your canvas colour | A page generator ran after `build.mjs` and dropped the canvas stamp. Run `build.mjs` again, last. |
| One visual ignores every theme swap | It has a colour set directly on it. Find and delete that colour — no replacement needed; removing it lets the theme through. |
| A property you set does nothing at all | Very common, and usually the value's *type* is wrong rather than the name. Several Power BI properties documented as text actually want a number. When a whole visual goes blank rather than merely unstyled, suspect this first. |
| A visual is blank right after a reload | Take the screenshot again. Renders are often still in progress. |
| A matrix or table is legible but washed out, and only in some themes | The same race, one stage later: the visual was caught mid-render. It reads as a contrast bug, which is what makes it expensive. Wait a few seconds after the reload and recapture before changing a single token. |
| Text is invisible in the dark theme | A colour token is missing from that theme, so it fell back to a default that matches the background. Check the token set has every role the other one has. |
| The build reports a contrast FAIL | Two colours are too close. Darken the text token or lighten the background token — do not lower the threshold. |
| Validation reports a schema warning | Expected. The validator downloads schemas from the internet and continues without them. `errors 0` is what matters. |

---

## The shortest possible summary

Design decisions live in `tokens.mjs`. Project wiring lives in `../project.config.mjs`, and
is the only thing you edit per project. One command turns the decisions into a theme,
installs it, and checks it. A test page lets you see the result. The report's own pages are a
separate layer in `../pages/`.

Never hardcode a colour, always run the build last, and look at every change rather than
trusting that it worked.

One project, one theme, one PBIP. Keep it simple.
