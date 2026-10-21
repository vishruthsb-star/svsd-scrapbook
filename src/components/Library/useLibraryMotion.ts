/* eslint-disable react-hooks/immutability --
 * This file's entire job is directly mutating `.style.transform`/`.style.opacity` on DOM
 * nodes reached through refs, every animation frame, outside React's render cycle — the
 * task's explicit architecture ("animate only transform on them... directly"; state must
 * never lead motion). The react-compiler-oriented immutability rule assumes DOM writes
 * happen in effects, not in rAF/event-driven imperative code; that assumption doesn't fit
 * a hand-rolled animation engine, so it's disabled for this file rather than routed
 * around with layers of indirection that would just hide the same mutation.
 */
import { useCallback, useEffect, useRef } from 'react';
import { slotShelf, slotTop } from './geometry';
import { sEval, sRetarget, type SpringState } from './spring';
import { CURVE_BEZIER, type LibraryConfig, type LibraryPerson } from './types';

export interface FolderDomRefs {
  folder: HTMLDivElement | null;
  lift: HTMLDivElement | null;
  press: HTMLDivElement | null;
  sh: SVGSVGElement | null;
  fillSvg: SVGSVGElement | null;
  markSvg: SVGSVGElement | null;
  lInk: HTMLSpanElement | null;
  lPaper: HTMLSpanElement | null;
}

export function emptyFolderRefs(): FolderDomRefs {
  return { folder: null, lift: null, press: null, sh: null, fillSvg: null, markSvg: null, lInk: null, lPaper: null };
}

function targetYFor(i: number, sel: number, n: number, cfg: LibraryConfig): number {
  return i <= sel ? slotTop(i, cfg.tabH, cfg.gap) : slotShelf(i, n, cfg.gap);
}

/**
 * Parent renders may recreate `people`/`config` objects while their authored geometry is
 * unchanged. Only a real geometry change may reset the imperative motion state; otherwise
 * a controlled selection update would immediately snap over the spring that just started.
 */
function geometrySignature(n: number, cfg: LibraryConfig, people: LibraryPerson[]): string {
  return `${n}|${Object.values(cfg).join('|')}|${people.map(({ name, col }) => `${name}:${col}`).join(',')}`;
}

function matrixOf(el: HTMLElement | null): DOMMatrixReadOnly {
  if (!el) return new DOMMatrixReadOnly();
  const t = getComputedStyle(el).transform;
  return t && t !== 'none' ? new DOMMatrixReadOnly(t) : new DOMMatrixReadOnly();
}

function stopAnims(el: Element | null) {
  if (el && typeof (el as HTMLElement).getAnimations === 'function') {
    (el as HTMLElement).getAnimations().forEach((a) => a.cancel());
  }
}

/**
 * Owns every mutable, per-instance piece of the motion system (spring states, last
 * positions, the rAF loop, read marks) behind refs — nothing here is module/global state,
 * so multiple <Library> instances never share or clobber each other's motion. Mirrors the
 * harness's place/sTick/pressBump/liftBump/setFills/crossfade/select one-to-one; only the
 * storage (refs instead of module variables) and entry points (goTo/snapAll instead of a
 * single global `select`) differ.
 */
