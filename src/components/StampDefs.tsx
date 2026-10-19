import { HATCH_PATTERN_ID, INK_FILTER_ID } from '../utils/filters';

/**
 * The `#ink` displacement filter and `#h-d` hatch pattern used by every <Stamp />.
 * Render this once near the root of the app — SVG filters/patterns are referenced by
 * id via `filter: url(#ink)` / `fill: url(#h-d)`, so a single shared <defs> is enough.
 */
export default function StampDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id={INK_FILTER_ID} filterUnits="userSpaceOnUse" x="-300" y="-300" width="2400" height="2400">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
        <pattern id={HATCH_PATTERN_ID} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" style={{ stroke: '#111111', strokeWidth: 1.1 }} />
        </pattern>
      </defs>
    </svg>
  );
}
