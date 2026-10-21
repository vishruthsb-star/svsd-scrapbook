import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import IphoneFrame from './IphoneFrame';
import ShowcaseControls from './ShowcaseControls';
import './IphoneShowcase.css';

const DEVICE = { width: 360, height: (360 * 656) / 322 } as const;
const PREFERENCES_KEY = 'scrapbook-showcase-preferences-v1';

type ShowcasePreferences = {
  mode: 'auto' | 'manual';
  manualScale: number;
};

function viewportSize() {
  return {
    width: window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function loadPreferences(): ShowcasePreferences {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? 'null') as Partial<ShowcasePreferences> | null;
    if ((saved?.mode === 'auto' || saved?.mode === 'manual') && typeof saved.manualScale === 'number' && saved.manualScale >= 0.5 && saved.manualScale <= 1.5) {
      return { mode: saved.mode, manualScale: saved.manualScale };
    }
  } catch { /* A malformed preference should never block the showcase. */ }
  return { mode: 'auto', manualScale: 1 };
}

export default function IphoneShowcase() {
  const [viewport, setViewport] = useState(viewportSize);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [controlsOpen, setControlsOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => setViewport(viewportSize());
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
  }, [preferences]);

  const autoScale = useMemo(() => {
    const padding = viewport.width <= 600 ? 12 : 24;
    // On compact screens reserve enough lower space for the 44 px floating
    // controller plus its 12 px viewport inset, without overlapping the phone.
    const controlClearance = viewport.width <= 600 ? 112 : 0;
    return Math.min(
      (viewport.width - padding * 2) / DEVICE.width,
      (viewport.height - padding * 2 - controlClearance) / DEVICE.height,
    );
  }, [viewport]);
  const scale = preferences.mode === 'auto' ? autoScale : preferences.manualScale;
  const padding = viewport.width <= 600 ? 12 : 24;
  const style = {
    '--showcase-horizontal-space': `${padding * 2}px`,
    '--showcase-vertical-space': `${padding * 2}px`,
    '--showcase-device-width': `${DEVICE.width * scale}px`,
    '--showcase-device-height': `${DEVICE.height * scale}px`,
  } as CSSProperties;

  return (
    <main className="iphone-showcase" style={style}>
      <h1 className="iphone-showcase__title">Vishruth scrapbook iPhone showcase</h1>
      <div className="iphone-showcase__device-slot">
        <IphoneFrame scale={scale} />
      </div>
      <ShowcaseControls
        autoFit={preferences.mode === 'auto'}
        scale={scale}
        open={controlsOpen}
        onOpenChange={setControlsOpen}
        onAutoFit={() => setPreferences((current) => ({ ...current, mode: 'auto' }))}
        onScaleChange={(manualScale) => setPreferences({ mode: 'manual', manualScale })}
        onReset={() => setPreferences({ mode: 'auto', manualScale: 1 })}
      />
    </main>
  );
}
