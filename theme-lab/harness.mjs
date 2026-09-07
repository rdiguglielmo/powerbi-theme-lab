#!/usr/bin/env node
//
// Generate the "Theme Harness" page: one of every visual type worth theming, on one
// single page, so themes can be swapped and compared side by side.
//
//   node theme-lab/harness.mjs
//
// Rule for this page: NO inline colour overrides. Every colour must come from the
// theme, or the harness stops telling us anything when we swap themes. The only
// inline formatting here is structural (which field, which mode, which text).
//
// Data roles were checked with `powerbi-report-author catalog describe <type>`:
//   cardVisual           Data
//   barChart/columnChart/lineChart   Category + Y   (both required)
//   slicer/listSlicer/advancedSlicerVisual   Values (required)
//   pivotTable           Rows + Values
//   tableEx              Values
//   textbox/shape/actionButton         no roles at all

import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { project } from '../project.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const PAGES = join(ROOT, project.reportDir, 'definition', 'pages');
const PAGE_ID = project.harness.pageId;
const PAGE_DIR = join(PAGES, PAGE_ID);

// Fields and measures the harness borrows, by the ROLE they play in the layout.
// Nothing below names a field directly - swap them in project.config.mjs.
const F = project.harness.fields;
const M = project.harness.measures;

const VC_SCHEMA =
  'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json';

// ---------------------------------------------------------------------------
// PBIR expression encoding helpers. Visual objects use expression wrappers,
// unlike theme JSON which is plain.
// ---------------------------------------------------------------------------

const lit = (v) => ({ expr: { Literal: { Value: v } } });
const litStr = (s) => lit(`'${s}'`);
const litNum = (n) => lit(`${n}D`);
const litBool = (b) => lit(String(b));

const measure = (name, entity = project.measuresTable) => ({
  field: {
    Measure: { Expression: { SourceRef: { Entity: entity } }, Property: name },
  },
  queryRef: `${entity}.${name}`,
  nativeQueryRef: name,
});

const column = (entity, prop, displayName) => ({
  field: {
    Column: { Expression: { SourceRef: { Entity: entity } }, Property: prop },
  },
  queryRef: `${entity}.${prop}`,
  nativeQueryRef: prop,
  ...(displayName ? { displayName } : {}),
});

// ---------------------------------------------------------------------------
// Grid: four columns, derived from the canvas width in project.config.mjs.
// At the default 1920 this gives 452px columns starting at 32, 500, 968, 1436.
//
// The columns are derived; the vertical bands below are not. The harness is a
// fixed test page, and generalising its rows would buy nothing.
// ---------------------------------------------------------------------------

const MARGIN = 32;
const GUTTER = 16;
const COLS = 4;

const W1 = Math.floor((project.canvas.width - 2 * MARGIN - GUTTER * (COLS - 1)) / COLS);
const W2 = W1 * 2 + GUTTER; // two columns plus the gutter between them
const COL = Array.from({ length: COLS }, (_, i) => MARGIN + i * (W1 + GUTTER));

const visuals = [];
let z = 1000;

function add(visualType, position, body) {
  z += 100;
  const name = `h${String(visuals.length + 1).padStart(2, '0')}${'0'.repeat(14)}`.slice(0, 20);
  visuals.push({
    name,
    json: {
      $schema: VC_SCHEMA,
      name,
      position: { ...position, z, tabOrder: z },
      visual: { visualType, ...body },
    },
  });
}

const textbox = (runs, align = 'left') => ({
  objects: {
    general: [
      { properties: { paragraphs: [{ textRuns: runs, horizontalTextAlignment: align }] } },
    ],
  },
});

// --- Title row -------------------------------------------------------------
// Power BI has NO letter-spacing control. The wide-tracked uppercase in all three
// reference designs can only be faked by typing spaced characters, and only in a
// static textbox like this one. Nothing data-driven can do it.
add('textbox', { x: COL[0], y: 32, width: W2 + GUTTER + W1, height: 64 }, textbox([
  {
    value: 'T H E M E   H A R N E S S',
    textStyle: { fontFamily: 'Segoe UI Variable Display', fontSize: '28px' },
  },
]));

add('textbox', { x: COL[2], y: 40, width: W2, height: 40 }, textbox([
  {
    value: 'faked tracking above  ·  ordinary tracking here  ·  same font, same size',
    textStyle: { fontFamily: 'Segoe UI Variable Small', fontSize: '11px' },
  },
], 'right'));

// --- Band A: card + two slicers --------------------------------------------
// One multi-value cardVisual, never N single-value cards.
add('cardVisual', { x: COL[0], y: 104, width: W2, height: 152 }, {
  query: {
    queryState: {
      Data: {
        projections: [
          measure(M.tertiary),
          measure(M.secondary),
          measure(M.primary),
        ],
      },
    },
  },
});

add('slicer', { x: COL[2], y: 104, width: W1, height: 152 }, {
  query: {
    queryState: {
      Values: { projections: [column(F.category[0], F.category[1])] },
    },
  },
  objects: {
    data: [{ properties: { mode: litStr('Dropdown') } }],
    header: [{ properties: { show: litBool(true), text: litStr('Company (legacy slicer)') } }],
  },
});

