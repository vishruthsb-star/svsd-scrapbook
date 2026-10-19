/**
 * Verbatim port of the reference's `rng(seed)` (both Scrapbook Directions.dc.html and
 * WheelPhone.dc.html define the identical 16807 Lehmer/Park-Miller LCG) — shared by every
 * canvas style that needs seeded, deterministic "random" geometry (currently TornStrata's
 * `tear()` and PaperWheel's `torn()`).
 */
export function rng(seed: number): () => number {
  let x = (Math.abs(seed) % 2147483646) + 1;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}
