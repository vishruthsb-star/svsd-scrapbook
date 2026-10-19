import { useEffect, useMemo, useState } from 'react';
import { onFontsReady } from './layout';

/**
 * Shared "measure this text's rendered height from a hidden DOM mirror, and re-measure
 * once web fonts load" pattern — used by Stamp (caption) and ParcelTag (link line) so
 * neither re-implements the mount/update/fonts-ready wiring.
 *
 * The height is a pure derived value (`useMemo` on `text`); the only state is a counter
 * bumped by the fonts-ready *callback* (not the effect body itself), which is the
 * sanctioned effect pattern — "subscribe to an external system, call setState from its
 * callback" — rather than calling setState synchronously whenever `text` changes.
 */
export function useMeasuredHeight(text: string, measure: (text: string) => number): number {
  const [fontsVersion, setFontsVersion] = useState(0);

  useEffect(() => onFontsReady(() => setFontsVersion((v) => v + 1)), []);

  // fontsVersion is a trigger-only dependency — it's never read in the body, it just forces
  // a re-measure once fonts finish loading (font metrics change the actual wrapped height).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => measure(text), [text, fontsVersion, measure]);
}