// advancedSlicerVisual sits in the short band - it only has two values, so it fits.
// listSlicer moved to the taller band below: at 152px its eight rows overlap.
add('advancedSlicerVisual', { x: COL[3], y: 104, width: W1, height: 152 }, {
  query: {
    queryState: {
      Values: { projections: [column(...F.fewValues)] },
    },
  },
});

// --- Band B: three charts + the modern slicer ------------------------------
add('barChart', { x: COL[0], y: 272, width: W1, height: 280 }, {
  query: {
    queryState: {
      Category: { projections: [column(...F.category)] },
      Y: { projections: [measure(M.primary)] },
    },
    sortDefinition: {
      sort: [
        {
          field: measure(M.primary).field,
          direction: 'Descending',
        },
      ],
      isDefaultSort: false,
    },
  },
});

add('columnChart', { x: COL[1], y: 272, width: W1, height: 280 }, {
  query: {
    queryState: {
      Category: { projections: [column(...F.timeline)] },
      Y: { projections: [measure(M.secondary)] },
    },
  },
});

add('lineChart', { x: COL[2], y: 272, width: W1, height: 280 }, {
  query: {
    queryState: {
      Category: { projections: [column(...F.timeline)] },
      Y: { projections: [measure(M.primary)] },
    },
  },
});

add('listSlicer', { x: COL[3], y: 272, width: W1, height: 280 }, {
  query: {
    queryState: {
      Values: { projections: [column(...F.list)] },
    },
  },
});

// --- Band C: matrix + table ------------------------------------------------
// pivotTable when a table mixes dimensions and measures. tableEx with a dimension
// in Rows renders headers and no data.
add('pivotTable', { x: COL[0], y: 568, width: W2, height: 280 }, {
  query: {
    queryState: {
      Rows: { projections: [column(...F.category)] },
      Values: {
        projections: [measure(M.secondary), measure(M.primary)],
      },
    },
  },
});

// tableEx has ONE data role, Values, of kind GroupingOrMeasure - the dimension and
// the measures all go there. A dimension in a Rows role renders headers and no data.
add('tableEx', { x: COL[2], y: 568, width: W2, height: 280 }, {
  query: {
    queryState: {
      Values: {
        projections: [
          column(...F.category),
          measure(M.secondary),
        ],
      },
    },
  },
  objects: {
    values: [{ properties: { urlIcon: litBool(false) } }],
  },
});

// --- Band D: chrome ---------------------------------------------------------
add('shape', { x: COL[0], y: 864, width: W1, height: 184 }, {
  objects: {
    shape: [{ properties: { tileShape: litStr('rectangle') } }],
  },
});

// actionButton needs the DUAL-ENTRY pattern - one entry with no selector plus one
// with selector.id. With only the selector entry the override is silently dropped.
add('actionButton', { x: COL[1], y: 864, width: W1, height: 56 }, {
  objects: {
    text: (() => {
      const props = { show: litBool(true), text: litStr('CLEAR ALL SLICERS') };
      return [{ properties: props }, { properties: props, selector: { id: 'default' } }];
    })(),
  },
});

add('textbox', { x: COL[3], y: 864, width: W1, height: 184 }, textbox([
  {
    value: 'Body copy at label size. ',
    textStyle: { fontFamily: 'Segoe UI Variable Text', fontSize: '11px' },
  },
  {
    value: 'Semibold run. ',
    textStyle: { fontFamily: 'Segoe UI Variable Text Semibold', fontSize: '11px' },
  },
  {
    value: 'Small optical size for captions.',
    textStyle: { fontFamily: 'Segoe UI Variable Small', fontSize: '9px' },
  },
]));

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

if (existsSync(PAGE_DIR)) rmSync(PAGE_DIR, { recursive: true });
mkdirSync(join(PAGE_DIR, 'visuals'), { recursive: true });

const write = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');

write(join(PAGE_DIR, 'page.json'), {
  $schema:
    'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json',
  name: PAGE_ID,
  displayName: 'Theme Harness',
  displayOption: 'FitToPage',
  height: project.canvas.height,
  width: project.canvas.width,
});

for (const v of visuals) {
  const dir = join(PAGE_DIR, 'visuals', v.name);
  mkdirSync(dir, { recursive: true });
  write(join(dir, 'visual.json'), v.json);
}

// Register the page and make it active so a screenshot lands on it.
const pagesJsonPath = join(PAGES, 'pages.json');
const pagesJson = JSON.parse(readFileSync(pagesJsonPath, 'utf8'));
if (!pagesJson.pageOrder.includes(PAGE_ID)) pagesJson.pageOrder.push(PAGE_ID);
pagesJson.activePageName = PAGE_ID;
write(pagesJsonPath, pagesJson);

console.log(`  wrote Theme Harness page with ${visuals.length} visuals`);
for (const v of visuals) {
  const p = v.json.position;
  console.log(
    `    ${v.json.visual.visualType.padEnd(22)} ${String(p.x).padStart(4)},${String(p.y).padStart(4)}  ${p.width}x${p.height}`
  );
}
