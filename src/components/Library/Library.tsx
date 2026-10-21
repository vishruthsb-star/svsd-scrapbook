import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties, type MouseEvent } from 'react';
import { buildDrawerGeometry, buildFolderGeometry, compH } from './geometry';
import { emptyFolderRefs, useLibraryMotion } from './useLibraryMotion';
import {
  CARD_WIDTH,
  DEFAULT_LIBRARY_CONFIG,
  DEFAULT_LIBRARY_PEOPLE,
  DEFAULT_SELECTED_INDEX,
  FONT_STACKS,
  type LibraryConfig,
  type LibraryPerson,
} from './types';
import { DEFAULT_INK, FIELD_PAPER } from '../../utils/filters';
import './Library.css';

export interface LibraryProps {
  people?: LibraryPerson[];
  selected?: number;
  defaultSelected?: number;
  onSelect?: (index: number) => void;
  /** fires when the currently open folder's cover is tapped */
  onOpen?: (index: number) => void;
  config?: Partial<LibraryConfig>;
  className?: string;
}

type RootStyle = CSSProperties & { '--lib-paper'?: string; '--lib-ink'?: string };

export default function Library({
  people = DEFAULT_LIBRARY_PEOPLE,
  selected,
  defaultSelected = DEFAULT_SELECTED_INDEX,
  onSelect,
  onOpen,
  config,
  className,
}: LibraryProps) {
  const n = people.length;

  // Unique per instance, so two <Library>s on one page never share a filter/pattern id.
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const inkId = `lib-ink-${rawId}`;
  const inkTabId = `lib-inkTab-${rawId}`;
  const softId = `lib-soft-${rawId}`;
  const hatchId = `lib-hatch-${rawId}`;

  const cfg = useMemo<LibraryConfig>(() => ({ ...DEFAULT_LIBRARY_CONFIG, ...config }), [config]);

  const [internalSel, setInternalSel] = useState(defaultSelected);
  const isControlled = selected !== undefined;
  const sel = isControlled ? selected : internalSel;

  const { refsRef, stackRef, compRef, goTo, selRef } = useLibraryMotion(n, cfg, people, sel);

  // Catches up the motion system with `sel` for any change that didn't come through
  // handleTabClick below (i.e. a controlled parent changing `selected`). goTo is a no-op
  // if the motion system is already there, so this never double-fires the click path.
  useEffect(() => {
    if (sel !== selRef.current) goTo(sel, { press: false });
  }, [sel, goTo, selRef]);

  const handleTabClick = useCallback(
    (i: number) => {
      const wasSelected = i === selRef.current;
      goTo(i, { press: true });
      if (wasSelected) return;
      if (!isControlled) setInternalSel(i);
      onSelect?.(i);
    },
    [goTo, selRef, isControlled, onSelect],
  );

  const handleCoverClick = useCallback(
    (i: number) => {
      if (i === selRef.current) onOpen?.(i);
    },
    [selRef, onOpen],
  );

  const folderGeoms = useMemo(() => people.map((p, i) => buildFolderGeometry(i, n, p, cfg)), [people, n, cfg]);
  const drawerGeom = useMemo(() => buildDrawerGeometry(cfg), [cfg]);
  const height = compH(cfg.lip, cfg.crop);

  const inkOn = cfg.quality > 0;
  const inkFilter = inkOn ? `url("#${inkId}")` : 'none';
  const inkTabFilter = inkOn ? `url("#${inkTabId}")` : 'none';
  const softFilter = `url("#${softId}")`;
  const hatchFill = `url("#${hatchId}")`;
  const font = FONT_STACKS[cfg.font];
  const dispScale = ((2.4 * cfg.quality) / 100).toFixed(2);

  const rootStyle: RootStyle = {
    width: CARD_WIDTH,
    height,
    overflow: 'hidden',
    '--lib-paper': FIELD_PAPER,
    '--lib-ink': DEFAULT_INK,
  };

  return (
    <div className={`library-root${className ? ' ' + className : ''}`} style={rootStyle} ref={compRef}>
      <div className="library-stack" ref={stackRef} role="tablist" aria-label="people">
        {people.map((p, i) => {
          const g = folderGeoms[i];
          const isSel = i === sel;
          const getRefs = () => {
            if (!refsRef.current[i]) refsRef.current[i] = emptyFolderRefs();
            return refsRef.current[i];
          };
          return (
            <div
              key={p.name + i}
              className="library-folder"
              style={{ zIndex: i * 10 }}
              ref={(el) => {
                getRefs().folder = el;
              }}
            >
              <div
                className="library-lift"
                ref={(el) => {
                  getRefs().lift = el;
                }}
              >
                <div
                  className="library-press"
                  ref={(el) => {
                    getRefs().press = el;
                  }}
                  style={{ transformOrigin: `${g.pressOriginX.toFixed(1)}px ${g.pressOriginY.toFixed(1)}px` }}
                >
                  <svg
                    className="library-f library-op"
                    style={{ opacity: 0 }}
                    ref={(el) => {
                      getRefs().sh = el;
                    }}
                  >
                    <path d={g.bodyD} transform="translate(0 3)" style={{ fill: '#000', stroke: 'none', filter: softFilter }} />
                  </svg>

                  <svg className="library-f">
                    <g style={{ filter: inkFilter }}>
                      <path d={g.bodyD} style={{ fill: 'var(--lib-paper)', strokeWidth: cfg.stroke }} />
                      <path d={g.pshadowD} style={{ fill: 'var(--lib-ink)', stroke: 'none' }} />
                      {/* the cover: one full-width hatched panel, no inner rectangles — swap this fill for real media later */}
                      <path d={g.frameD} style={{ fill: cfg.preview === 'shaded' ? hatchFill : 'var(--lib-paper)', strokeWidth: cfg.stroke * 0.75 }} />
                    </g>
                  </svg>

                  {/* fill + unread mark live in their own small layers with an identical ink filter, so
                      fading them never re-filters (and re-rasterizes) the whole folder */}
                  <svg
                    className="library-f library-op"
                    style={{ opacity: isSel ? 1 : 0 }}
                    ref={(el) => {
                      getRefs().fillSvg = el;
                    }}
                  >
                    <g style={{ filter: inkTabFilter }}>
                      <path d={g.fillD} style={{ fill: 'var(--lib-ink)', stroke: 'none' }} />
                    </g>
                  </svg>
                  <svg
                    className="library-f library-op"
                    style={{ opacity: p.unread ? 1 : 0 }}
                    ref={(el) => {
                      getRefs().markSvg = el;
                    }}
                  >
                    <g style={{ filter: inkTabFilter }}>
                      <path d={g.markD} style={{ fill: '#D8422C', stroke: 'none' }} />
                    </g>
                  </svg>

                  {/* clickable cover — only the currently open folder's panel is reachable */}
                  <div
                    className="library-cover-hit"
                    style={{
                      left: g.frameX,
                      top: g.frameY,
                      width: g.frameW,
                      height: g.frameH,
                      pointerEvents: isSel ? 'auto' : 'none',
                      cursor: isSel ? 'pointer' : 'default',
                    }}
                    onClick={() => handleCoverClick(i)}
                    aria-hidden={!isSel}
                  />

                  <button
                    type="button"
                    className="library-tabname"
                    role="tab"
                    aria-selected={isSel}
                    style={{
                      left: g.tabLeft,
                      width: g.tabWidthPx,
                      top: g.tabTopPx,
                      height: g.tabHeightPx,
                      lineHeight: `${g.tabHeightPx}px`,
                      fontSize: g.fontSizePx,
                      fontFamily: font[0],
                      fontWeight: font[1],
                    }}
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleTabClick(i);
                    }}
                  >
                    <span
                      ref={(el) => {
                        getRefs().lInk = el;
                      }}
                      style={{ color: 'var(--lib-ink)', opacity: isSel ? 0 : 1 }}
                    >
                      {p.name}
                    </span>
                    <span
                      ref={(el) => {
                        getRefs().lPaper = el;
                      }}
                      style={{ color: 'var(--lib-paper)', opacity: isSel ? 1 : 0 }}
                    >
                      {p.name}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="library-drawer" style={{ top: drawerGeom.top }}>
        <svg className="library-f">
          <g style={{ filter: inkFilter }}>
            <path d={drawerGeom.d} style={{ fill: 'var(--lib-paper)', strokeWidth: cfg.stroke }} />
            <path d={drawerGeom.creaseD} style={{ strokeWidth: cfg.stroke * 0.8 }} />
          </g>
        </svg>
      </div>

      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id={inkId} filterUnits="userSpaceOnUse" x={-10} y={-90} width={392} height={720}>
            <feTurbulence type="fractalNoise" baseFrequency={cfg.grain} numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={dispScale} />
          </filter>
          <filter id={inkTabId} filterUnits="userSpaceOnUse" x={-10} y={-80} width={392} height={100}>
            <feTurbulence type="fractalNoise" baseFrequency={cfg.grain} numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={dispScale} />
          </filter>
          <filter id={softId} filterUnits="userSpaceOnUse" x={-10} y={-90} width={392} height={720}>
            <feGaussianBlur stdDeviation={6} />
          </filter>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width={cfg.hatch} height={cfg.hatch} patternTransform="rotate(45)">
            <rect width={cfg.hatch} height={cfg.hatch} fill="#ECE6D8" />
            <path d={`M0.5 0 L0.5 ${cfg.hatch}`} stroke="#111" strokeWidth={1} strokeOpacity={0.55} />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}
