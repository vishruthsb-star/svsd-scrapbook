import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { pickDecor, type DecorPiece } from '../utils/decor';
import { inkStrokeWidths } from '../utils/geometry';
import { DEFAULT_INK, FIELD_WHITE, HATCH_PATTERN_ID, INK_FILTER_STYLE } from '../utils/filters';
import './Decor.css';

export interface DecorProps {
  /** the item's seed — decor is derived from this alone, so it never changes on re-render */
  seed: number;
  width: number;
  height: number;
  zoom?: number;
  rot?: number;
  ink?: string;
  field?: string;
  children: ReactNode;
}

type ZoomableStyle = CSSProperties & { zoom?: number };

/**
 * Wraps an item (a <FlipCard/>) with its random "stuck-on" decor — tape, a paperclip, or
 * torn corners — chosen deterministically from `seed` (see utils/decor.ts). Decor sits
 * outside the item's own clipped content, overhanging its edges, and never rotates with
 * the flip (it's "physically" on top of the card, not printed on either face).
 */
export default function Decor({ seed, width, height, zoom = 1, rot = 0, ink = DEFAULT_INK, field = FIELD_WHITE, children }: DecorProps) {
  const pieces = useMemo(() => pickDecor(seed, width), [seed, width]);
  const strokeWidth = inkStrokeWidths(zoom).thick;

  return (
    <div className="decor-wrap" style={{ width, height, zoom, transform: `rotate(${rot}deg)` } as ZoomableStyle}>
      {children}
      {pieces.map((piece, i) => (
        <DecorPieceSvg key={i} piece={piece} ink={ink} field={field} strokeWidth={strokeWidth} />
      ))}
    </div>
  );
}

function DecorPieceSvg({ piece, ink, field, strokeWidth }: { piece: DecorPiece; ink: string; field: string; strokeWidth: string }) {
  const hatch = `url(#${HATCH_PATTERN_ID})`;

  if (piece.variant === 'tape') {
    return (
      <svg
        className="decor-piece"
        width="74"
        height="28"
        style={{ left: piece.x, top: -14, transform: `rotate(${piece.rot}deg)`, stroke: ink, strokeWidth, strokeLinejoin: 'round' }}
      >
        <g style={INK_FILTER_STYLE}>
          <path d="M5 3 L69 1 L72 5 L68 9 L72 13 L68 17 L71 22 L5 26 L2 22 L6 18 L2 14 L6 10 L2 6 Z" style={{ fill: field }} />
          <path d="M5 3 L69 1 L72 5 L68 9 L72 13 L68 17 L71 22 L5 26 L2 22 L6 18 L2 14 L6 10 L2 6 Z" fill={hatch} style={{ stroke: 'none' }} />
        </g>
      </svg>
    );
  }

  if (piece.variant === 'clip') {
    return (
      <svg
        className="decor-piece"
        width="44"
        height="44"
        style={{ left: piece.x, top: -30, stroke: ink, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }}
      >
        <g style={INK_FILTER_STYLE}>
          <path d="M12 24 C10 15 8 9 9 3 L35 3 C36 9 34 15 32 24" />
          <path d="M5 23 L39 22 L36 38 L8 39 Z" style={{ fill: field }} />
          <path d="M5 23 L39 22 L36 38 L8 39 Z" fill={hatch} style={{ stroke: 'none' }} />
        </g>
      </svg>
    );
  }

  // corners: a pair of torn-corner triangles at top-left and bottom-right
  return (
    <>
      <svg className="decor-piece" width="30" height="30" style={{ left: -7, top: -7, stroke: ink, strokeWidth, strokeLinejoin: 'round' }}>
        <g style={INK_FILTER_STYLE}>
          <path d="M1 1 L29 2 L2 29 Z" style={{ fill: field }} />
          <path d="M1 1 L29 2 L2 29 Z" fill={hatch} style={{ stroke: 'none' }} />
        </g>
      </svg>
      <svg
        className="decor-piece"
        width="30"
        height="30"
        style={{ right: -7, bottom: -7, transform: 'rotate(180deg)', stroke: ink, strokeWidth, strokeLinejoin: 'round' }}
      >
        <g style={INK_FILTER_STYLE}>
          <path d="M1 1 L29 2 L2 29 Z" style={{ fill: field }} />
          <path d="M1 1 L29 2 L2 29 Z" fill={hatch} style={{ stroke: 'none' }} />
        </g>
      </svg>
    </>
  );
}
