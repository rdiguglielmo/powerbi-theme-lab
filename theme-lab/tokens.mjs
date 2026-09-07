// Design tokens for the three sandbox themes.
//
// perf-light and perf-dark are ONE design system in two polarities: they share the
// accent hue, the type scale, the radii and the series sequence, and differ only in
// which surface each role points at. Edit a shared value once and both rebuild.
//
// Colours were sampled from the reference screenshots rather than eyeballed:
//   screenshots/Dashboard_muestra/Captura de pantalla 2026-05-05 174827.png (light)
//   screenshots/Dashboard_muestra/Captura de pantalla 2026-05-05 174926.png (dark)
// Sampled values are noted in comments so a later edit knows what it is moving away from.

// ---------------------------------------------------------------------------
// Shared across the perf pair
// ---------------------------------------------------------------------------

const perfType = {
  // Segoe UI Variable only. Display/Text/Small are optical sizes: Display is cut for
  // large type, Small for captions. Using the right one is what replaces the tracking
  // control Power BI does not have.
  display: 'Segoe UI Variable Display',
  displayLight: 'Segoe UI Variable Display Light',
  text: 'Segoe UI Variable Text',
  textSemibold: 'Segoe UI Variable Text Semibold',
  small: 'Segoe UI Variable Small',
  smallSemibold: 'Segoe UI Variable Small Semibold',
};

const perfScale = {
  callout: 32, // card values - the reference runs very large and very light
  title: 12,
  header: 11,
  label: 10,
  smallLabel: 9,
  largeTitle: 14,
  largeLabel: 12,
};

// One blue, used sparingly. In the reference it appears on exactly three things per
// page: the selected KPI card, the selected chip, and the active nav item.
// DEEPENED 2026-09-02. The originals were sampled from the reference and sat
// between 3.0 and 3.7:1 on the ground - legible, but only just, and on a flat page
// with no card edges they were the only thing carrying any weight. They read as
// washed out next to Power BI's own defaults, which was the complaint.
//
// These are one step darker across the board. Every one clears 3:1 with room to
// spare rather than by hundredths, and the first two clear 4.5:1, so the accent
// can carry small text as well as fill a bar.
//
// Sampled originals kept in the comments: reverting is changing eight literals,
// and the contrast check will tell you immediately if you go too light again.
const perfSeries = [
  '#2563EB', // accent blue   (was #3B82F6, sampled #3F88FD / #378AFB / #4286F5)
  '#0F766E', // teal          (was #0EA5A5 - 2.58:1 on a deepened ground, failed)
  '#6D28D9', // violet        (was #7C5CFF)
  '#B45309', // amber         (was #C47E09, itself darkened from #F59E0B at 2.15:1)
  '#BE185D', // rose          (was #E2557B, sampled #E76E92 / #EE779B)
  '#15803D', // emerald       (was #2E9E6B)
  '#475569', // slate         (was #8896AB - 2.56:1, the worst of the seven)
  '#1E3A8A', // deep blue     (was #1E4FA8)
];

const perfRadius = { visual: 12, control: 8 };

// ---------------------------------------------------------------------------
// perf-light
// ---------------------------------------------------------------------------

