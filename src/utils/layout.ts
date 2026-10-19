import type { StampLayout } from '../types';

export const STAMP_W = 150;
export const PAD_X = 14;
export const WIN_W = 122;
export const WIN_Y = 32;
export const CAP_W = 123;
export const MIN_RATIO = 0.5;
export const MAX_RATIO = 2;

let measureEl: HTMLDivElement | null = null;

function getMeasureEl(): HTMLDivElement {
  if (measureEl) return measureEl;
  const el = document.createElement('div');
  el.style.cssText =
    `position:absolute;left:-9999px;top:0;visibility:hidden;width:${CAP_W}px;` +
    `font-family:'Shantell Sans','Comic Sans MS',cursive;font-weight:300;font-size:11.5px;` +
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
  const r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio || 1));
  const winH = Math.round(WIN_W / r);
  const winBottom = WIN_Y + winH;
  const capY = winBottom + 3;
  const H = captionHeight ? capY + captionHeight + 16 : winBottom + 18;
  return {
    W: STAMP_W,
    H,
    winX: PAD_X,
    winY: WIN_Y,
    winW: WIN_W,
    winH,
    capY,
    capH: captionHeight,
    clamped: r !== ratio,
  };
}
