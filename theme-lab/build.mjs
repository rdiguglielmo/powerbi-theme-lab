#!/usr/bin/env node
//
// Build, register and validate this project's theme.
//
//   node theme-lab/build.mjs                    the project's own theme. Use this one.
//   node theme-lab/build.mjs --use perf-dark    try another, without changing the project
//   node theme-lab/build.mjs --no-validate      skip the PBIR validator
//
// Which theme the project ships is named ONCE, in ../project.config.mjs. Nothing
// in this folder names the report, the theme or a path - lift it into another
// repository unchanged and point that project's config at it.
//
// ALWAYS RUN THIS LAST. A page generator rewrites its page.json from scratch and
// drops the canvas stamp that step 5 below writes.
//
// One command does the whole cache-bust dance, because Power BI Desktop caches
// themes BY FILENAME. Editing a theme file in place leaves Desktop showing the old
// theme even after a reload. So every build writes a new filename with a fresh GUID
// and rewires all references in lockstep:
//
//   1. theme JSON "name"                       (must equal the filename, .json included)
//   2. report.json themeCollection.customTheme.name
//   3. report.json resourcePackages[].items[].name
//   4. report.json resourcePackages[].items[].path
//
// It also stamps the page canvas colour into every page.json, because the page
// canvas does NOT inherit from the theme's structural `background`.
//
// Files are written with fs.writeFileSync(..., 'utf8') - no BOM. PowerShell 5.1's
// Set-Content -Encoding utf8 writes a BOM and the PBIR validator rejects it with
// PBIR_JSON_PARSE_ERROR.

import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';

import { themes } from './tokens.mjs';
import { buildTheme } from './theme.mjs';
import { project } from '../project.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPORT = join(ROOT, project.reportDir);
const RESOURCES = join(REPORT, 'StaticResources', 'RegisteredResources');
const REPORT_JSON = join(REPORT, 'definition', 'report.json');
const PAGES_DIR = join(REPORT, 'definition', 'pages');

const THEME_IDS = Object.keys(themes);

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

// No arguments is the normal case: the project's own theme, named once in
// project.config.mjs. `--use` is for comparing themes while designing, and
// deliberately does NOT change what the project ships.
const argv = process.argv.slice(2);
const useIdx = argv.indexOf('--use');
const id = useIdx >= 0 ? argv[useIdx + 1] : project.theme;
const skipValidate = argv.includes('--no-validate');

if (!id || !themes[id]) {
  const what = useIdx >= 0 ? `--use ${argv[useIdx + 1]}` : `project.theme "${project.theme}"`;
  console.error(`  ${what} is not a theme in tokens.mjs`);
  console.error(`  usage: node theme-lab/build.mjs [--use <${THEME_IDS.join('|')}>] [--no-validate]`);
  process.exit(1);
}

const tokens = themes[id];

// ---------------------------------------------------------------------------
// json helpers - read/write without BOM, stable 2-space indent
// ---------------------------------------------------------------------------

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const writeJson = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------