export const perfLight = {
  id: 'perf-light',
  label: 'Performance Light',
  polarity: 'light',
  font: perfType,
  scale: perfScale,
  radius: perfRadius,
  series: perfSeries,
  color: {
    // FLAT, ON PURPOSE. surface, surfaceAlt and line all equal canvas, so a visual
    // container draws no card and no border and the page reads as one continuous
    // ground. The card treatment this replaces was white-on-near-white at 1.10:1,
    // which is below the threshold where an edge is visible at all - it produced
    // the cost of chrome with none of the separation.
    //
    // With the cards gone, structure has to come from somewhere, so it comes from
    // whitespace, the type ramp and the accent. Two tokens carry that load and are
    // NOT folded into the ground: surfaceSunken, which is now LIGHTER than the
    // ground so table rows and slicer wells still read, and gridline, now darker
    // than the ground for the same reason. On a white surface both were lighter;
    // that inverts once the ground is no longer the lightest thing on the page.
    // The ground stays at the sampled #F3F4F8 and is NOT deepened. Deepening it to
    // #EAEDF4 was tried and the contrast check failed seven pairs: the series were
    // tuned to clear 3:1 on this exact ground and series[6] sat at precisely 3.00,
    // so there was no room. The presence this page was missing comes from the
    // series being deeper instead - see below - which is free.
    canvas: '#F3F4F8',        // sampled #F3F4F8 - cool near-white, not pure white
    surface: '#F3F4F8',       // FLAT: same as canvas, so a visual draws no card
    surfaceAlt: '#F3F4F8',
    surfaceSunken: '#FFFFFF', // zebra rows, slicer wells - now LIGHTER than the
                              // ground, the inverse of what they were on white
    line: '#F3F4F8',          // borders draw in the ground colour, so they vanish
    gridline: '#DFE3EC',      // darker than the ground, or gridlines vanish too
    // Three-step text ramp. The reference's own greys (#959595 column headers,
    // #6D6D6D micro labels) sit at 2.6:1 and 4.2:1 on white - they fail WCAG AA.
    // These are darkened just enough to pass while keeping the same relationship.
    textPrimary: '#26282C',   // 14.76:1 on white  (sampled #181818 / #2B2B2B)
    textSecondary: '#565D68', //  6.64:1 on white  (sampled #6D6D6D, darkened)
    textTertiary: '#676D78',  //  4.72:1 on the flat ground (sampled #959595). Was
                              //  #6E7580, which passed at 4.65 on WHITE cards and
                              //  fell to 4.23 once the cards became the ground.
    accent: '#2563EB',        // graphics and accent text, matches series[0]
    accentStrong: '#1D4ED8',  // wherever white TEXT sits on the fill
    accentSoft: '#E7F1FF',    // sampled #E7F1FF - selected nav fill
    // Nav pill / button. accent on accentSoft is only 3.26:1, so the TEXT is
    // accentStrong: 4.54:1 on the soft fill. See navPillText in perf-dark for why
    // this is a token pair rather than one hardcoded treatment.
    navPillFill: '#E7F1FF',   // sampled - soft tinted pill
    navPillText: '#1D4ED8',   // deepened with accentStrong
    accentContrast: '#FFFFFF',
    // Kept in step with the series, or a status dot and a bar meaning the same
    // thing would be two different greens.
    good: '#15803D',
    bad: '#BE185D',
    neutral: '#B45309',
    // Gradient picker seeds
    gradMax: '#2563EB',
    gradMin: '#E7F1FF',
    nullColor: '#C9CDD4',
  },
};

// ---------------------------------------------------------------------------
// perf-dark
//
// The reference does something specific: cards are LIGHTER and BLUER than the canvas,
// not darker. The canvas is a desaturated slate; each surface step adds blue and
// luminance. That is what stops it reading as a flat black rectangle.
// ---------------------------------------------------------------------------

export const perfDark = {
  id: 'perf-dark',
  label: 'Performance Dark',
  polarity: 'dark',
  font: perfType,
  scale: perfScale,
  radius: perfRadius,
  series: [
    '#4C93FA', // accent, one step brighter than light - dark grounds eat luminance
    '#2DD4BF',
    '#A78BFA',
    '#FBBF24',
    '#F17A9C',
    '#4ADE80',
    '#A3B3C7',
    '#7BA7F0',
  ],
  color: {
    canvas: '#26313E',        // sampled #25313D / #252F3B - dominant page ground
    surface: '#2C4362',       // sampled #2C4362 - card, lighter and bluer than canvas
    surfaceAlt: '#2F4B73',    // sampled #2F4B73 - inner panel, lighter again
    surfaceSunken: '#223447',
    line: '#3A5578',
    gridline: '#35496A',
    textPrimary: '#F1F5F9',   //  9.19:1 on surface  (sampled near-white)
    textSecondary: '#C6D3E3', //  6.63:1 on surface  (sampled #B4C9E5)
    textTertiary: '#A9BACF',  //  5.09:1 on surface  (sampled #9DA9B7, lightened)
    accent: '#4C93FA',        // sampled #4B91FA / #3D7DFD - 3.29:1 on surface
    accentStrong: '#2563EB',  // same value as light: white text on it is 5.17:1
    accentSoft: '#1E3A5F',
    // The dark reference does NOT mirror the light one here: its active nav item
    // and Clear button are a SOLID bright pill with white text, not a soft tint.
    // accentStrong rather than the sampled #4B91FA, because white on #4B91FA is
    // 3.06:1 - the reference's own pill fails AA.
    navPillFill: '#2563EB',
    navPillText: '#FFFFFF',   // 5.17:1 on navPillFill
    accentContrast: '#FFFFFF',
    good: '#3FBE86',
    bad: '#EE779B',           // sampled #EE779B - rose, not fire red
    neutral: '#FBBF24',
    gradMax: '#4C93FA',
    gradMin: '#1E3A5F',
    nullColor: '#55677D',
  },
};

// ---------------------------------------------------------------------------
// orchard - Peaches-inspired warm neutral
//
// Structural values taken from Peach.Themee8249776197099797.json. The 700-entry
// dataColors array is deliberately NOT carried over; this is a deliberate eight.
// ---------------------------------------------------------------------------

