import { useLayoutEffect, useMemo, useRef } from 'react';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import './TornStrata.css';
import { buildStrata, hash, strataPageHeight } from './tornStrataGeometry';
import type { PlacedMemory } from '@/scrapbook/placement';
import { BoopStamp } from '@/components/BoopFab';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';

export interface TornStrataProps {
  view: 'own' | 'visitor';
  headerDelta: number;
  ownerName: string;
  frameW: number;
  frameH: number;
  designX0: number;
  items?: PlacedMemory[];
  boopStamps?: PlacedBoopStamp[];
  scrollTargetId?: string | null;
}

/**
 * Frame 1a ("torn strata") from references/Scrapbook Directions.dc.html — one torn-paper
 * strip per month, newest on top, DOM-ordered oldest-first so newer strips visually paint
 * over older ones. See tornStrataGeometry.ts for the ported data/algorithm; this component
 * is just the markup around it.
 *
 * Full-bleed vs hand-placed (Volume 1 SPEC OVERRIDES): each strip's torn-paper SVG is
 * full-bleed (`frameW` wide, via buildStrata). Everything hand-placed at reference
 * coordinates (the month label tape, "where it starts" text/arrow, and every item) is
 * offset by `designX0` so it lands in the same position relative to the reference's
 * 390-wide design box, centered within the real (possibly wider) frame.
 */
export default function TornStrata({ view, headerDelta, ownerName, frameW, designX0, items = [], boopStamps = [], scrollTargetId }: TornStrataProps) {
  const { strata, acc } = useMemo(() => buildStrata(headerDelta, frameW, items, boopStamps), [headerDelta, frameW, items, boopStamps]);
  const sH = strataPageHeight(acc, view);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTargetRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!scrollTargetId || scrollTargetId === lastTargetRef.current) return;
    lastTargetRef.current = scrollTargetId;
    const frame = requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const target = scroller?.querySelector<HTMLElement>(`[data-scrapbook-item-id="${scrollTargetId}"]`);
      if (!scroller || !target) return;
      const viewport = scroller.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const topSafe = viewport.top + 138;
      const bottomSafe = viewport.bottom - 108;
      if (item.top >= topSafe && item.bottom <= bottomSafe) return;
      const targetTop = Math.max(0, scroller.scrollTop + item.top - viewport.top - (scroller.clientHeight - item.height) / 2 + 16);
      scroller.scrollTo({ top: targetTop, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTargetId, sH]);

  return (
    <div className="torn-strata-root">
      <div ref={scrollRef} className="torn-strata-scroll">
        <div className="torn-strata-content" style={{ height: sH }}>
          {strata.map((strip) => (
            <div key={strip.label} className="torn-strata-strip" style={{ top: strip.top, width: frameW, height: strip.hh }}>
              <svg className="torn-strata-svg" width={frameW} height={strip.svgH}>
                <path d={strip.fib} fill="#FFFFFF" />
                <path d={strip.main} fill={`url(#sd-${strip.tex})`} />
              </svg>
              <div className="torn-strata-label" style={{ left: 20 + designX0, top: strip.labelTop }}>
                {strip.label}
              </div>
              {strip.isQuiet && <div className="torn-strata-quiet">a quiet stretch</div>}
              {strip.isFirst && (
                <>
                  <div className="torn-strata-first-text" style={{ left: 22 + designX0 }}>
                    where it starts
                  </div>
                  <svg className="torn-strata-first-arrow" width="80" height="60" style={{ left: 60 + designX0 }}>
                    <g style={{ filter: 'url(#ink)' }}>
                      <path d="M8 46 C16 24 34 12 58 8 M48 2 L59 8 L50 17" />
                    </g>
                  </svg>
                </>
              )}
              {strip.items.map((it) => (
                <div key={it.id} className="torn-strata-item" style={{ left: (it.x ?? 0) + designX0, top: it.y }}>
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
                </div>
              ))}
              {strip.dynamicItems.map(({ memory, x, y, rot, z }) => {
                const date = new Date(memory.createdAt);
                return <div key={memory.id} data-scrapbook-item-id={memory.id} className="torn-strata-item torn-strata-item--created" style={{ left: x + designX0, top: y }}>
                  <ScrapbookItem
                    id={memory.id}
                    type={memory.kind}
                    text={memory.text}
                    date={date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    year={String(date.getFullYear())}
                    src={memory.kind === 'voice' ? undefined : memory.src}
                    audioSrc={memory.kind === 'voice' ? memory.src : undefined}
                    url={memory.url}
                    ratio={memory.ratio}
                    from={memory.authorId}
                    owner={ownerName}
                    view={view}
                    rot={rot}
                    zoom={z}
                    seed={memory.seed}
                  />
                </div>;
              })}
              {strip.boopStamps.map(({ stamp, x, y }) => <div key={stamp.id} data-scrapbook-item-id={stamp.id} className="torn-strata-boop" style={{ left: x + designX0, top: y, width: stamp.width, transform: `rotate(${stamp.rotation}deg)` }}><BoopStamp stampKey={stamp.stampKey} recipientName={stamp.recipientName} /></div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
