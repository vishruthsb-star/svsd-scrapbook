/**
 * Shared SVG defs for the scrapbook canvas pages (torn-strata, theme spreads, envelopes,
 * paper wheel) — the four texture patterns from the top of
 * references/Scrapbook Directions.dc.html (`sd-grid`, `sd-dot`, `sd-lined`, `sd-kraft`),
 * copied verbatim: same ids, dimensions, colors, and opacities. Also `wp-grain`, from
 * references/WheelPhone.dc.html's own defs block — the fine-grain texture punched into the
 * paper wheel's top torn layer (feTurbulence + feColorMatrix + feComposite "in"). WheelPhone's
 * `wp-dot` pattern is NOT re-declared: it's byte-for-byte identical to `sd-dot` below.
 *
 * The reference also re-declares `filter#ink` in that same block, but it is byte-for-byte
 * identical (same feTurbulence/feDisplacementMap params, same filterUnits box) to the
 * `#ink` filter `<ScrapDefs/>` already mounts once at the app root (utils/filters.ts's
 * INK_FILTER_ID) — two elements can't share an id, so canvas pages reference that existing
 * filter instead of redeclaring it here.
 *
 * Mount this once per canvas page (see ScrapbookCanvasPage) — SVG patterns/filters are
 * referenced by id via `fill: url(#sd-grid)` / `filter: url(#wp-grain)` etc., so one shared
 * <defs> is enough per page.
 */
export default function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <pattern id="sd-grid" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#FAF7F0" />
          <path d="M18 0V18M0 18H18" stroke="#111111" strokeOpacity="0.1" strokeWidth="1" />
        </pattern>
        <pattern id="sd-dot" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#F6F1E6" />
          <circle cx="8" cy="8" r="1.1" fill="#111111" fillOpacity="0.26" />
        </pattern>
        <pattern id="sd-lined" width="12" height="28" patternUnits="userSpaceOnUse">
          <rect width="12" height="28" fill="#FFFDF7" />
          <path d="M0 27.5H12" stroke="#8FB0CC" strokeOpacity="0.6" strokeWidth="1" />
        </pattern>
        <pattern id="sd-kraft" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#D7BC8F" />
          <circle cx="1.5" cy="1.5" r="0.6" fill="#7A5A30" fillOpacity="0.25" />
          <circle cx="5" cy="4.5" r="0.5" fill="#FFFFFF" fillOpacity="0.3" />
        </pattern>
        <filter id="wp-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0.24 0" result="g" />
          <feComposite in="g" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
