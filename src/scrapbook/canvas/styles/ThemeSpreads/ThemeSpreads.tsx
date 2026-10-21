import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import { ThemeNavigation } from '@/components/ThemeNavigation';
import type { ThemeNavigationValue } from '@/components/ThemeNavigation';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { hash } from '../../itemSeed';
import './ThemeSpreads.css';
import { THEME_PANELS } from './themeSpreadsData';
import { packThemeMemories } from './themeSpreadsGeometry';
import type { PlacedMemory } from '@/scrapbook/placement';
import { revealInScroller, useTargetReveal } from '../../revealTarget';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { BoopStamp } from '@/components/BoopFab';
import { isBoopStamp, targetIdForElement, themeForElement } from '@/scrapbook/placement/dynamicLayout';

export interface ThemeSpreadsProps {
  view: 'own' | 'visitor';
  headerDelta: number;
  ownerName: string;
  frameW: number;
  frameH: number;
  designX0: number;
  items?: PlacedMemory[];
  boopStamps?: PlacedBoopStamp[];
  scrollTargetId?: string | null;
  onScrollTargetHandled?: (id: string) => void;
}

/**
 * Distance from the frame bottom to this style's own ThemeNavigation (ThemeSpreads.css's
 * `.theme-spreads-nav`). Was `var(--safe-bottom)` (32px) until the app-shell-level
 * HomeBottomNavigation (AppShell.css, mounted above every screen incl. this one at
 * bottom:40px, 53px tall) landed directly on top of it — moved above that 93px footprint
 * plus a 16px gap. Shared with the CSS file via the `--theme-nav-bottom` custom property set
 * below, and with the panel-height formula below, so the two can't drift apart.
 */
const THEME_NAV_BOTTOM = 109;

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
 * themes), sized to `max(frameH, lowestContentBottom + THEME_NAV_BOTTOM + navHeight + 24)`
 * so the lowest item can scroll fully clear of the bottom-anchored ThemeNavigation. The grid
 * rect and the hand-placed content div are both inside that same scrollable element (as
 * siblings) so they scroll together, while the grid itself still isn't shifted by
 * `headerDelta` — at `scrollTop: 0` everything lands exactly where it did before this
 * change. `lowestContentBottom` and `navHeight` are measured from the real rendered DOM
 * (item heights are content-driven — see envelopesLipGeometry.ts's identical note on
 * Stamp/Note/etc. — not a fixed per-type guess), via `MeasuredBlock` / a ref on the nav.
 */
export default function ThemeSpreads({ view, headerDelta, ownerName, frameW, frameH, designX0, items = [], boopStamps = [], scrollTargetId, onScrollTargetHandled }: ThemeSpreadsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const panelScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [active, setActive] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [panelBottoms, setPanelBottoms] = useState<Record<string, Record<string, number>>>({});
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const targetPanel = scrollTargetId ? [...items, ...boopStamps].find((item) => targetIdForElement(item) === scrollTargetId) : undefined;
  const targetIndex = targetPanel ? THEME_PANELS.findIndex((panel) => panel.id === themeForElement(targetPanel)) : -1;

  const packedByPanel = useMemo(() => Object.fromEntries(THEME_PANELS.map((panel) => [panel.id, packThemeMemories(panel, items, boopStamps, frameW, designX0, measuredHeights)])), [boopStamps, designX0, frameW, items, measuredHeights]);

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

  useLayoutEffect(() => {
    if (targetIndex < 0) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // This is an insertion-driven activation; use an immediate snap so the nested panel is
    // genuinely active before its DOM target is measured. Manual tab changes stay smooth.
    scroller.scrollTo({ left: targetIndex * frameW, behavior: 'auto' });
    setActive(targetIndex);
  }, [frameW, targetIndex]);

  const reveal = useCallback((target: HTMLElement) => {
    if (targetIndex < 0) return;
    const scroller = panelScrollRefs.current[THEME_PANELS[targetIndex].id];
    if (scroller) revealInScroller(scroller, target, 138, THEME_NAV_BOTTOM + navHeight + 16);
  }, [navHeight, targetIndex]);
  const targetReady = targetIndex < 0 || active === targetIndex;
  useTargetReveal({ targetId: scrollTargetId, ready: targetReady, rootRef: scrollerRef, findRoot: () => targetIndex >= 0 ? panelScrollRefs.current[THEME_PANELS[targetIndex].id] : null, reveal, onHandled: onScrollTargetHandled });

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / frameW);
    if (i !== active) setActive(i);
  };

  return (
    <div className="theme-spreads-root" style={{ '--theme-nav-bottom': `${THEME_NAV_BOTTOM}px` } as CSSProperties}>
      <div ref={scrollerRef} className="theme-spreads-scroller" onScroll={handleScroll}>
        {THEME_PANELS.map((panel) => {
          const lowestBottom = Math.max(0, ...Object.values(panelBottoms[panel.id] ?? {}));
          const panelContentH = Math.max(frameH, lowestBottom + headerDelta + THEME_NAV_BOTTOM + navHeight + 24);

          return (
            <div key={panel.id} className="theme-spreads-panel" style={{ width: frameW, height: frameH }}>
              <div ref={(element) => { panelScrollRefs.current[panel.id] = element; }} className="theme-spreads-panel-scroll" style={{ touchAction: 'pan-x pan-y' }}>
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
                    {packedByPanel[panel.id].map((placed) => {
                      const element = placed.element;
                      const isBoop = isBoopStamp(element);
                      const date = new Date(element.createdAt);
                      return (
                        <MeasuredBlock
                          key={element.id}
                          blockId={element.id}
                          onBottomMeasured={(id, bottom) => handleBottomMeasured(panel.id, id, bottom)}
                          className="theme-spreads-item theme-spreads-item--created"
                          style={{ left: placed.x, top: placed.y, width: isBoop ? element.width : undefined, transform: isBoop ? `rotate(${placed.rot}deg)` : undefined }}
                        >
                          <div
                            data-scrapbook-item-id={targetIdForElement(element)}
                            ref={(element) => {
                              if (!element || element.offsetHeight <= 0) return;
                              const height = element.offsetHeight / placed.z;
                              setMeasuredHeights((previous) => previous[placed.element.id] === height ? previous : { ...previous, [placed.element.id]: height });
                            }}
                          >
                            {isBoop ? <BoopStamp stampKey={element.stampKey} recipientName={element.recipientName} className="canvas-boop-stamp" /> : <ScrapbookItem id={element.id} type={element.kind} text={element.text} date={date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} year={String(date.getFullYear())} src={element.kind === 'voice' ? undefined : element.src} audioSrc={element.kind === 'voice' ? element.src : undefined} url={element.url} ratio={element.ratio} from={element.authorId} owner={ownerName} view={view} rot={placed.rot} zoom={placed.z} seed={element.seed} />}
                          </div>
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
