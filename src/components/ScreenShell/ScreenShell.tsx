import type { ReactNode } from 'react';
import './ScreenShell.css';

export interface ScreenShellProps {
  children: ReactNode;
  /** Whether the bottom safe area renders as an opaque mask (default) or stays plain spacing. Ignored when variant="canvas" (no bands at all). */
  maskBottom?: boolean;
  /**
   * "default" (the normal app screen: opaque top/bottom bands, safe-area padding on the
   * scroll container) or "canvas" — scrapbook canvas pages (docs/scrapbook-canvas-spec.md),
   * which must NOT get solid safe-area bands or padding: their background texture runs
   * edge to edge and scrolls visibly under the header/into the bottom safe area. "canvas"
   * drops both bands and the scroll container's padding, and lets the child manage its own
   * internal scrolling (it still sizes/centers the frame exactly like "default").
   */
  variant?: 'default' | 'canvas';
  className?: string;
}

export default function ScreenShell({ children, maskBottom = true, variant = 'default', className }: ScreenShellProps) {
  const isCanvas = variant === 'canvas';
  return (
    <div className={`screenshell-root${className ? ' ' + className : ''}`}>
      <div className={`screenshell-scroll${isCanvas ? ' screenshell-scroll--canvas' : ''}`}>{children}</div>
      {!isCanvas && <div className="screenshell-band-top" aria-hidden="true" />}
      {!isCanvas && maskBottom && <div className="screenshell-band-bottom" aria-hidden="true" />}
    </div>
  );
}
