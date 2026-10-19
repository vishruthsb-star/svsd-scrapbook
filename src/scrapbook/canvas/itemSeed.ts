/**
 * Verbatim port of the reference's `hash(s)` (Scrapbook Directions.dc.html) — turns an
 * item id into a deterministic numeric seed for the real item components' seeded-RNG
 * geometry/decor. Shared by every canvas style that renders items via `mk()`-placed ids
 * (currently TornStrata and ThemeSpreads).
 */
export function hash(s: string): number {
  return [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
}
