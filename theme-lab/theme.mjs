// Builds a Power BI theme JSON from a token set.
//
// One builder for all three themes, so their structure is identical and only values
// differ. Every property name here was looked up with
//   powerbi-report-author formatting describe-object <visualType> <object>
// rather than written from memory.
//
// Two shapes matter:
//   - Structured colour: { solid: { color: "#hex" } }  - used for anything the
//     describe-object output calls a fill/colour on a visual object.
//   - Plain hex string: used in textClasses and in the top-level structural colours.
//
// Objects listed by the CLI as "(selector: default)" need "$id": "default" in the
// theme block. cardVisual, listSlicer and advancedSlicerVisual are all in that family.

const SCHEMA =
  'https://raw.githubusercontent.com/microsoft/powerbi-desktop-samples/main/Report%20Theme%20JSON%20Schema/reportThemeSchema-2.153.json';

const solid = (hex) => ({ solid: { color: hex } });

export function buildTheme(t) {
  const c = t.color;
  const f = t.font;
  const s = t.scale;

  return {
    $schema: SCHEMA,
    // name is stamped by build.mjs - it must equal the filename including .json
    name: 'PLACEHOLDER.json',

    dataColors: t.series,

    // Sentiment (waterfall, KPI)
    good: c.good,
    neutral: c.neutral,
    bad: c.bad,

    // Conditional-formatting gradient picker seeds
    maximum: c.gradMax,
    center: c.neutral,
    minimum: c.gradMin,
    null: c.nullColor,

    // Structural colours. All seven set together - omitting one is how text goes
    // invisible on a polarity flip.
    background: c.surface,
    foreground: c.textPrimary,
    firstLevelElements: c.textPrimary,
    secondLevelElements: c.textSecondary,
    thirdLevelElements: c.gridline,
    fourthLevelElements: c.textTertiary,
    secondaryBackground: c.surfaceSunken,
    tableAccent: c.line,

    textClasses: {
      // 4 primaries
      callout: { fontSize: s.callout, fontFace: f.displayLight, color: c.textPrimary },
      title: { fontSize: s.title, fontFace: f.smallSemibold, color: c.textSecondary },
      header: { fontSize: s.header, fontFace: f.textSemibold, color: c.textPrimary },
      label: { fontSize: s.label, fontFace: f.text, color: c.textPrimary },
      // 8 documented derived classes
      largeTitle: { fontSize: s.largeTitle, fontFace: f.display, color: c.textPrimary },
      semiboldLabel: { fontSize: s.label, fontFace: f.textSemibold, color: c.textPrimary },
      largeLabel: { fontSize: s.largeLabel, fontFace: f.text, color: c.textPrimary },
      smallLabel: { fontSize: s.smallLabel, fontFace: f.small, color: c.textSecondary },
      lightLabel: { fontSize: s.label, fontFace: f.small, color: c.textSecondary },
      boldLabel: { fontSize: s.label, fontFace: f.textSemibold, color: c.textPrimary },
      largeLightLabel: { fontSize: s.largeLabel, fontFace: f.small, color: c.textSecondary },
      smallLightLabel: { fontSize: s.smallLabel, fontFace: f.small, color: c.textTertiary },
    },

    visualStyles: {
      // ---------------------------------------------------------------------
      // Page-level defaults. outspace / outspacePane / filterCard are page-only
      // objects, so they live here without colliding with visual `background`.
      // build.mjs ALSO stamps objects.background into every page.json, because the
      // page canvas provably does not inherit from the theme.
      // ---------------------------------------------------------------------
      // theming.md says to put outspacePane and filterCard in visualStyles["*"]["*"],
      // but the PBIR validator rejects them there with PBIR_FORMATTING_OBJECT_UNKNOWN.
      // They belong under `page`, which is also where the shipped Peaches theme puts
      // them. Validator wins on mechanics.
      page: {
        '*': {
          background: [{ color: solid(c.canvas), transparency: 0 }],
          outspace: [{ color: solid(c.canvas), transparency: 0 }],

          // The filter pane inherits nothing from structural colours - always explicit.
          outspacePane: [
            {
              backgroundColor: solid(c.surface),
              foregroundColor: solid(c.textPrimary),
              titleSize: s.title,
              headerSize: s.header,
              border: true,
              borderColor: solid(c.line),
              checkboxAndApplyColor: solid(c.accent),
              inputBoxColor: solid(c.surfaceSunken),
              fontFamily: f.text,
            },
          ],
          filterCard: [
            {
              $id: 'Applied',
              border: false,
              textSize: s.smallLabel,
              backgroundColor: solid(c.accentSoft),
              foregroundColor: solid(c.textPrimary),
              fontFamily: f.small,
            },
            {
              $id: 'Available',
              border: false,
              textSize: s.smallLabel,
              backgroundColor: solid(c.surfaceSunken),
              foregroundColor: solid(c.textSecondary),
              fontFamily: f.small,
            },
          ],
        },
      },

      // ---------------------------------------------------------------------
      // Universal container chrome
      // ---------------------------------------------------------------------
      '*': {
        '*': {
          title: [
            {
              show: true,
              fontFamily: f.smallSemibold,
              fontSize: s.title,
              fontColor: solid(c.textSecondary),
              background: solid(c.surface),
              alignment: 'left',
              titleWrap: false,
            },
          ],
          subTitle: [
            {
              show: false,
              fontFamily: f.small,
              fontSize: s.smallLabel,
              fontColor: solid(c.textTertiary),
            },
          ],
          background: [{ show: true, color: solid(c.surface), transparency: 0 }],
          border: [{ show: true, color: solid(c.line), radius: t.radius.visual, width: 1 }],
          dropShadow: [{ show: false }],
          padding: [{ top: 12, bottom: 12, left: 12, right: 12 }],
          divider: [{ show: false }],
          spacing: [{ customizeSpacing: true, spaceBelowTitle: 8, verticalSpacing: 0 }],
          visualHeader: [
            {
              show: true,
              background: solid(c.surface),
              foreground: solid(c.textTertiary),
              border: solid(c.surface),
              transparency: 100,
            },
          ],
          visualTooltip: [
            {
              background: solid(c.surface),
              themedBackground: solid(c.surface),
              titleFontColor: solid(c.textSecondary),
              themedTitleFontColor: solid(c.textSecondary),
              valueFontColor: solid(c.textPrimary),
              themedValueFontColor: solid(c.textPrimary),
              fontFamily: f.small,
              fontSize: s.smallLabel,
            },
          ],

          // Cartesian defaults, inherited by every chart type
          categoryAxis: [
            {
              show: true,
              fontFamily: f.small,
              fontSize: s.smallLabel,
              labelColor: solid(c.textSecondary),
              showAxisTitle: false,
              gridlineShow: false,
              gridlineColor: solid(c.gridline),
              gridlineStyle: 'solid',
              gridlineThickness: 1,
            },
          ],
          valueAxis: [
            {
              show: true,
              fontFamily: f.small,
              fontSize: s.smallLabel,
              labelColor: solid(c.textTertiary),
              showAxisTitle: false,
              gridlineShow: true,
              gridlineColor: solid(c.gridline),
              gridlineStyle: 'solid',
              gridlineThickness: 1,
            },
          ],
          legend: [
            {
              show: true,
              // Valid enum, checked: Top|TopCenter|TopRight|Left|Right|LeftCenter|
              // RightCenter|Bottom|BottomCenter|BottomRight. "TopLeft" is NOT valid.
              position: 'Top',
              showTitle: false,
              fontFamily: f.small,
              fontSize: s.smallLabel,
              labelColor: solid(c.textSecondary),
            },
          ],
          labels: [
            {
              show: false,
              fontFamily: f.small,
              fontSize: s.smallLabel,
              color: solid(c.textSecondary),
            },
          ],
        },
      },

      // ---------------------------------------------------------------------
      // Charts
      // ---------------------------------------------------------------------
      barChart: {
        '*': {
          categoryAxis: [{ gridlineShow: false }],
          valueAxis: [{ gridlineShow: true }],
        },
      },
      clusteredBarChart: {
        '*': {
          categoryAxis: [{ gridlineShow: false }],
          valueAxis: [{ gridlineShow: true }],
        },
      },
      columnChart: {
        '*': {
          categoryAxis: [{ gridlineShow: false }],
          valueAxis: [{ gridlineShow: true }],
        },
      },
      clusteredColumnChart: {
        '*': {
          categoryAxis: [{ gridlineShow: false }],
          valueAxis: [{ gridlineShow: true }],
        },
      },
      lineChart: {
        '*': {
          categoryAxis: [{ gridlineShow: false }],
          valueAxis: [{ gridlineShow: true }],
          lineStyles: [
            {
              strokeWidth: 2,
              lineStyle: 'solid',
              // enum is monotoneX|cardinal - NOT a boolean, despite the UI showing
              // this as a "Smooth" toggle
              interpolationSmooth: 'monotoneX',
              showMarker: false,
              markerShape: 'circle',
              markerSize: 4,
            },
          ],
          plotArea: [{ transparency: 100 }],
        },
      },
      donutChart: {
        '*': {
          legend: [{ position: 'RightCenter' }],
        },
      },

      // ---------------------------------------------------------------------
      // Card. Objects carry "$id": "default".
      // Do NOT add border / padding / spacing here - the validator rejects those
      // three on cardVisual specifically (they are fine on the "*" wildcard).
      // ---------------------------------------------------------------------
      cardVisual: {
        '*': {
          // One multi-value card draws a container frame AND a per-tile outline, which
          // reads as a double border, and its white container fill merges the tiles
          // into one slab. The reference shows each KPI as its own card floating on the
          // canvas, so the container chrome comes off entirely and the tiles carry it.
          border: [{ show: false }],
          background: [{ show: false }],
          // A TITLED CARD SHOWED TWO MISALIGNED BORDERS, and the container
          // `background` and `border` above were not either of them. The
          // wildcard style `*` paints the title bar in `surface` across the
          // FULL visual width, while its `padding` of 12 insets the tile that
          // carries the visible outline: two rectangles, twelve pixels apart,
          // on every titled card. (`layout.backgroundShow` below is the same
          // twelve pixels on the other three sides.)
          // Painting the title bar in the CANVAS colour makes it disappear, so
          // the caption reads as a label above a floating tile and the tile's
          // outline is the only rectangle left. Every card here sits directly on
          // the canvas, so there is no surface for this to look wrong against.
          title: [{ background: solid(c.canvas) }],
          value: [
            {
              $id: 'default',
              fontFamily: f.displayLight,
              fontSize: s.callout,
              fontColor: solid(c.textPrimary),
              horizontalAlignment: 'left',
            },
          ],
          label: [
            {
              $id: 'default',
              show: true,
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.textSecondary),
              // enum is belowValue|aboveValue - not "above"
              position: 'aboveValue',
              horizontalAlignment: 'left',
            },
          ],
          fillCustom: [{ $id: 'default', show: true, fillColor: solid(c.surface) }],
          outline: [
            { $id: 'default', show: true, lineColor: solid(c.line), weight: 1 },
          ],
          accentBar: [{ $id: 'default', show: false }],
          // cellPadding is the gap BETWEEN tiles - what keeps the three KPIs on
          // Executive Overview reading as three cards and not one slab.
          // backgroundShow is layout's OWN background, separate from the
          // container `background` above, and it defaults ON: a surface slab
          // filling the whole visual, 12px proud of the tile on every side. It
          // is HALF of the double border - see the title note above for the
          // other half. Both have to go or the card still shows two edges.
          layout: [{ $id: 'default', cellPadding: 16, backgroundShow: false }],
          // Corner radius never reached these tiles because border.radius is one of the
          // three properties cardVisual rejects. The tile carries its own shape on
          // shapeCustomRectangle - and like actionButton, the radius is inert until
          // tileShape says the tile IS a rounded rectangle.
          //
          // cardCalloutArea also has a rectangleRoundedCurve and it is NOT this one:
          // that is the inner callout area, and setting it validates clean and renders
          // nothing.
          shapeCustomRectangle: [
            { tileShape: 'rectangleRoundedByPixel', rectangleRoundedCurve: t.radius.visual },
          ],
        },
      },

      // ---------------------------------------------------------------------
      // Slicers. Three separate object models - the modern ones inherit nothing
      // from the legacy "slicer" key.
      // ---------------------------------------------------------------------
      slicer: {
        '*': {
          header: [
            {
              show: true,
              fontFamily: f.smallSemibold,
              textSize: s.smallLabel,
              fontColor: solid(c.textSecondary),
              background: solid(c.surface),
              outlineStyle: 0,
            },
          ],
          items: [
            {
              fontFamily: f.text,
              textSize: s.label,
              fontColor: solid(c.textPrimary),
              background: solid(c.surface),
              outlineStyle: 0,
            },
          ],
        },
      },
      listSlicer: {
        '*': {
          value: [
            {
              $id: 'default',
              fontFamily: f.text,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
            },
          ],
          label: [
            {
              $id: 'default',
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.textSecondary),
            },
          ],
          fillCustom: [{ $id: 'default', show: true, fillColor: solid(c.surface) }],
          outline: [{ $id: 'default', show: true, lineColor: solid(c.line), weight: 1 }],
        },
      },
      // The CLI's list-objects prints these selectors as "default|hover|press|
      // selected|mixed", but the theme SCHEMA wants the qualified form:
      // "default", or "<facet>:<state>" where facet is selection|interaction|
      // expansion|series. Bare "selected"/"hover" fail schema validation.
      advancedSlicerVisual: {
        '*': {
          value: [
            {
              $id: 'default',
              fontFamily: f.text,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
            },
            {
              $id: 'selection:selected',
              fontFamily: f.textSemibold,
              fontSize: s.label,
              fontColor: solid(c.accentContrast),
            },
          ],
          label: [
            {
              $id: 'default',
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.textSecondary),
            },
          ],
          fillCustom: [
            { $id: 'default', show: true, fillColor: solid(c.surface) },
            { $id: 'interaction:hover', show: true, fillColor: solid(c.surfaceSunken) },
            { $id: 'selection:selected', show: true, fillColor: solid(c.accentStrong) },
          ],
          outline: [
            { $id: 'default', show: true, lineColor: solid(c.line), weight: 1 },
            {
              $id: 'selection:selected',
              show: true,
              lineColor: solid(c.accentStrong),
              weight: 1,
            },
          ],
        },
      },

      // ---------------------------------------------------------------------
      // Table and matrix. stylePreset None or the preset overwrites every
      // explicit colour set below.
      // ---------------------------------------------------------------------
      tableEx: {
        '*': {
          stylePreset: [{ name: 'None' }],
          grid: [
            {
              gridVertical: false,
              gridHorizontal: true,
              gridHorizontalColor: solid(c.gridline),
              gridHorizontalWeight: 1,
              outlineStyle: 0,
              rowPadding: 6,
              imageHeight: 24,
            },
          ],
          columnHeaders: [
            {
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.textTertiary),
              backColor: solid(c.surface),
              outlineStyle: 0,
              outlineColor: solid(c.line),
              outlineWeight: 1,
              autoSizeColumnWidth: true,
              wordWrap: false,
            },
          ],
          values: [
            {
              fontFamily: f.text,
              fontSize: s.label,
              fontColorPrimary: solid(c.textPrimary),
              backColorPrimary: solid(c.surface),
              fontColorSecondary: solid(c.textPrimary),
              backColorSecondary: solid(c.surface),
              outlineStyle: 0,
              urlIcon: false,
            },
          ],
          total: [
            {
              totals: true,
              fontFamily: f.textSemibold,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
              backColor: solid(c.surface),
              outlineStyle: 0,
              outlineColor: solid(c.line),
            },
          ],
        },
      },
      pivotTable: {
        '*': {
          stylePreset: [{ name: 'None' }],
          grid: [
            {
              gridVertical: false,
              gridHorizontal: true,
              gridHorizontalColor: solid(c.gridline),
              gridHorizontalWeight: 1,
              outlineStyle: 0,
              rowPadding: 6,
              imageHeight: 24,
            },
          ],
          columnHeaders: [
            {
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.textTertiary),
              backColor: solid(c.surface),
              outlineStyle: 0,
              outlineColor: solid(c.line),
              outlineWeight: 1,
              wordWrap: false,
            },
          ],
          rowHeaders: [
            {
              fontFamily: f.text,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
              backColor: solid(c.surface),
              outlineStyle: 0,
            },
          ],
          values: [
            {
              fontFamily: f.text,
              fontSize: s.label,
              fontColorPrimary: solid(c.textPrimary),
              backColorPrimary: solid(c.surface),
              fontColorSecondary: solid(c.textPrimary),
              backColorSecondary: solid(c.surface),
              outlineStyle: 0,
              urlIcon: false,
            },
          ],
          subTotals: [
            {
              fontFamily: f.textSemibold,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
              backColor: solid(c.surfaceSunken),
            },
          ],
        },
      },

      // ---------------------------------------------------------------------
      // Chrome: textbox, shape, button. Colours here are per-run / per-state and
      // do NOT follow structural colours, so they are always explicit.
      // ---------------------------------------------------------------------
      textbox: {
        '*': {
          background: [{ show: false }],
          border: [{ show: false }],
          padding: [{ top: 0, bottom: 0, left: 0, right: 0 }],
        },
      },
      shape: {
        '*': {
          background: [{ show: false }],
          border: [{ show: false }],
        },
      },
      // actionButton needs the DUAL-ENTRY pattern: one entry with no selector plus
      // one with the id selector. With only the selector entry, the override is
      // silently dropped and the button renders with stock chrome - no error.
      actionButton: {
        '*': {
          text: (() => {
            const t0 = {
              show: true,
              fontFamily: f.smallSemibold,
              fontSize: s.smallLabel,
              fontColor: solid(c.navPillText),
              horizontalAlignment: 'center',
              verticalAlignment: 'middle',
            };
            return [t0, { ...t0, $id: 'default' }];
          })(),
          fill: (() => {
            const f0 = { show: true, fillColor: solid(c.navPillFill), transparency: 0 };
            return [
              f0,
              { ...f0, $id: 'default' },
              { ...f0, transparency: 15, $id: 'hover' },
            ];
          })(),
          outline: (() => {
            const o0 = { show: false };
            return [o0, { ...o0, $id: 'default' }];
          })(),
          // border.radius does not reach a button either. tileShape + roundEdge is
          // the route that does: 'rectangleRoundedByPixel' reads roundEdge as pixels.
          shape: [{ tileShape: 'rectangleRoundedByPixel', roundEdge: t.radius.control }],
        },
      },

      // ---------------------------------------------------------------------
      // Page navigator - the report nav.
      //
      // ONE visual renders a button per page and drives the `selected` state off the
      // page you are actually on. That is what makes "one accent pill, three plain
      // labels" expressible at all: the difference between active and inactive is a
      // COLOUR, which a page is not allowed to name here - and in the theme it does
      // not have to be named twice.
      //
      // `layout` is deliberately NOT set here. How many rows the nav has is a
      // property of one page, not of the design system.
      //
      // Written with the same DUAL-ENTRY pattern actionButton needs - a bare entry
      // plus the $id entry. Whether pageNavigator strictly requires it is unproven,
      // and that failure mode is silent, so this errs toward the shape known to work.
      // ---------------------------------------------------------------------
      pageNavigator: {
        '*': {
          text: (() => {
            const base = {
              show: true,
              fontFamily: f.text,
              fontSize: s.label,
              fontColor: solid(c.textPrimary),
              horizontalAlignment: 'left',
              verticalAlignment: 'middle',
              leftMargin: 16,
            };
            const sel = {
              ...base,
              fontFamily: f.textSemibold,
              fontColor: solid(c.navPillText),
            };
            return [base, { ...base, $id: 'default' }, { ...sel, $id: 'selected' }];
          })(),
          // NO bare entry here, unlike text and outline above. A bare fill entry is
          // applied to EVERY state and beats the $id entries, so `{ show: false }` with
          // no selector silently suppresses the selected pill - which is exactly how
          // this first rendered: correct label colours, no pill behind the active one.
          // The $id-only form is what makes the active fill appear.
          fill: [
            { $id: 'default', show: false },
            { $id: 'hover', show: true, fillColor: solid(c.surfaceSunken), transparency: 0 },
            { $id: 'selected', show: true, fillColor: solid(c.navPillFill), transparency: 0 },
          ],
          outline: (() => {
            const o0 = { show: false };
            return [o0, { ...o0, $id: 'default' }];
          })(),
          shape: [{ tileShape: 'rectangleRoundedByPixel', roundEdge: t.radius.control }],
        },
      },
    },
  };
}
