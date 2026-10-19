import type { StampLayout, TagLayout } from '../types';

export const STAMP_W = 150;
export const PAD_X = 14;
export const WIN_W = 122;
export const WIN_Y = 32;
export const CAP_W = 123;
export const MIN_RATIO = 0.5;
export const MAX_RATIO = 2;

export interface MediaSlotLayout {
  width: number;
  height: number;
  clamped: boolean;
}

/**
 * Shared "media slot" sizing: a fixed-width window whose height follows the media's own
 * aspect ratio, clamped to 1:2–2:1 (matches the Stamp's photo/video slot). Any item with
 * a similar slot (currently Stamp and ParcelTag) should size its slot through this, not
 * reimplement the clamp.
 */
export function mediaSlotLayout(width: number, ratio: number): MediaSlotLayout {
  const r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio || 1));
  return { width, height: Math.round(width / r), clamped: r !== ratio };
}

/**
 * Shared censor-bar width formula for the back face's "from" redaction — matches
 * Item.dc.html's `cw: Math.min(86, w - 2*S.px - 50)`. Every item kind derives it this way
 * from its own width and back-row inset, rather than hardcoding a width.
 */
export function censorWidthFor(width: number, px: number): number {
  return Math.min(86, width - 2 * px - 50);
}

let measureEl: HTMLDivElement | null = null;

function getMeasureEl(): HTMLDivElement {
  if (measureEl) return measureEl;
  const el = document.createElement('div');
  el.style.cssText =
    `position:absolute;left:-9999px;top:0;visibility:hidden;width:${CAP_W}px;` +
    `font-family:var(--font-hand);font-weight:300;font-size:11.5px;` +
    `line-height:1.18;white-space:pre-wrap;overflow-wrap:anywhere;text-wrap:pretty;`;
  document.body.appendChild(el);
  measureEl = el;
  return el;
}

/**
 * Measures the rendered height of a caption in a hidden, off-screen DOM element that
 * mirrors the on-stamp caption's width/font exactly. Deliberately not a line-count
 * estimate — wrapping depends on the actual font metrics, which vary once web fonts load.
 */
export function measureCaptionHeight(text: string): number {
  if (!text.trim()) return 0;
  const el = getMeasureEl();
  el.textContent = text;
  return Math.ceil(el.getBoundingClientRect().height);
}

/**
 * Calls `cb` once the app's web fonts have finished loading, so callers can re-measure
 * captions (their height depends on the real font metrics, not the fallback font).
 * Returns a cleanup function.
 */
export function onFontsReady(cb: () => void): () => void {
  if (!document.fonts) return () => {};
  document.fonts.ready.then(cb);
  document.fonts.addEventListener?.('loadingdone', cb);
  return () => document.fonts.removeEventListener?.('loadingdone', cb);
}

export function layout(ratio: number, captionHeight: number): StampLayout {
  const slot = mediaSlotLayout(WIN_W, ratio);
  const winBottom = WIN_Y + slot.height;
  const capY = winBottom + 3;
  const H = captionHeight ? capY + captionHeight + 16 : winBottom + 18;
  return {
    W: STAMP_W,
    H,
    winX: PAD_X,
    winY: WIN_Y,
    winW: slot.width,
    winH: slot.height,
    capY,
    capH: captionHeight,
    clamped: slot.clamped,
  };
}

/* ------------------------------------------------------------------
   ParcelTag layout: a fixed-width tag whose preview slot (also fixed-width) grows in
   height with the preview's own aspect ratio, same clamp as the Stamp. The tag's overall
   height grows to fit the slot plus the link line, with a floor tall enough for the
   shared back face (5 address rows) to always fit without clipping.
------------------------------------------------------------------ */
export const TAG_W = 124;
export const TAG_SLOT_W = 64;
export const TAG_SLOT_X = 30;
export const TAG_SLOT_Y = 56;
export const TAG_MIN_H = 200;
export const TAG_LINK_PAD_X = 8;
export const TAG_LINK_ICON_W = 13;
export const TAG_LINK_ICON_GAP = 4;
export const TAG_LINK_TEXT_W = TAG_W - 2 * TAG_LINK_PAD_X - TAG_LINK_ICON_W - TAG_LINK_ICON_GAP;
const TAG_SLOT_TO_LINK_GAP = 14;
const TAG_UNDERLINE_GAP = 8;
const TAG_BOTTOM_PAD = 14;

let linkMeasureEl: HTMLDivElement | null = null;

function getLinkMeasureEl(): HTMLDivElement {
  if (linkMeasureEl) return linkMeasureEl;
  const el = document.createElement('div');
  el.style.cssText =
    `position:absolute;left:-9999px;top:0;visibility:hidden;width:${TAG_LINK_TEXT_W}px;` +
    `font-family:var(--font-hand);font-weight:300;font-size:12px;` +
    `line-height:1.25;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;` +
    `overflow:hidden;word-break:break-word;`;
  document.body.appendChild(el);
  linkMeasureEl = el;
  return el;
}

/**
 * Measures the rendered height of the tag's link line, clamped to 2 lines — same
 * approach as `measureCaptionHeight`: a hidden DOM element mirroring the real link's
 * width/font/line-clamp, so wrapping reflects actual font metrics, not an estimate.
 */
export function measureLinkHeight(text: string): number {
  if (!text.trim()) return 0;
  const el = getLinkMeasureEl();
  el.textContent = text;
  return Math.ceil(el.getBoundingClientRect().height);
}

export function tagLayout(ratio: number, linkHeight: number): TagLayout {
  const slot = mediaSlotLayout(TAG_SLOT_W, ratio);
  const slotBottom = TAG_SLOT_Y + slot.height;
  const linkY = slotBottom + TAG_SLOT_TO_LINK_GAP;
  const underlineY = linkY + linkHeight + TAG_UNDERLINE_GAP;
  const H = Math.max(TAG_MIN_H, underlineY + TAG_BOTTOM_PAD);
  return {
    W: TAG_W,
    H,
    slotX: TAG_SLOT_X,
    slotY: TAG_SLOT_Y,
    slotW: slot.width,
    slotH: slot.height,
    linkX: TAG_LINK_PAD_X,
    linkY,
    linkW: TAG_W - 2 * TAG_LINK_PAD_X,
    underlineY,
    clamped: slot.clamped,
  };
}
