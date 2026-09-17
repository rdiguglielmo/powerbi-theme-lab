// ===========================================================================
// The one file you edit per project.
//
// Everything in theme-lab/ reads from here, so that folder can be copied into
// another repository without editing a single line inside it. If you find
// yourself changing a path inside theme-lab/, the value belongs in this file
// instead.
//
// ONE PROJECT, ONE THEME. A Power BI report cannot change its theme while
// someone is looking at it, so `theme` below is a single id, not a list. To show
// the same report in a different look, copy the project and change that one line.
//
// THE VALUES BELOW ARE AN EXAMPLE, not a dependency. They describe the report in
// this repository's gallery, which is not committed here. Replace every one of
// them with your own and nothing in theme-lab/ notices the difference - that is
// the whole point of the file. `theme`, `canvas` and `measuresTable` are the
// three that mean something on their own.
// ===========================================================================

export const project = {
  // -------------------------------------------------------------------------
  // The PBIP artifacts, as folder names relative to THIS file.
  // -------------------------------------------------------------------------
  reportDir: 'sec-edgar-financial.Report',
  semanticModelDir: 'sec-edgar-financial.SemanticModel',

  // -------------------------------------------------------------------------
  // The active theme. One id, from the keys exported by theme-lab/tokens.mjs.
  // `build.mjs` uses this when run with no arguments; `--use <id>` overrides it
  // for a one-off comparison while designing, and does not change what ships.
  // -------------------------------------------------------------------------
  theme: 'ledger',

  // -------------------------------------------------------------------------
  // Where the model's Parquet files live, relative to the REPOSITORY root.
  // Nothing in theme-lab/ reads this. It is for the small script that rewrites the
  // one absolute path the semantic model needs - see section 9, step 3 of
  // theme-lab/README.md. You write that script; it is about thirty lines.
  // -------------------------------------------------------------------------
  parquetDir: 'output/parquet',

  // -------------------------------------------------------------------------
  // Canvas. One size for every page in the report, including the harness.
  // -------------------------------------------------------------------------
  canvas: { width: 1920, height: 1080 },

  // The table every measure lives in. House convention.
  measuresTable: '_Measures',

  // -------------------------------------------------------------------------
  // The harness page: the test surface the theme is judged on.
  //
  // The fields are named by the ROLE they play in the layout, not by what they
  // mean, because the harness does not care what the data is - it only needs
  // something of roughly the right shape in each slot. Point them at your own
  // model's fields and the harness works unchanged.
  // -------------------------------------------------------------------------
  harness: {
    pageId: 'c3d4e5f60718293a4b5c',

    fields: {
      // A dimension with about ten members: bar chart, table, matrix rows.
      category: ['dim_company', 'company_name', 'Company'],
      // Something ordered, for the column and line charts.
      timeline: ['dim_date', 'calendar_year', 'Year'],
      // About eight members, for the list slicer. Fewer than eight leaves it
      // looking empty; many more and it scrolls in the screenshot.
      list: ['dim_statement', 'statement_name'],
      // Two or three members, for the tile slicer.
      fewValues: ['dim_account', 'period_type'],
    },

    measures: {
      primary: '# Financial Facts',
      secondary: '# Filings',
      tertiary: '# Companies',
    },
  },
};

export default project;
