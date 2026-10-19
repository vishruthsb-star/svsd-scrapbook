import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import { SAFE } from '../../constants';
import { hash } from '../../itemSeed';
import './PaperWheel.css';
import { RISE, WHEEL_D, buildWheel, effFromDi } from './paperWheelGeometry';

export interface PaperWheelProps {
  view: 'own' | 'visitor';
  headerDelta: number;
  ownerName: string;
  frameW: number;
  frameH: number;
  designX0: number;
}

const START_DI = 11; // di() default: cfg().n - 1

function buzz(p: number) {
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch {
    /* ignore */
  }
}

/**
 * Wraps one visible item and reports its real rendered bottom edge back up (CHANGE 2's
 * scroll-container height needs the selected month's real lowest item bottom — item
 * height is content-driven, not the fixed per-type guess; see envelopesLipGeometry.ts's
 * identical note). Uses `offsetTop + offsetHeight` (unaffected by the content layer's own
 * `translateY(headerDelta)` transform or by scroll position) — the caller adds
 * `headerDelta` back in once.
 */
function MeasuredItem({
  itemId,
  onBottomMeasured,
  style,
  children,
}: {
  itemId: string;
  onBottomMeasured: (id: string, bottom: number) => void;
  style: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.offsetTop + el.offsetHeight;
    if (bottom > 0) onBottomMeasured(itemId, bottom);
  });

  return (
    <div ref={ref} className="paper-wheel-item" style={style}>
      {children}
    </div>
  );
}

/**
 * Frame 1e-paper ("paper wheel") from references/Scrapbook Directions.dc.html, whose
 * screen is `<dc-import name="WheelPhone" material="paper" radius="{{ pR }}" rise="{{
 * pRise }}">` — the real implementation is references/WheelPhone.dc.html's `material ===
 * 'paper'` branch. See paperWheelGeometry.ts for the ported data/algorithm (untouched by
 * this task); this component is the markup + the drag/tap interaction + (CHANGE 2) the
 * scroll container around it. Harness defaults only (radius 246, rise 198) — no sliders.
 *
 * HEADER GAP: `headerDelta` is applied as `translateY` to the headline + item layer only —
 * the wheel itself is bottom-anchored (`rise` measures up from the screen's bottom edge)
 * and never moves, per this task's instruction.
 *
 * VERTICAL SCROLL (this task's CHANGE 2): the dot-paper background and the headline/item
 * layer live in a scroll container BEHIND the wheel (DOM order: scroll container first,
 * then the kraft tab / wheel / needle — all position:absolute with no z-index, so later
 * siblings naturally paint over the scroll container without needing one). The wheel's own
 * touch area keeps `touch-action: none` and physically overlaps the scroll container in
 * the screen region it occupies, so drags starting on the wheel are captured by the wheel
 * itself and never reach the scroll container underneath. Content height = `max(frameH,
 * selected month's lowest item bottom + RISE(198) + SAFE.bottom + 24)`, so the lowest item
 * can scroll fully clear of the wheel. Scroll resets to top (instantly, no animation)
 * whenever the effective selected month changes — including mid-drag, since items
 * cross-fade by `eff` (the live value), not just the settled `di` — so a new month's
 * items always start in the reference position.
 */
