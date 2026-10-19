import type { CSSProperties } from 'react';

/**
 * IDs for the shared SVG filter/pattern defs rendered once by <ScrapDefs /> and
 * referenced by every item (filter(#ink), fill url(#h-d)).
 */
export const INK_FILTER_ID = 'ink';
export const HATCH_PATTERN_ID = 'h-d';

/** The one style object every ink-filtered <g> should use — avoids retyping the id. */
export const INK_FILTER_STYLE: CSSProperties = { filter: `url(#${INK_FILTER_ID})` };

/** Default stroke ink color, shared by FlipCard/Decor/every item's line art. */
export const DEFAULT_INK = '#111';

/** Item.dc.html's default paper field color (warm off-white) — Note, VoicePostcard, ParcelTag. */
export const FIELD_PAPER = '#FAF7F0';

/** stamp-test.html's field override (pure white) — Stamp only; it's the source of truth there. */
export const FIELD_WHITE = '#fff';