export const orchard = {
  id: 'orchard',
  label: 'Orchard',
  polarity: 'light',
  font: {
    display: 'Segoe UI Variable Display',
    displayLight: 'Segoe UI Variable Display Light',
    text: 'Segoe UI Variable Text',
    textSemibold: 'Segoe UI Variable Text Semibold',
    small: 'Segoe UI Variable Small',
    smallSemibold: 'Segoe UI Variable Small Semibold',
  },
  scale: {
    callout: 34,
    title: 12,
    header: 11,
    label: 10,
    smallLabel: 9,
    largeTitle: 14,
    largeLabel: 12,
  },
  radius: { visual: 6, control: 6 },
  // A deliberate eight, drawn from the Peaches family. The source theme ships a
  // 700-entry dataColors array; that is a generated ramp, not a palette, and is
  // deliberately not carried over.
  series: [
    '#C96A3A', // terracotta   (Peaches accent)
    '#6B8F5E', // olive
    '#BF7B26', // amber - darkened from #D4892A, which is 2.76:1 on the card
    '#5F6B6D', // slate
    '#8C7B6B', // taupe
    '#B84040', // brick
    '#3599B8', // teal
    '#3D2F28', // espresso
  ],
  color: {
    canvas: '#F5F5F4',        // Peaches page background
    surface: '#FCFCFC',       // Peaches outspace / card
    surfaceAlt: '#F0EEEB',
    surfaceSunken: '#EFEDEA',
    line: '#E3DFDA',
    gridline: '#E0E0E0',      // Peaches gridline
    textPrimary: '#3D2F28',   // Peaches espresso - 12.51:1 on the card
    textSecondary: '#646464', // Peaches secondary - 5.77:1
    textTertiary: '#7C7069',  // Peaches ships #838383 at 3.70:1; warmed and darkened
    accent: '#C96A3A',        // graphics and accent text - 3.65:1
    accentStrong: '#AD5B32',  // wherever white TEXT sits on the fill - 4.86:1
    accentSoft: '#F6E6DC',
    // accentStrong on accentSoft is 4.00:1 here and fails AA, so the pill text is
    // one step darker than accentStrong. The only new hex this pair introduces.
    navPillFill: '#F6E6DC',
    navPillText: '#8F4A28',   // 5.44:1 on navPillFill
    accentContrast: '#FFFFFF',
    good: '#5E8C55',
    bad: '#B84040',
    neutral: '#BF7B26',
    gradMax: '#C96A3A',
    gradMin: '#F6E6DC',
    nullColor: '#C4BEB6',
  },
};

// ===========================================================================
// The three below were added 2026-09-03, against two complaints about
// perf-light: it reads WASHED OUT, and it reads like DEFAULT POWER BI.
//
// Those are two different problems and each one has its own lever.
//
// Presence is measurable, and the number that matters is surface against
// canvas. perf-light sits at 1.10:1, which is below the point where an edge is
// visible at all - that is why its cards were removed rather than restyled.
// These three sit at 1.27, 1.39 and 1.24, so a container reads as a container
// and the page gets its structure back without reinstating an invisible one.
//
// "Looks like default Power BI" is the accent. Blue on near-white is what the
// product ships, so none of these three leads on it: oxblood, indigo, forest.
//
// Every value was scored against the same WCAG arithmetic build.mjs runs before
// being written here, not eyeballed and left for the audit to catch. The
// tightest scored pair across all three is 5.62:1 against a 4.5 minimum. That
// headroom is deliberate: perf-light's series were tuned so close to the line
// that deepening its ground later became impossible - seven pairs failed and
// one sat at exactly 3.00 - and the ground had to stay pale as a result.
// ===========================================================================

// ---------------------------------------------------------------------------
// ledger - warm editorial, a printed annual report
//
// The one that looks least like a dashboard. A warm sand ground with paper-white
// cards and near-black warm ink, the way a printed financial statement reads.
// ---------------------------------------------------------------------------

