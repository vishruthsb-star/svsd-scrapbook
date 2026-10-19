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

/** The house red accent — already used for the unread mark and Note's red notches. */
export const ACCENT_RED = '#D8422C';

/** A light tint of ACCENT_RED, for the remove button's fill. */
export const ACCENT_RED_TINT = 'rgba(216, 66, 44, 0.14)';
