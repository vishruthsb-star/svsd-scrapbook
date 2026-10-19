import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import { ThemeNavigation } from '@/components/ThemeNavigation';
import type { ThemeNavigationValue } from '@/components/ThemeNavigation';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { SAFE } from '../../constants';
import { hash } from '../../itemSeed';
import './ThemeSpreads.css';
import { THEME_PANELS } from './themeSpreadsData';

export interface ThemeSpreadsProps {
  view: 'own' | 'visitor';
  headerDelta: number;
  ownerName: string;
  frameW: number;
  frameH: number;
  designX0: number;
}

/**
 * Wraps one piece of a panel's hand-placed content (an item, or a static extra like
 * "press play") and reports its real rendered bottom edge back up — in offset-parent-
 * relative terms (`offsetTop + offsetHeight`), which is unaffected by the panel content's
 * own `translateY(headerDelta)` transform (transforms don't change layout offsets) and by
 * the panel's current scroll position (unlike `getBoundingClientRect`). The caller adds
 * `headerDelta` back in once, for the actual on-screen bottom.
 */
function MeasuredBlock({
  blockId,
  onBottomMeasured,
  className,
  style,
  children,
}: {
  blockId: string;
  onBottomMeasured: (blockId: string, bottom: number) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.offsetTop + el.offsetHeight;
    if (bottom > 0) onBottomMeasured(blockId, bottom);
  });

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Frame 1g ("theme spreads") from references/Scrapbook Directions.dc.html — four
 * horizontally-snapping panels (late nights / laughing / trips / songs), each a full-bleed
 * grid-paper page with a circled theme word, hand-drawn annotations, and 2-4 items. Uses
 * the repo's existing <ThemeNavigation/> instead of recreating the reference's own inline
 * pill — driven here as a controlled component kept in lockstep with the scroller, exactly
 * like the reference's `gScroll`/`go()`.
 *
 * Full-bleed vs hand-placed (Volume 1 SPEC OVERRIDES): each panel is `frameW` wide
 * (full-bleed) and the scroller snaps/scrolls in increments of `frameW`, not the
 * reference's fixed 390. Everything hand-placed at reference coordinates (the circled
 * word, ink annotations, "press play"/READ THIS sticky/"put these on", and every item) is
 * offset by `designX0` so it lands in the same position relative to the reference's
 * 390-wide design box. The theme nav itself is bottom-anchored to the full frame (centered
 * across `frameW`, no designX0 offset), per the overrides' "bottom-anchored elements...
 * anchor to the frame bottom" rule.
 *
 * HEADER GAP: `headerDelta` is applied as `translateY` to everything in a panel EXCEPT its
 * background grid rect — so the grid texture stays anchored edge to edge while the
 * ink/word/items keep the reference's gap below the header.
 *
 * VERTICAL SCROLL (this task's CHANGE 2): each panel owns its own vertical scroll
 * container (independent scroll position per panel, not reset when swiping between
 * themes), sized to `max(frameH, lowestContentBottom + SAFE.bottom + navHeight + 24)` so
 * the lowest item can scroll fully clear of the bottom-anchored ThemeNavigation. The grid
 * rect and the hand-placed content div are both inside that same scrollable element (as
 * siblings) so they scroll together, while the grid itself still isn't shifted by
 * `headerDelta` — at `scrollTop: 0` everything lands exactly where it did before this
 * change. `lowestContentBottom` and `navHeight` are measured from the real rendered DOM
 * (item heights are content-driven — see envelopesLipGeometry.ts's identical note on
 * Stamp/Note/etc. — not a fixed per-type guess), via `MeasuredBlock` / a ref on the nav.
 */
export default function ThemeSpreads({ view, headerDelta, ownerName, frameW, frameH, designX0 }: ThemeSpreadsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [panelBottoms, setPanelBottoms] = useState<Record<string, Record<string, number>>>({});

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    setNavHeight(el.getBoundingClientRect().height);
  }, []);

  const handleBottomMeasured = useCallback((panelId: string, blockId: string, bottom: number) => {
    setPanelBottoms((prev) => {
      if (prev[panelId]?.[blockId] === bottom) return prev;
      return { ...prev, [panelId]: { ...prev[panelId], [blockId]: bottom } };
    });
  }, []);

  const handleNavChange = (value: ThemeNavigationValue) => {
    const index = THEME_PANELS.findIndex((p) => p.id === value);
    if (index < 0) return;
    scrollerRef.current?.scrollTo({ left: index * frameW, behavior: 'smooth' });
    setActive(index);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / frameW);
    if (i !== active) setActive(i);
  };

  return (
    <div className="theme-spreads-root">
      <div ref={scrollerRef} className="theme-spreads-scroller" onScroll={handleScroll}>
        {THEME_PANELS.map((panel) => {
          const lowestBottom = Math.max(0, ...Object.values(panelBottoms[panel.id] ?? {}));
          const panelContentH = Math.max(frameH, lowestBottom + headerDelta + SAFE.bottom + navHeight + 24);

          return (
            <div key={panel.id} className="theme-spreads-panel" style={{ width: frameW, height: frameH }}>
              <div className="theme-spreads-panel-scroll" style={{ touchAction: 'pan-x pan-y' }}>
                <div className="theme-spreads-panel-inner" style={{ height: panelContentH }}>
                  <svg className="theme-spreads-panel-grid" width={frameW} height={panelContentH}>
                    <rect width={frameW} height={panelContentH} fill="url(#sd-grid)" />
                  </svg>
                  <div className="theme-spreads-panel-content" style={{ transform: `translateY(${headerDelta}px)` }}>
                    <svg className="theme-spreads-panel-ink" width={frameW} height={frameH}>
                      <g
                        style={{ filter: 'url(#ink)' }}
                        fill="none"
                        stroke="#111111"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform={`translate(${designX0}, 0)`}
                      >
                        {panel.ink.map((p) => (
                          <path key={p.d} d={p.d} strokeWidth={p.strokeWidth} strokeDasharray={p.strokeDasharray} />
                        ))}
                      </g>
                    </svg>
                    <div className="theme-spreads-word" style={{ left: panel.wordLeft + designX0 }}>
                      {panel.word}
                    </div>
                    {panel.id === 'late-nights' && (
                      <MeasuredBlock
                        blockId="press-play"
                        onBottomMeasured={(id, b) => handleBottomMeasured(panel.id, id, b)}
                        className="theme-spreads-press-play"
                        style={{ left: 36 + designX0 }}
                      >
                        press play
                      </MeasuredBlock>
                    )}
                    {panel.id === 'laughing' && (
                      <MeasuredBlock
                        blockId="sticky"
                        onBottomMeasured={(id, b) => handleBottomMeasured(panel.id, id, b)}
                        className="theme-spreads-sticky"
                        style={{ left: 238 + designX0 }}
                      >
                        READ THIS
                        <div className="theme-spreads-sticky-tape" />
                      </MeasuredBlock>
                    )}
                    {panel.id === 'songs' && (
                      <MeasuredBlock
                        blockId="put-on"
                        onBottomMeasured={(id, b) => handleBottomMeasured(panel.id, id, b)}
                        className="theme-spreads-put-on"
                        style={{ left: 112 + designX0 }}
                      >
                        put these on
                      </MeasuredBlock>
                    )}
                    {panel.items.map(([id, placement]) => {
                      const it = mk(id, placement);
                      return (
                        <MeasuredBlock
                          key={id}
                          blockId={id}
                          onBottomMeasured={(bid, b) => handleBottomMeasured(panel.id, bid, b)}
                          className="theme-spreads-item"
                          style={{ left: (it.x ?? 0) + designX0, top: it.y ?? 0 }}
                        >
                          <ScrapbookItem
                            id={it.id}
                            type={it.type}
                            text={it.text}
                            label={it.label}
                            city={it.city}
                            date={it.date}
                            year={it.year}
                            denom={it.denom}
                            dur={it.dur}
                            src={it.src}
                            ratio={it.ratio}
                            from={it.from}
                            owner={ownerName}
                            view={view}
                            attach={it.attach}
                            rot={it.rot}
                            zoom={it.z}
                            seed={hash(it.id)}
                          />
                        </MeasuredBlock>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={navRef} className="theme-spreads-nav">
        <ThemeNavigation value={THEME_PANELS[active].id} onChange={handleNavChange} />
      </div>
    </div>
  );
}