export const ledger = {
  id: 'ledger',
  label: 'Ledger',
  polarity: 'light',
  font: perfType,
  scale: { ...perfScale, callout: 34 },
  // Square-ish. Rounded corners are a product-UI signal; print is not rounded.
  radius: { visual: 4, control: 4 },
  // Muted but genuinely saturated - the failure mode of a warm palette is that
  // everything turns to mud, so no two of these share a hue family.
  series: [
    '#8C2F39', // oxblood      7.68:1 on the card, and the accent
    '#1F5C63', // deep teal
    '#A8701C', // ochre
    '#5B6B3A', // olive
    '#3E4C7A', // indigo ink
    '#7A3B6B', // plum
    '#8A5A2B', // bronze
    '#3D3833', // char
  ],
  color: {
    // The ground is the whole point: #E6DDCD is a real colour, not a tinted
    // white, so the paper-white card above it separates at 1.27:1 instead of
    // perf-light's 1.10:1.
    canvas: '#E6DDCD',
    surface: '#FBF8F2',
    surfaceAlt: '#F2ECE0',
    surfaceSunken: '#EFE9DC',
    line: '#CFC3AC',          // 1.64:1 on the card - a hairline you can see
    gridline: '#DBD2C0',
    textPrimary: '#1F1B15',   // 16.16:1 - warm black, not neutral black
    textSecondary: '#554E42', //  7.75:1
    textTertiary: '#6B6153',  //  5.73:1 - the tightest pair in this theme
    accent: '#8C2F39',
    accentStrong: '#74262F',  // white text on it: 10.19:1
    accentSoft: '#F3E3E0',
    navPillFill: '#F3E3E0',
    navPillText: '#74262F',
    accentContrast: '#FFFFFF',
    good: '#3F6B4A',
    bad: '#8C2F39',           // the accent doubles as bad: in a warm palette a
                              // separate red would fight it
    neutral: '#A8701C',
    gradMax: '#8C2F39',
    gradMin: '#F3E3E0',
    nullColor: '#C3B9A8',
  },
};

// ---------------------------------------------------------------------------
// graphite - cool, architectural, the highest separation of the three
//
// The only one with pure white cards. That is what buys 1.39:1, the strongest
// container separation available without darkening the ground into a dark theme.
// ---------------------------------------------------------------------------

export const graphite = {
  id: 'graphite',
  label: 'Graphite',
  polarity: 'light',
  font: perfType,
  scale: perfScale,
  radius: { visual: 8, control: 6 },
  series: [
    '#3730A3', // indigo       9.93:1 on white - deliberately not the default blue
    '#0E7490', // cyan-teal
    '#B45309', // amber
    '#BE185D', // rose
    '#15803D', // emerald
    '#475569', // slate
    '#7C2D12', // rust
    '#1E3A8A', // navy
  ],
  color: {
    canvas: '#D6DBE3',        // a real grey. White cards need something to sit ON
    surface: '#FFFFFF',
    surfaceAlt: '#F1F3F6',
    surfaceSunken: '#EDF0F4',
    line: '#B9C2CE',          // 1.80:1 - the crispest hairline of the three
    gridline: '#DDE2E9',
    textPrimary: '#14181F',   // 17.79:1
    textSecondary: '#4A515C', //  8.01:1
    textTertiary: '#5D6470',  //  5.96:1
    accent: '#3730A3',
    accentStrong: '#312C8C',  // white text on it: 11.23:1
    accentSoft: '#E6E5F7',
    navPillFill: '#E6E5F7',
    navPillText: '#312C8C',
    accentContrast: '#FFFFFF',
    good: '#15803D',
    bad: '#B0234A',
    neutral: '#A15C07',
    gradMax: '#3730A3',
    gradMin: '#E6E5F7',
    nullColor: '#B4BCC7',
  },
};

// ---------------------------------------------------------------------------
// cypress - deep green, sober
//
// The quietest of the three. Forest green is the one accent family that reads as
// considered rather than corporate, and nothing else in the set uses it.
// ---------------------------------------------------------------------------

export const cypress = {
  id: 'cypress',
  label: 'Cypress',
  polarity: 'light',
  font: perfType,
  scale: perfScale,
  radius: { visual: 6, control: 6 },
  series: [
    '#16604D', // forest       7.06:1 on the card, and the accent
    '#8A4B1F', // russet
    '#3F5B8C', // dusty blue
    '#A32E3F', // brick
    '#6B7A2E', // moss
    '#5A4A7A', // heather
    '#2E7A8C', // lake
    '#33382F', // pine char
  ],
  color: {
    canvas: '#DDE3D6',        // bone with a green cast
    surface: '#F8F9F5',
    surfaceAlt: '#EEF1E9',
    surfaceSunken: '#EAEEE3',
    line: '#C3CBB6',          // 1.58:1
    gridline: '#D4DAC8',
    textPrimary: '#191D19',   // 16.13:1
    textSecondary: '#4B534B', //  7.53:1
    textTertiary: '#5E665D',  //  5.62:1 - the tightest pair across all three
    accent: '#16604D',
    accentStrong: '#114C3D',  // white text on it: 9.88:1
    accentSoft: '#DDEDE5',
    navPillFill: '#DDEDE5',
    navPillText: '#114C3D',
    accentContrast: '#FFFFFF',
    good: '#16604D',
    bad: '#A32E3F',
    neutral: '#9A6A10',
    gradMax: '#16604D',
    gradMin: '#DDEDE5',
    nullColor: '#B7BDAF',
  },
};

// build.mjs derives its theme id list from these keys, so registering here is
// the only step - there is no second list to keep in step.
export const themes = {
  'perf-light': perfLight,
  'perf-dark': perfDark,
  orchard,
  ledger,
  graphite,
  cypress,
};
