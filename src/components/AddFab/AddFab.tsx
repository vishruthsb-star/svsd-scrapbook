import type { CSSProperties } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { AddFabKind, AddFabOptions, AddFabPlacement } from './addFabEngine';
import { AddFab as AddFabEngine } from './addFabEngine';

export type { AddFabKind, AddFabPlacement };

export interface AddFabProps {
  placement?: AddFabPlacement;
  startOpen?: boolean;
  hidden?: boolean;
  onSelect?: (kind: AddFabKind) => void;
  /** Fan-center/arc overrides — see addFabEngine.ts's host-geometry caveat before touching these. */
  x?: number;
  y?: number;
  dir?: number;
  spread?: number;
  radius?: number;
  /** Host size in px. Default 390/844 (addFabEngine.ts's original fixed frame) — omit these for pixel-identical behavior with every existing caller. */
  frameW?: number;
  frameH?: number;
  /** Host corner radius in px. Default 48. */
  cornerRadius?: number;
  /** CSS z-index for the host. Default: unset (relies on DOM order, as the reference does). */
  zIndex?: number;
  className?: string;
}

export interface AddFabHandle {
  open: () => void;
  close: () => void;
  setPlacement: (name: AddFabPlacement) => void;
}

/**
 * Thin React wrapper around the imperative `AddFab` engine ported from
 * `references/Scrapbook Add Button.html`. The engine owns its own DOM subtree (fan
 * circles, scrim, pill, SVG filter) and timers; this wrapper only mounts/unmounts it.
 *
 * Safe under React StrictMode's dev-mode double-invoke: the engine's injected
 * `<style id="addfab-css">` is de-duplicated by id (guarded in the engine itself), and
 * each mount creates a fresh engine instance that `destroy()` tears down completely
 * (timers cleared, DOM node removed) before the next mount runs.
 */
const AddFab = forwardRef<AddFabHandle, AddFabProps>(function AddFab(
  { placement, startOpen, hidden, onSelect, x, y, dir, spread, radius, frameW = 390, frameH = 844, cornerRadius, zIndex, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AddFabEngine | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const opts: AddFabOptions = { placement, startOpen, hidden, onSelect, x, y, dir, spread, radius, frameW, frameH, cornerRadius, zIndex };
    const engine = new AddFabEngine(host, opts);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // The engine reads these once at construction time, matching the reference (options
    // are only re-applied via setPlacement/open/close, not reactively on every prop change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (placement) engineRef.current?.setPlacement(placement);
  }, [placement]);

  useImperativeHandle(
    ref,
    () => ({
      open: () => engineRef.current?.open(),
      close: () => engineRef.current?.close(),
      setPlacement: (name: AddFabPlacement) => engineRef.current?.setPlacement(name),
    }),
    [],
  );

  // This outer host div is a SEPARATE element from the `.addfab` div the engine creates
  // and appends inside it — the engine's own pointer-events:none (and its children's
  // explicit auto overrides) only apply to that inner div. Without pointer-events:none
  // here too, this host — an otherwise-invisible box exactly frameW x frameH — would
  // silently swallow every click/tap underneath it, even while the fan is closed.
  const hostStyle: CSSProperties = {
    position: 'relative',
    width: frameW,
    height: frameH,
    pointerEvents: 'none',
    ...(zIndex != null ? { zIndex } : null),
  };

  return <div ref={hostRef} className={className} style={hostStyle} />;
});

export default AddFab;
