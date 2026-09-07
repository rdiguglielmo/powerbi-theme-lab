// Builds the six-theme gallery page: the three report pages in each of the six
// themes, from the screenshots in ../docs/shots/.
//
//   node gallery/assemble.mjs            LINKED   -> ../docs/index.html
//   node gallery/assemble.mjs --embed    EMBEDDED -> ./theme-gallery.html
//
// Two modes, one generator, one copy of the images on disk.
//
//   LINKED writes <img src="shots/ledger-01.jpg"> and is what GitHub Pages serves
//   from /docs. The browser caches each JPEG separately and defers the ones below
//   the fold, and changing one screenshot changes one file instead of rewriting
//   two megabytes of base64. This is the mode that produces the committed page,
//   so it is the default.
//
//   EMBEDDED inlines every screenshot as a data URI. That is not a style choice:
//   an Artifact's CSP blocks images from every external host, so it is the only
//   way a page there can show a picture. It is also what makes the file work
//   offline, from a USB stick or as a mail attachment. Its output is gitignored -
//   rebuild it when you need it.
//
// Inputs are ../docs/shots/<theme-id>-<page-number>.jpg, produced by conv.ps1.
// Paths are derived from this file's own location, so the folder can be moved.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', 'docs');
const SHOTS_DIR = join(DOCS, 'shots');

const embed = process.argv.slice(2).includes('--embed');

// Palettes are the REAL token values from theme-lab/tokens.mjs, and the ratio is
// primary text against panel, computed with the WCAG formula. Both were checked
// against theme-lab's own contrast audit - Ledger prints 16.16 there too.
// Re-derive them rather than editing a number in by hand if the tokens ever move.
const THEMES = [
  {
    id: 'ledger', label: 'Ledger', shipped: true, ratio: '16.16',
    sw: ['#E6DDCD', '#FBF8F2', '#CFC3AC', '#8C2F39', '#1F1B15'],
    note: 'Warm sand ground, paper panels, oxblood accent. The one that shipped.',
  },
  {
    id: 'perf-light', label: 'Performance Light', ratio: '13.43',
    sw: ['#F3F4F8', '#F3F4F8', '#F3F4F8', '#2563EB', '#26282C'],
    note: 'Flat and borderless: ground, panel and rule are all the same grey, so panels are separated by space alone.',
  },
  {
    id: 'perf-dark', label: 'Performance Dark', ratio: '9.19',
    sw: ['#26313E', '#2C4362', '#3A5578', '#4C93FA', '#F1F5F9'],
    note: 'The only dark theme. Slate ground, steel panels, and a blue that holds up against both.',
  },
  {
    id: 'orchard', label: 'Orchard', ratio: '12.51',
    sw: ['#F5F5F4', '#FCFCFC', '#E3DFDA', '#C96A3A', '#3D2F28'],
    note: 'Near-white paper, soft stone rules, and a terracotta accent that warms the charts.',
  },
  {
    id: 'graphite', label: 'Graphite', ratio: '17.79',
    sw: ['#D6DBE3', '#FFFFFF', '#B9C2CE', '#3730A3', '#14181F'],
    note: 'Cool blue-grey ground against pure white panels, with indigo doing all the work.',
  },
  {
    id: 'cypress', label: 'Cypress', ratio: '16.13',
    sw: ['#DDE3D6', '#F8F9F5', '#C3CBB6', '#16604D', '#191D19'],
    note: 'Sage ground and a deep evergreen accent. The quietest of the six.',
  },
];

const PAGES = [
  {
    n: '01', id: '01', label: 'Executive Overview',
    note: 'One concept across the ten companies: the sector total, the year-on-year move, the ranking, and the three years that carry annual figures.',
  },
  {
    n: '02', id: '02', label: 'Company Comparison',
    note: 'The same concept as a company-by-year matrix. The bottom Total row is the sector figure; the year-total column was taken out on purpose.',
  },
  {
    n: '03', id: '03', label: 'Data Confidence',
    note: 'What the quality layer found, including the ten checks that fail by design, each with the row count it declares beside the count it returned.',
  },
];

// A missing screenshot renders as a broken-image icon and nothing else goes
// wrong, so the absence is checked here, where it can still say so out loud.
const shots = {};
for (const t of THEMES) {
  for (const p of PAGES) {
    const key = t.id + '-' + p.id;
    const src = join(SHOTS_DIR, key + '.jpg');
    if (!existsSync(src)) {
      console.error('  missing screenshot: ' + src);
      process.exit(1);
    }
    shots[key] = embed
      ? 'data:image/jpeg;base64,' + readFileSync(src).toString('base64')
      : 'shots/' + key + '.jpg';
  }
}