export function useLibraryMotion(n: number, cfg: LibraryConfig, people: LibraryPerson[], initialSel: number) {
  const refsRef = useRef<FolderDomRefs[]>([]);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const compRef = useRef<HTMLDivElement | null>(null);

  const cfgRef = useRef(cfg);
  const peopleRef = useRef(people);
  const selRef = useRef(initialSel);
  const readMarkRef = useRef<boolean[]>([]);
  const lastYRef = useRef<number[]>([]);
  const springRef = useRef<SpringState[]>([]);
  const rafIdRef = useRef(0);
  const mqMatchesRef = useRef(false);
  const geometrySignatureRef = useRef<string | null>(null);

  const reduced = useCallback(() => {
    const m = cfgRef.current.motion;
    return m === 'reduced' || (m === 'auto' && mqMatchesRef.current);
  }, []);

  const tick = useCallback((ts: number) => {
    const c = cfgRef.current;
    const now = ts / 1000;
    let busy = false;
    for (let i = 0; i < n; i++) {
      let st = springRef.current[i];
      if (!st) continue;
      if (st.pending && now >= st.pending.at) {
        const pd = st.pending;
        st = sRetarget(st, pd.target, pd.at, c.duration, c.bounce);
        springRef.current[i] = st;
      }
      if (st.rest && !st.pending) continue;
      const r = sEval(st, now);
      let y = r.y;
      if (!st.pending && Math.abs(y - st.target) < 0.02 && Math.abs(r.v) < 2) {
        y = st.target;
        st.rest = true;
      } else {
        busy = true;
      }
      const el = refsRef.current[i]?.folder;
      if (el) el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    }
    rafIdRef.current = busy ? requestAnimationFrame(tick) : 0;
  }, [n]);

  const place = useCallback((sel: number, snap: boolean) => {
    const c = cfgRef.current;
    const now = performance.now() / 1000;
    const moving: number[] = [];
    for (let i = 0; i < n; i++) if (lastYRef.current[i] !== targetYFor(i, sel, n, c)) moving.push(i);
    moving.sort((a, b) => b - a); // front folder first

    for (let i = 0; i < n; i++) {
      const el = refsRef.current[i]?.folder;
      const rank = moving.indexOf(i);
      const y = targetYFor(i, sel, n, c);
      const delay = rank > 0 ? rank * c.stagger : 0;

      if (el) {
        if (snap) {
          el.style.transition = 'none';
          el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
          springRef.current[i] = { target: y, x0: 0, v0: 0, t0: now, w: 1, z: 1, rest: true, pending: null };
        } else if (c.engine === 'spring') {
          el.style.transition = 'none';
          if (rank >= 0) {
            if (delay > 0) {
              if (!springRef.current[i]) springRef.current[i] = sRetarget(undefined, lastYRef.current[i] ?? y, now, c.duration, c.bounce);
              springRef.current[i].pending = { target: y, at: now + delay / 1000 };
              springRef.current[i].rest = false;
            } else {
              springRef.current[i] = sRetarget(springRef.current[i], y, now, c.duration, c.bounce);
            }
          }
        } else {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
          }
          el.style.transition = `transform ${c.duration}ms ${CURVE_BEZIER[c.curve]} ${delay}ms`;
          el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
          springRef.current[i] = { target: y, x0: 0, v0: 0, t0: now, w: 1, z: 1, rest: true, pending: null };
        }
      }
      lastYRef.current[i] = y;
    }

    if (snap) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
      if (stackRef.current) void stackRef.current.offsetHeight; // force reflow, matching the harness's snap path
    } else if (c.engine === 'spring' && !rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(tick);
    }
  }, [n, tick]);

  const setFills = useCallback((sel: number, snap: boolean) => {
    const c = cfgRef.current,
      ppl = peopleRef.current;
    const tr = snap ? 'none' : `opacity ${c.fillMs}ms ease ${c.fillDelay}ms`;
    for (let i = 0; i < n; i++) {
      const e = refsRef.current[i];
      if (!e) continue;
      const on = i === sel;
      [e.fillSvg, e.lInk, e.lPaper, e.markSvg].forEach((node) => {
        if (node) node.style.transition = tr;
      });
      if (e.fillSvg) e.fillSvg.style.opacity = on ? '1' : '0';
      if (e.lPaper) e.lPaper.style.opacity = on ? '1' : '0';
      if (e.lInk) e.lInk.style.opacity = on ? '0' : '1';
      if (e.markSvg) e.markSvg.style.opacity = ppl[i]?.unread && !readMarkRef.current[i] ? '1' : '0';
    }
  }, [n]);

  const pressBump = useCallback((i: number) => {
    const c = cfgRef.current;
    const el = refsRef.current[i]?.press;
    if (!el) return;
    const s0 = matrixOf(el).a;
    stopAnims(el);
    if (c.press >= 1 || !el.animate) return;
    el.animate(
      [
        { transform: `scale(${s0})`, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
        { transform: `scale(${c.press})`, offset: 1 / 2.6, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        { transform: 'scale(1)' },
      ],
      { duration: c.pressMs * 2.6 },
    );
  }, []);

  const liftBump = useCallback((i: number) => {
    const c = cfgRef.current;
    const e = refsRef.current[i];
    if (!e?.lift?.animate || !e.sh) return;
    const y0 = matrixOf(e.lift).f;
    const o0 = parseFloat(getComputedStyle(e.sh).opacity) || 0;
    stopAnims(e.lift);
    stopAnims(e.sh);
    e.lift.animate(
      [
        { transform: `translateY(${y0}px)`, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
        { transform: `translateY(${-c.lift}px)`, offset: 0.4, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: c.duration },
    );
    e.sh.animate(
      [
        { opacity: o0, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
        { opacity: c.liftShadow, offset: 0.4, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
        { opacity: 0 },
      ],
      { duration: c.duration },
    );
  }, []);

  const crossfade = useCallback((sel: number) => {
    const stackEl = stackRef.current,
      compEl = compRef.current;
    if (!stackEl || !compEl) {
      place(sel, true);
      setFills(sel, true);
      return;
    }
    const ghost = stackEl.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('id');
    ghost.style.zIndex = '2';
    ghost.style.pointerEvents = 'none';
    compEl.appendChild(ghost);
    place(sel, true);
    setFills(sel, true);
    const done = () => ghost.remove();
    if (ghost.animate) {
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear' }).onfinish = done;
    } else {
      done();
    }
  }, [place, setFills]);

  /** The single entry point for every selection change — click-driven or prop-driven. */
  const goTo = useCallback((i: number, opts: { press: boolean }) => {
    if (reduced()) {
      if (i === selRef.current) return;
      selRef.current = i;
      readMarkRef.current[i] = true;
      crossfade(i);
      return;
    }
    if (opts.press) pressBump(i);
    if (i === selRef.current) return;
    selRef.current = i;
    readMarkRef.current[i] = true;
    place(i, false);
    liftBump(i);
    setFills(i, false);
  }, [reduced, crossfade, pressBump, place, liftBump, setFills]);

  /** Snaps everything to the current selection with no animation — mount, and whenever geometry-affecting config/people change. */
  const snapAll = useCallback(() => {
    place(selRef.current, true);
    setFills(selRef.current, true);
  }, [place, setFills]);

  // Keep the latest config/people available to the imperative code above without ever
  // touching refs during render (only effects write these). Array/object identity is not
  // a geometry change: a parent can supply fresh derived person objects when the selected
  // folder changes. Snapping in that path cancels the spring mid-flight.
  useEffect(() => {
    cfgRef.current = cfg;
    peopleRef.current = people;
    const nextGeometrySignature = geometrySignature(n, cfg, people);
    if (geometrySignatureRef.current !== nextGeometrySignature) {
      geometrySignatureRef.current = nextGeometrySignature;
      snapAll();
    }
  }, [n, cfg, people, snapAll]);

  // prefers-reduced-motion: read only in an effect, never during render; subscribe for changes.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mqMatchesRef.current = mq.matches;
    const onChange = () => {
      mqMatchesRef.current = mq.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Clean up any in-flight rAF loop on unmount.
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    };
  }, []);

  return { refsRef, stackRef, compRef, goTo, selRef, readMarkRef };
}
