import type { ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { PillButton } from '@/components/PillButton';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import { hash } from '../../itemSeed';
import './EnvelopesLip.css';
import type { LipItem } from './envelopesLipGeometry';
import { buildEnvelopes, envelopePageForMemory } from './envelopesLipGeometry';
import type { PlacedMemory } from '@/scrapbook/placement';
import { revealInScroller, useTargetReveal } from '../../revealTarget';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { BoopStamp } from '@/components/BoopFab';
import { targetIdForElement } from '@/scrapbook/placement/dynamicLayout';

export interface EnvelopesLipProps {
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
  onRemoveItem?: (id: string) => void;
}

/**
 * Wraps one item's positioned div and reports two real-DOM measurements back up, in a
 * layout effect so corrections land before the browser ever paints a guessed position:
 *
 * - its own unrotated rendered height (see buildEnvelopes's `measuredHeights` doc) — used
 *   for the item's own `y` (reference semantics: `y = 132 - h`, unrotated height).
 * - (CHANGE 1, closed state only) the real ROTATED top edge of `.decor-wrap` (the element
 *   Stamp/Note/VoicePostcard/ParcelTag's shared <Decor/> actually applies `rot` to), as a
 *   delta from this wrapper's own unrotated top. `transform: rotate(...)` doesn't affect
 *   CSS layout sizing, so this can't be derived from the height alone — it's measured
 *   directly so the 44px envelope gap is correct against the item's true visual extent,
 *   not its axis-aligned box.
 */
function LipItemSlot({
  it,
  onHeightMeasured,
  onRotatedTopMeasured,
  children,
}: {
  it: LipItem;
  onHeightMeasured: (id: string, height: number) => void;
  onRotatedTopMeasured: (id: string, delta: number) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wrapRect = el.getBoundingClientRect();
    if (wrapRect.height > 0) onHeightMeasured(it.id, wrapRect.height);
    if (!it.flip) {
      const rotated = el.querySelector<HTMLElement>('.decor-wrap');
      if (rotated) onRotatedTopMeasured(it.id, rotated.getBoundingClientRect().top - wrapRect.top);
    }
  });

  return (
    <div
      ref={ref}
      className="envelopes-lip-item"
      style={{
        left: it.x,
        top: it.y,
        opacity: it.op,
        pointerEvents: it.flip ? 'auto' : 'none',
        transition: `left 420ms cubic-bezier(.2,.8,.2,1) ${it.delay}ms, top 420ms cubic-bezier(.2,.8,.2,1) ${it.delay}ms, opacity 200ms`,
      }}
    >
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

function LipScrapbookItem({ it, ownerName, view, onRemoveItem }: { it: LipItem; ownerName: string; view: 'own' | 'visitor'; onRemoveItem?: (id: string) => void }) {
  if (it.boop) return <div style={{ width: it.boop.width, transform: `rotate(${it.rot}deg)` }}><BoopStamp stampKey={it.boop.stampDesignId} senderName={it.boop.senderId} className="canvas-boop-stamp" /></div>;
  const memory = it.memory;
  if (memory) return <ScrapbookItem id={memory.id} type={memory.kind} text={memory.text} date={it.date} year={it.year} src={memory.kind === 'voice' ? undefined : memory.src} audioSrc={memory.kind === 'voice' ? memory.src : undefined} url={memory.url} ratio={memory.ratio} from={memory.authorId} owner={ownerName} view={view} rot={it.rot} zoom={it.z} seed={memory.seed} onRemove={view === 'own' ? onRemoveItem : undefined} />;
  return <ScrapbookItem id={it.id} type={it.type} text={it.text} label={it.label} city={it.city} date={it.date} year={it.year} denom={it.denom} dur={it.dur} src={it.src} ratio={it.ratio} from={it.from} owner={ownerName} view={view} attach={it.attach} rot={it.rot} zoom={it.z} seed={hash(it.id)} />;
}

/**
 * Frame 1f-4 ("pocket lip") from references/Scrapbook Directions.dc.html, whose screen is
 * `<dc-import name="EnvelopePhone" look="lip" gap="{{ e4Gap }}">` — the real implementation
 * is references/EnvelopePhone.dc.html's `look === 'lip'` branch. See
 * envelopesLipGeometry.ts for the ported data/algorithm; this component is the markup +
 * the open/close interaction around it.
 *
 * Closed, a lip envelope shows only its minimal "pocket" band (one ink line, a thumb-notch
 * cutout shape, a small label holder) with up to 4 items standing upright in the slot
 * above it — the full body+flap outline stays invisible (`bodyOp: 0`) until opened, at
 * which point it draws itself in (`draw`'s stroke-dashoffset animation) while the envelope
 * drops to the bottom of the screen and its items rise into a 6-item fan.
 *
 * THE ONLY DESIGN CHANGE from the reference (per this task): the "Put them back" button
 * reuses AddFab's pill visual via the shared <PillButton/> (not the reference's old SF Pro
 * inline style), and the page's own AddFab (mounted by ScrapbookCanvasPage, top-right)
 * stays visible/interactive while an envelope is open instead of fading — the reference's
 * own internal AddFab used to hide itself via `hidden={{envOpen}}`; this page doesn't wire
 * that at all, so ours never fades.
 */
export default function EnvelopesLip({ view, headerDelta, ownerName, frameW, frameH, designX0, items = [], boopStamps = [], scrollTargetId, onScrollTargetHandled, onRemoveItem }: EnvelopesLipProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState(-1);
  const [measuredH, setMeasuredH] = useState<Record<string, number>>({});
  const [rotatedDeltas, setRotatedDeltas] = useState<Record<string, number>>({});
  const [pages, setPages] = useState<Record<number, number>>({});
  const [appliedTarget, setAppliedTarget] = useState<string | null>(null);
  const includeFixtures = items.length === 0 && boopStamps.length === 0;
  const targetMemory = scrollTargetId ? [...items, ...boopStamps].find((item) => targetIdForElement(item) === scrollTargetId) : undefined;
  const targetLocation = targetMemory ? envelopePageForMemory(targetMemory, items, boopStamps, includeFixtures) : undefined;
  const targetEnvelopeIndex = targetLocation?.envelopeIndex;
  const targetPage = targetLocation?.page;
  if (scrollTargetId && targetLocation && appliedTarget !== scrollTargetId) {
    setAppliedTarget(scrollTargetId);
    if (pages[targetLocation.envelopeIndex] !== targetLocation.page) setPages({ ...pages, [targetLocation.envelopeIndex]: targetLocation.page });
    if (openIndex !== targetLocation.envelopeIndex) setOpenIndex(targetLocation.envelopeIndex);
  } else if (!scrollTargetId && appliedTarget !== null) setAppliedTarget(null);

  const handleHeightMeasured = useCallback((id: string, h: number) => {
    setMeasuredH((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);
  const handleRotatedTopMeasured = useCallback((id: string, delta: number) => {
    setRotatedDeltas((prev) => (prev[id] === delta ? prev : { ...prev, [id]: delta }));
  }, []);

  const { envs, innerH } = buildEnvelopes(openIndex, headerDelta, frameH, measuredH, rotatedDeltas, items, boopStamps, pages, includeFixtures);
  const any = openIndex >= 0;

  const toggle = (i: number) => {
    const open = openIndex === i;
    if (!open) scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (!open) setPages((current) => ({ ...current, [i]: 0 }));
    setOpenIndex(open ? -1 : i);
  };

  useLayoutEffect(() => {
    if (targetEnvelopeIndex === undefined) return;
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [targetEnvelopeIndex, targetPage]);

  const reveal = useCallback((target: HTMLElement) => {
    const scroller = scrollerRef.current;
    if (scroller) revealInScroller(scroller, target, 138, 110);
  }, []);
  const targetReady = !targetLocation || (openIndex === targetLocation.envelopeIndex && (pages[targetLocation.envelopeIndex] ?? 0) === targetLocation.page);
  useTargetReveal({ targetId: scrollTargetId, ready: targetReady, rootRef: scrollerRef, reveal, onHandled: onScrollTargetHandled });

  return (
    <div className="envelopes-lip-root">
      <div ref={scrollerRef} className="envelopes-lip-scroll">
        <div className="envelopes-lip-content" style={{ height: innerH }}>
          <svg className="envelopes-lip-bg" width={frameW} height={innerH}>
            <rect width={frameW} height={innerH} fill="url(#sd-dot)" />
          </svg>
          {envs.map((ev, i) => (
            <div
              key={ev.label}
              className="envelopes-lip-envelope"
              style={{
                left: 30 + designX0,
                transform: `translateY(${ev.y}px)`,
                opacity: ev.op,
                pointerEvents: ev.pe,
              }}
              onClick={() => toggle(i)}
            >
              {/* Body + flap: invisible until open, then draws itself in (stroke-dashoffset). */}
              <svg className="envelopes-lip-body" width="330" height="196" style={{ opacity: ev.bodyOp }}>
                <g style={{ filter: 'url(#ink)' }} stroke="#111111" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
                  <path
                    className="envelopes-lip-body-path"
                    d="M2 4 L328 2 L329 194 L3 195 Z"
                    fill="#FAF7F0"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={ev.draw}
                  />
                  <path
                    className="envelopes-lip-flap-path"
                    d="M2 4 L165 -54 L328 2"
                    fill="none"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={ev.draw}
                  />
                </g>
              </svg>

              {ev.items.map((it) => <LipItemSlot key={it.id} it={it} onHeightMeasured={handleHeightMeasured} onRotatedTopMeasured={handleRotatedTopMeasured}><div data-scrapbook-item-id={it.memory || it.boop ? targetIdForElement(it.boop ?? it.memory!) : undefined}><LipScrapbookItem it={it} ownerName={ownerName} view={view} onRemoveItem={onRemoveItem} /></div></LipItemSlot>)}

              {/* Always-visible pocket: one ink line, thumb notch, small label holder. */}
              <svg className="envelopes-lip-pocket" width="330" height="196">
                <path d="M-6 100 L128 101 Q165 120 202 101 L336 100 L336 154 L-6 154 Z" fill="#F6F1E6" />
                <g style={{ filter: 'url(#ink)' }} fill="none" stroke="#111111" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M-2 100 L128 101 Q165 120 202 101 L332 100" />
                </g>
              </svg>
              <div className="envelopes-lip-label-holder">
                <svg width="100" height="26">
                  <g style={{ filter: 'url(#ink)' }} fill="none" stroke="#111111" strokeWidth={1.3}>
                    <path d="M1 1 L99 2 L98 25 L2 24 Z" />
                    <path d="M6 6 L94 6 L94 20 L6 20 Z" strokeWidth={0.9} />
                  </g>
                </svg>
                <div className="envelopes-lip-label-text">{ev.label}</div>
              </div>
              {openIndex === i && ev.pageCount > 1 && (
                <div className="envelopes-lip-pages" onClick={(event) => event.stopPropagation()}>
                  <button type="button" disabled={ev.page === 0} onClick={() => setPages((current) => ({ ...current, [i]: Math.max(0, ev.page - 1) }))}>previous</button>
                  <span>{ev.page + 1} / {ev.pageCount}</span>
                  <button type="button" disabled={ev.page === ev.pageCount - 1} onClick={() => setPages((current) => ({ ...current, [i]: Math.min(ev.pageCount - 1, ev.page + 1) }))}>next</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {any && (
        <div className="envelopes-lip-putback-wrap">
          <PillButton onClick={() => setOpenIndex(-1)}>Put them back</PillButton>
        </div>
      )}
    </div>
  );
}