export default function PaperWheel({ view, headerDelta, ownerName, frameW, frameH, designX0 }: PaperWheelProps) {
  const [di, setDi] = useState(START_DI);
  const [ddx, setDdx] = useState(0);
  const [ddrag, setDdrag] = useState(false);
  const sxRef = useRef(0);
  const movedRef = useRef(false);
  const lastEffRef = useRef(effFromDi(START_DI, 0));
  const scaleRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [itemBottoms, setItemBottoms] = useState<Record<string, number>>({});

  const wheel = useMemo(() => buildWheel(di, ddx, frameH), [di, ddx, frameH]);
  const eff = effFromDi(di, ddx);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [eff]);

  const handleBottomMeasured = useCallback((id: string, bottom: number) => {
    setItemBottoms((prev) => (prev[id] === bottom ? prev : { ...prev, [id]: bottom }));
  }, []);

  const lowestVisibleBottom = Math.max(0, ...wheel.items.filter((it) => it.op === 1).map((it) => itemBottoms[it.id] ?? 0));
  const contentH = Math.max(frameH, lowestVisibleBottom + headerDelta + RISE + SAFE.bottom + 24);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    sxRef.current = e.clientX;
    movedRef.current = false;
    lastEffRef.current = effFromDi(di, 0);
    const el = e.currentTarget;
    scaleRef.current = el.getBoundingClientRect().width / el.offsetWidth || 1;
    setDdrag(true);
    setDdx(0);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!ddrag) return;
    const next = (e.clientX - sxRef.current) / scaleRef.current;
    if (Math.abs(next) > 4) movedRef.current = true;
    setDdx(next);
    const f = effFromDi(di, next);
    if (f !== lastEffRef.current) {
      lastEffRef.current = f;
      buzz(4);
    }
  };

  const handlePointerUp = () => {
    if (!ddrag) return;
    setDdrag(false);
    setDdx(0);
    setDi(effFromDi(di, ddx));
  };

  const pick = (i: number) => {
    if (movedRef.current) return;
    setDi(i);
    buzz(4);
  };

  return (
    <div className="paper-wheel-root">
      <div ref={scrollRef} className="paper-wheel-scroll">
        <div className="paper-wheel-scroll-inner" style={{ height: contentH }}>
          <svg className="paper-wheel-bg" width={frameW} height={contentH}>
            <rect width={frameW} height={contentH} fill="url(#sd-dot)" />
          </svg>

          <div className="paper-wheel-content" style={{ transform: `translateY(${headerDelta}px)` }}>
            <div className="paper-wheel-headline" style={{ left: 28 + designX0 }}>
              <div className="paper-wheel-month">{wheel.dMonth}</div>
              <div className="paper-wheel-year">{wheel.dYear}</div>
            </div>

            {wheel.dQuiet && (
              <div className="paper-wheel-quiet" style={{ left: 95 + designX0, top: wheel.qTop, width: 200, height: wheel.qH }}>
                <svg className="paper-wheel-quiet-box" width="200" height={wheel.qH}>
                  <g style={{ filter: 'url(#ink)' }}>
                    <rect x={3} y={3} width={194} height={wheel.qHi} />
                  </g>
                </svg>
                <div className="paper-wheel-quiet-text">a quiet month</div>
              </div>
            )}

            {wheel.items.map((it) => (
              <MeasuredItem
                key={it.id}
                itemId={it.id}
                onBottomMeasured={handleBottomMeasured}
                style={{ left: it.x + designX0, top: it.y, opacity: it.op, transform: it.tf, pointerEvents: it.pe }}
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
              </MeasuredItem>
            ))}
          </div>
        </div>
      </div>

      {/* Kraft tab — part of the needle assembly, bottom-anchored (no headerDelta). */}
      <div className="paper-wheel-tab" style={{ left: 184 + designX0, top: wheel.tabTop }} />

      <div
        className="paper-wheel-touch"
        style={{ left: wheel.wx + designX0, top: wheel.wy, width: WHEEL_D, height: WHEEL_D }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg className="paper-wheel-under" width={WHEEL_D} height={WHEEL_D}>
          <path d={wheel.pUnder} fill="#E8DFCE" transform="translate(6 8)" />
        </svg>

        <div
          className="paper-wheel-spin"
          style={{ transform: `rotate(${wheel.dRot}deg)`, transition: ddrag ? 'none' : 'transform 380ms cubic-bezier(.2,.8,.2,1)' }}
        >
          <svg className="paper-wheel-disc" width={WHEEL_D} height={WHEEL_D}>
            <path d={wheel.pFibre} fill="#FFFFFF" />
            <path d={wheel.pTop} fill="#FBF8F1" />
            <path d={wheel.pTop} fill="#000000" filter="url(#wp-grain)" />
          </svg>

          {wheel.months.map((mo) => (
            <div
              key={mo.index}
              className="paper-wheel-label"
              style={{ left: mo.lx, top: mo.ly, transformOrigin: `45px ${mo.lo}px`, transform: `rotate(${mo.a}deg)` }}
              onClick={() => pick(mo.index)}
            >
              <div className="paper-wheel-label-inner" style={{ fontFamily: mo.ff, fontWeight: mo.fw, fontSize: mo.fs, letterSpacing: mo.ls, color: mo.col }}>
                <span>{mo.label}</span>
                {mo.underline && (
                  <svg className="paper-wheel-underline" width="40" height="6">
                    <g style={{ filter: 'url(#ink)' }}>
                      <path d="M0 3 C10 1 24 5 40 2" />
                    </g>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <svg className="paper-wheel-needle-layer" width={frameW} height={frameH}>
        <g style={{ filter: 'url(#ink)' }} transform={`translate(${designX0}, 0)`}>
          <path d={wheel.nTick} fill="none" stroke="#D8422C" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
