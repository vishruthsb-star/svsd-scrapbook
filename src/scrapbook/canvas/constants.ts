/**
 * Canvas-page constants. Per the Volume 1 SPEC OVERRIDES: the frame is NOT a fixed
 * 390x844 box — it comes from ScreenShell/index.css's `--screen-frame-width` (W) and
 * `--screen-height` (H, dynamic — defaults to 100dvh), measured at runtime by
 * ScrapbookCanvasPage. SAFE below mirrors the SAME `--safe-top`/`--safe-bottom`/
 * `--safe-side` custom properties declared once in src/index.css — read directly here so
 * JS math (fabAnchor, header delta, per-style layout) stays in lockstep with the CSS
 * without duplicating the numbers by hand if index.css ever changes.
 */
export const SAFE = { top: 62, bottom: 32, side: 24 } as const;

/**
 * The reference's fixed 390-wide design-coordinate system (every hand-placed x/y in
 * Scrapbook Directions.dc.html / EnvelopePhone.dc.html assumes this width). Full-bleed
 * layers (background textures, torn paper, panel/envelope widths) use the real measured
 * frame width instead; hand-placed content keeps these coordinates offset by `designX0 =
 * (frameW - DESIGN_W) / 2` so it lands in the same visual position regardless of how much
 * wider the real frame is than 390.
 */
export const DESIGN_W = 390;

/** The reference's header bottom edge (top 52 + height 61) — see `delta` in the spec. */
export const HEADER_REF_BOTTOM = 113;

/** `.addfab__pill`'s fixed height (addFabEngine.ts) — not configurable via AddFab's props. */
export const FAB_PILL_HEIGHT = 52;
