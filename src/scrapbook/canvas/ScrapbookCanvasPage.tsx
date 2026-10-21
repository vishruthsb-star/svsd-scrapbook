import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AddFab } from '@/components/AddFab';
import type { AddFabKind } from '@/components/AddFab';
import { ScrapbookHeader } from '@/components/ScrapbookHeader';
import type { ScrapbookHeaderProps } from '@/components/ScrapbookHeader';
import { ScreenShell } from '@/components/ScreenShell';
import { SketchDefs } from '@/components/SketchDefs';
import type { PlacedMemory } from '@/scrapbook/placement';
import { OWNER_HANDLE } from '@/data/mock';
import './ScrapbookCanvasPage.css';
import { DESIGN_W, FAB_PILL_HEIGHT, HEADER_REF_BOTTOM, SAFE } from './constants';
import type { FabPlacement } from './fabAnchor';
import { fabAnchor } from './fabAnchor';
import type { CanvasStyle } from './styleRegistry';
import { CANVAS_STYLE_FAB_PLACEMENT, CANVAS_STYLES } from './styleRegistry';

export interface ScrapbookCanvasPageProps {
  style: CanvasStyle;
  /** Volume 1 SPEC OVERRIDES naming — replaces 'self' | 'other'. The add button renders only when 'visitor'. */
  view: 'own' | 'visitor';
  /** Accepted now so style implementations can start consuming it; unused by the shared shell. */
  items?: PlacedMemory[];
  headerProps?: ScrapbookHeaderProps;
  ownerName?: string;
  /**
   * Overrides `CANVAS_STYLE_FAB_PLACEMENT[style]` for this mount only — the registry default
   * stays the reference-sourced placement (e.g. torn-strata's bottom-center), so standalone
   * previews of a style are unaffected. Used by CanvasScreen to move torn-strata's add
   * button to 'tr' so it clears the app-shell-level HomeBottomNavigation, which the gallery's
   * standalone torn-strata preview doesn't have to contend with.
   */
  fabPlacement?: FabPlacement;
  onAddSelect?: (kind: AddFabKind) => void;
}

/**
 * Mounts a real, invisible AddFab purely to read its pill's actual rendered width (the
 * 'tr' placement isn't horizontally symmetric, so — unlike 'bc' — its anchor genuinely
 * needs the measured width, per docs/scrapbook-canvas-spec.md: "Derive the pill's anchor
 * from the MEASURED pill size... Do not hardcode a center"). Uses AddFab's own `hidden`
 * prop (keeps it non-interactive/invisible) rather than any new engine option, so this
 * never touches addFabEngine.ts's rendering logic. The probe's own frame size doesn't
 * matter (pill width is purely content/font-driven), so it just uses AddFab's defaults.
 *
 * Measures in a plain `useEffect`, not `useLayoutEffect`: AddFab builds `.addfab__pill`'s
 * DOM inside its own `useEffect` (engine construction), and React fires all of a commit's
 * layout effects before any of its passive effects — so a layout effect here would run
 * before that child effect ever had a chance to create the pill. Passive effects fire
 * child-before-parent too, so by the time this (parent) effect runs, AddFab's (child)
 * effect has already run and the pill genuinely exists.
 *
 * Also waits for `document.fonts.ready`: the pill's "add" label is set in Inter
 * (addFabEngine.ts), and measuring before that font finishes loading can give a width a
 * pixel or two narrower than the real one — enough to visibly misalign 'tr''s right edge.
 */
function FabPillWidthProbe({ onMeasured }: { onMeasured: (width: number) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const pill = wrapRef.current?.querySelector<HTMLElement>('.addfab__pill');
      if (pill) onMeasured(pill.getBoundingClientRect().width);
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="scrapbook-canvas-page-fab-probe" aria-hidden="true">
      <AddFab placement="tr" hidden />
    </div>
  );
}

/**
 * Shared shell for every scrapbook canvas page (torn-strata, theme spreads, envelopes,
 * paper wheel). Per the Volume 1 SPEC OVERRIDES: mounted inside `<ScreenShell
 * variant="canvas">` (no safe-area bands/padding — see ScreenShell.tsx) instead of a
 * hardcoded 390x844 box, with the frame's real rendered size (W x H) measured via
 * ResizeObserver and handed to the active style as `frameW`/`frameH` plus `designX0 =
 * (frameW - 390) / 2` so the reference's 390-wide hand-placed coordinates stay centered.
 * ScrapbookCanvasPage doesn't use ScreenShell's own scroll container for scrolling itself
 * — each style owns a different scroll shape (vertical strips, horizontal snap panels, a
 * vertical envelope stack), so a single shared scroller can't serve all of them; ScreenShell
 * is used purely for frame sizing/centering and the bands-free "canvas" behavior.
 *
 * AddFab's engine only reads its x/y/placement/frame options once at construction (it
 * doesn't react to prop changes — see AddFab.tsx), so AddFab is only mounted once its
 * anchor is fully known: the frame size and header height always, plus (for a
 * non-symmetric placement like 'tr') the pill's own measured width via
 * `FabPillWidthProbe` first. The style content is gated on the same measurements, since
 * every style's layout depends on `frameW`/`frameH`/`headerDelta`.
 */
export default function ScrapbookCanvasPage({
  style,
  view,
  headerProps,
  ownerName = OWNER_HANDLE,
  fabPlacement: fabPlacementOverride,
  onAddSelect,
  items = [],
}: ScrapbookCanvasPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const headerWrapRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = headerWrapRef.current;
    if (!el) return;
    setHeaderHeight(el.getBoundingClientRect().height);
  }, []);

  const [pillWidth, setPillWidth] = useState<number | null>(null);

  const headerDelta = headerHeight === null ? null : SAFE.top + headerHeight - HEADER_REF_BOTTOM;
  const designX0 = frame === null ? null : (frame.w - DESIGN_W) / 2;
  const fabPlacement = fabPlacementOverride ?? CANVAS_STYLE_FAB_PLACEMENT[style];
  const needsPillWidth = fabPlacement !== 'bc';
  const fabReady = frame !== null && headerHeight !== null && (!needsPillWidth || pillWidth !== null);

  return (
    <ScreenShell variant="canvas">
      <div ref={frameRef} className="scrapbook-canvas-page">
        <SketchDefs />
        <div className="scrapbook-canvas-page-canvas">
          {headerDelta !== null &&
            designX0 !== null &&
            frame !== null &&
            CANVAS_STYLES[style]({ view, headerDelta, ownerName, frameW: frame.w, frameH: frame.h, designX0, items })}
        </div>
        <div ref={headerWrapRef} className="scrapbook-canvas-page-header">
          <ScrapbookHeader {...headerProps} />
        </div>
        {view === 'visitor' && needsPillWidth && pillWidth === null && <FabPillWidthProbe onMeasured={setPillWidth} />}
        {view === 'visitor' && fabReady && (
          <AddFab
            placement={fabPlacement}
            frameW={frame!.w}
            frameH={frame!.h}
            cornerRadius={0}
            zIndex={200}
            onSelect={onAddSelect}
            {...fabAnchor(fabPlacement, pillWidth ?? 0, FAB_PILL_HEIGHT, headerHeight as number, frame!.w, frame!.h)}
          />
        )}
      </div>
    </ScreenShell>
  );
}