const logic = String.raw`
(function () {
  var THEMES = __THEMES__;
  var PAGES = __PAGES__;
  var SHOTS = __SHOTS__;
  var LAZY = __LAZY__;

  var mode = 'theme';
  var themeId = 'ledger';
  var pageId = '01';

  var rail = document.getElementById('rail');
  var railLabel = document.getElementById('rail-label');
  var gallery = document.getElementById('gallery');
  var btnTheme = document.getElementById('mode-theme');
  var btnPage = document.getElementById('mode-page');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }

  function renderRail() {
    rail.textContent = '';
    railLabel.textContent = mode === 'theme' ? 'Theme' : 'Page';
    var items = mode === 'theme' ? THEMES : PAGES;
    items.forEach(function (it) {
      var active = mode === 'theme' ? it.id === themeId : it.id === pageId;
      var b = el('button', 'chip');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(active));

      var top = el('div', 'chip-top');
      top.appendChild(el('span', 'chip-name', it.label));
      top.appendChild(el('span', 'chip-ratio', mode === 'theme' ? it.ratio + ':1' : 'Page ' + it.n));
      b.appendChild(top);

      if (mode === 'theme') {
        var sw = el('div', 'swatches');
        sw.setAttribute('aria-hidden', 'true');
        it.sw.forEach(function (c) {
          var s = el('span');
          s.style.background = c;
          sw.appendChild(s);
        });
        b.appendChild(sw);
        if (it.shipped) { b.appendChild(el('span', 'shipped', 'Shipped')); }
      }

      b.addEventListener('click', function () {
        if (mode === 'theme') { themeId = it.id; } else { pageId = it.id; }
        render();
      });
      rail.appendChild(b);
    });
  }

  function figure(t, p) {
    var f = document.createElement('figure');
    var cap = document.createElement('figcaption');
    cap.appendChild(el('span', 'cap-num', mode === 'theme' ? p.n : t.ratio + ':1'));
    cap.appendChild(el('span', 'cap-title', mode === 'theme' ? p.label : t.label));
    cap.appendChild(el('p', 'cap-note', mode === 'theme' ? p.note : t.note));
    f.appendChild(cap);

    var img = document.createElement('img');
    img.className = 'shot';
    // A data URI has nothing to defer, so this is linked mode only.
    if (LAZY) { img.loading = 'lazy'; img.decoding = 'async'; }
    img.src = SHOTS[t.id + '-' + p.id];
    img.alt = p.label + ' page of the SEC EDGAR dashboard in the ' + t.label + ' theme';
    img.tabIndex = 0;
    var capText = t.label + ' · ' + p.n + ' ' + p.label;
    img.addEventListener('click', function () { openLb(img.src, capText); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(img.src, capText); }
    });
    f.appendChild(img);
    return f;
  }

  function render() {
    renderRail();
    gallery.textContent = '';
    gallery.className = 'gallery' + (mode === 'page' ? ' by-page' : '');
    if (mode === 'theme') {
      var t = THEMES.filter(function (x) { return x.id === themeId; })[0];
      PAGES.forEach(function (p) { gallery.appendChild(figure(t, p)); });
    } else {
      var p2 = PAGES.filter(function (x) { return x.id === pageId; })[0];
      THEMES.forEach(function (t2) { gallery.appendChild(figure(t2, p2)); });
    }
    btnTheme.setAttribute('aria-pressed', String(mode === 'theme'));
    btnPage.setAttribute('aria-pressed', String(mode === 'page'));
  }

  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');

  function openLb(src, cap) {
    lbImg.src = src;
    lbImg.alt = cap;
    lbCap.textContent = cap;
    if (typeof lb.showModal === 'function') { lb.showModal(); } else { lb.setAttribute('open', ''); }
  }

  document.getElementById('lb-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.className === 'lb-inner') { lb.close(); }
  });

  btnTheme.addEventListener('click', function () { mode = 'theme'; render(); });
  btnPage.addEventListener('click', function () { mode = 'page'; render(); });

  render();
})();
`;

// Split so this file never contains a literal closing script tag.
const script = '\n<' + 'script>\n'
  + logic
    .replace('__THEMES__', JSON.stringify(THEMES))
    .replace('__PAGES__', JSON.stringify(PAGES))
    .replace('__SHOTS__', JSON.stringify(shots))
    .replace('__LAZY__', String(!embed))
  + '\n</' + 'script>\n';

// head.html is a fragment, so the preamble is written here. Without the charset
// the em dash in body.html and the middot in the lightbox caption arrive as
// mojibake: the page still renders, nothing errors, and only the words are wrong.
// The Artifact host supplied this skeleton; a file served by Pages or opened from
// disk has to carry its own.
const preamble = '<!doctype html>\n'
  + '<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">\n';

const head = readFileSync(join(HERE, 'head.html'), 'utf8');
const body = readFileSync(join(HERE, 'body.html'), 'utf8');
const out = preamble + head + body + script;
const dest = embed ? join(HERE, 'theme-gallery.html') : join(DOCS, 'index.html');
writeFileSync(dest, out, 'utf8');
console.log('wrote', dest, (Buffer.byteLength(out) / 1024 / 1024).toFixed(2), 'MB',
  embed ? '(embedded)' : '(linked)');