function luminance(hex) {
  const v = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Thresholds by role:
//   text     4.5  WCAG AA body text
//   graphic  3.0  WCAG AA non-text contrast - chart series, sentiment marks
//   info       -  surface separation and gridlines. Reported, never scored:
//                 a gridline is meant to be nearly invisible, so holding it to an
//                 accessibility threshold would be inventing a rule.
//
// Pairs are the ones that actually occur. Tertiary text lives on visual surfaces
// (axis labels, column headers), never directly on the page canvas, so that pair
// is not checked.
function auditContrast(t) {
  const c = t.color;
  const pairs = [
    ['text primary on surface', c.textPrimary, c.surface, 'text'],
    ['text secondary on surface', c.textSecondary, c.surface, 'text'],
    ['text tertiary on surface', c.textTertiary, c.surface, 'text'],
    ['text primary on canvas', c.textPrimary, c.canvas, 'text'],
    ['text secondary on canvas', c.textSecondary, c.canvas, 'text'],
    ['text primary on surfaceAlt', c.textPrimary, c.surfaceAlt, 'text'],
    ['text secondary on surfaceAlt', c.textSecondary, c.surfaceAlt, 'text'],
    ['text primary on surfaceSunken', c.textPrimary, c.surfaceSunken, 'text'],
    ['text primary on accentSoft', c.textPrimary, c.accentSoft, 'text'],
    ['accentContrast on accentStrong', c.accentContrast, c.accentStrong, 'text'],
    // The nav pill's own pair. It is polarity-dependent - a soft fill with dark
    // text in the light themes, a solid fill with white text in perf-dark - so it
    // is scored here rather than reasoned about once and assumed to hold.
    ['navPillText on navPillFill', c.navPillText, c.navPillFill, 'text'],
    ['accent as text on surface', c.accent, c.surface, 'graphic'],
    ['good on surface', c.good, c.surface, 'graphic'],
    ['bad on surface', c.bad, c.surface, 'graphic'],
    ['neutral on surface', c.neutral, c.surface, 'graphic'],
    ['surface vs canvas', c.surface, c.canvas, 'info'],
    ['line on surface', c.line, c.surface, 'info'],
    ['gridline on surface', c.gridline, c.surface, 'info'],
  ];
  t.series.forEach((s, i) => pairs.push([`series[${i}] on surface`, s, c.surface, 'graphic']));

  const MIN = { text: 4.5, graphic: 3.0 };

  const rows = pairs.map(([label, fg, bg, kind]) => {
    const ratio = contrast(fg, bg);
    const min = MIN[kind];
    return { label, fg, bg, kind, min, ratio, pass: min ? ratio >= min : true };
  });

  const fails = rows.filter((r) => !r.pass);

  console.log(`\n  contrast audit - ${t.label} (${t.polarity})`);
  console.log('  ' + '-'.repeat(70));
  for (const r of rows) {
    const mark = r.kind === 'info' ? 'info' : r.pass ? 'ok  ' : 'FAIL';
    const target = r.min ? `min ${r.min}` : 'separation only';
    console.log(
      `  ${mark} ${r.label.padEnd(31)} ${r.fg} on ${r.bg}  ${r.ratio
        .toFixed(2)
        .padStart(5)}:1  ${target}`
    );
  }
  console.log(
    fails.length
      ? `\n  ${fails.length} contrast failure(s) - see FAIL rows above.`
      : '\n  all scored pairs pass.'
  );
  return fails.length;
}

// ---------------------------------------------------------------------------
// page canvas - PBIR expression encoding, unlike the theme's plain JSON.
// Page background has NO `show` property; adding one is rejected by the schema.
// ---------------------------------------------------------------------------

const litColor = (hex) => ({
  solid: { color: { expr: { Literal: { Value: `'${hex}'` } } } },
});
const litNum = (n) => ({ expr: { Literal: { Value: `${n}D` } } });
const litStr = (v) => ({ expr: { Literal: { Value: `'${v}'` } } });
const litBool = (b) => ({ expr: { Literal: { Value: String(b) } } });

function stampPageCanvas(t) {
  const c = t.color;
  const touched = [];
  for (const entry of readdirSync(PAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const p = join(PAGES_DIR, entry.name, 'page.json');
    if (!existsSync(p)) continue;
    const page = readJson(p);
    page.objects = page.objects || {};

    page.objects.background = [
      { properties: { color: litColor(c.canvas), transparency: litNum(0) } },
    ];
    page.objects.outspace = [
      { properties: { color: litColor(c.canvas), transparency: litNum(0) } },
    ];

    // The filter pane is captured in every screenshot and cannot be collapsed from
    // PBIR, so it has to be themed. It reaches nothing from the theme's structural
    // colours, and the validator rejects outspacePane under visualStyles - so it is
    // stamped here, per page, in PBIR expression encoding.
    page.objects.outspacePane = [
      {
        properties: {
          backgroundColor: litColor(c.surface),
          foregroundColor: litColor(c.textPrimary),
          titleSize: litNum(t.scale.title),
          headerSize: litNum(t.scale.header),
          searchTextSize: litNum(t.scale.smallLabel),
          fontFamily: litStr(t.font.text),
          border: litBool(true),
          borderColor: litColor(c.line),
          checkboxAndApplyColor: litColor(c.accentStrong),
          inputBoxColor: litColor(c.surfaceSunken),
          width: litNum(240),
        },
      },
    ];
    page.objects.filterCard = [
      {
        properties: {
          backgroundColor: litColor(c.surfaceSunken),
          foregroundColor: litColor(c.textSecondary),
          textSize: litNum(t.scale.smallLabel),
          border: litBool(false),
        },
        selector: { id: 'Available' },
      },
      {
        properties: {
          backgroundColor: litColor(c.accentSoft),
          foregroundColor: litColor(c.textPrimary),
          textSize: litNum(t.scale.smallLabel),
          border: litBool(false),
        },
        selector: { id: 'Applied' },
      },
    ];

    writeJson(p, page);
    touched.push(page.displayName || entry.name);
  }
  return touched;
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

const guid = randomBytes(4).toString('hex');
const fileName = `${id}-${guid}.json`;

const theme = buildTheme(tokens);
theme.name = fileName; // must equal the filename exactly, .json included

// Remove every previously generated theme, not just older builds of this id. Only one
// custom theme can be registered at a time, so leaving the other two on disk just
// invites confusion about which file Desktop is actually reading. They regenerate in
// under a second. Hand-written themes (no `<id>-<guid>` shape) are left alone.
const generated = new RegExp(`^(${THEME_IDS.join('|')})-[0-9a-f]{8}\\.json$`);
const stale = readdirSync(RESOURCES).filter((f) => generated.test(f) && f !== fileName);
for (const f of stale) rmSync(join(RESOURCES, f));

writeJson(join(RESOURCES, fileName), theme);

// Rewire report.json - all three references, in lockstep.
const report = readJson(REPORT_JSON);
report.themeCollection.customTheme.name = fileName;

const pkg = report.resourcePackages.find((p) => p.type === 'RegisteredResources');
if (!pkg) throw new Error('report.json has no RegisteredResources package');

// Keep every non-theme resource; replace the CustomTheme entry with this one.
pkg.items = pkg.items.filter((i) => i.type !== 'CustomTheme');
pkg.items.push({ name: fileName, path: fileName, type: 'CustomTheme' });

writeJson(REPORT_JSON, report);

const pages = stampPageCanvas(tokens);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

console.log(`\n  built  ${tokens.label}`);
console.log(`  file   StaticResources/RegisteredResources/${fileName}`);
if (stale.length) console.log(`  removed ${stale.join(', ')}`);
console.log(`  canvas ${tokens.color.canvas} stamped on ${pages.length} page(s): ${pages.join(', ')}`);

const failCount = auditContrast(tokens);

// The validator emits one huge JSON envelope that repeats the absolute file path in
// every diagnostic. Collapse it to one line per distinct problem.
function summariseValidation(raw) {
  let env;
  try {
    env = JSON.parse(raw.trim().split('\n').find((l) => l.trim().startsWith('{')));
  } catch {
    console.log('  ' + raw.trim().slice(0, 400));
    return 1;
  }
  const d = env.data || {};
  console.log(`  result ${d.result}   errors ${d.errorCount}   warnings ${d.warningCount}`);
  const seen = new Set();
  for (const [code, group] of Object.entries(d.diagnostics || {})) {
    for (const item of group.items || []) {
      // strip the trailing ": <absolute path>" the validator appends to every message
      const msg = String(item.message).replace(/: [A-Z]:\\.*$/, '');
      const key = `${code}|${msg}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`  [${group.severity}] ${code}`);
      console.log(`      ${msg}`);
    }
  }
  return d.errorCount || 0;
}

if (!skipValidate) {
  console.log('\n  validate');
  console.log('  ' + '-'.repeat(70));
  let raw;
  try {
    // execSync with a single quoted command string: the CLI is a .cmd shim, and
    // execFileSync cannot spawn it directly on Windows (EINVAL).
    raw = execSync(`powerbi-report-author validate "${REPORT}"`, {
      encoding: 'utf8',
      cwd: ROOT,
    });
  } catch (e) {
    raw = e.stdout || e.message;
  }
  if (summariseValidation(raw) > 0) process.exitCode = 1;
}

if (failCount) process.exitCode = process.exitCode || 2;
