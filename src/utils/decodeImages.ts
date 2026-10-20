/**
 * Warms the browser's image cache/decode pipeline for a set of URLs ahead of their first
 * paint. Used to pre-decode the canvas screen's photos while Home is still the active tab,
 * so the first Home -> Journal switch doesn't stall on JPEG decode (see AppShell.tsx).
 * `img.decode()` both loads and fully decodes off the main thread where supported; browsers
 * without it (or that reject the promise) still benefit from the `src` assignment starting
 * the network fetch early. Failures are swallowed — a slow/broken decode just means that
 * image decodes on first paint as it would have anyway, not a hard error.
 */
export function decodeImages(urls: readonly string[]): void {
  for (const url of urls) {
    const img = new Image();
    img.src = url;
    void img.decode?.().catch(() => {});
  }
}
