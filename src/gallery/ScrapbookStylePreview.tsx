import { useState } from 'react';
import { DEFAULT_SCRAPBOOK_STYLE } from '@/data/mock';
import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import type { CanvasStyle } from '@/scrapbook/canvas';
import './ScrapbookStylePreview.css';

const STYLES: { value: CanvasStyle; label: string }[] = [
  { value: 'torn-strata', label: 'torn strata' },
  { value: 'theme-spreads', label: 'theme spreads' },
  { value: 'envelopes-lip', label: 'envelopes lip' },
  { value: 'paper-wheel', label: 'paper wheel' },
];

/**
 * Dev-only verification harness (not part of the app) — lets you pick any of the four
 * canvas styles and flip the viewer ('self' | 'other'), rendering the real
 * <ScrapbookCanvasPage/> at a fixed 390x844 frame (overriding ScreenShell's
 * --screen-frame-width/--screen-height tokens, per its own documented override
 * convention, so this stays at exactly 390x844 regardless of the gallery's viewport).
 */
export default function ScrapbookStylePreview() {
  const [style, setStyle] = useState<CanvasStyle>(DEFAULT_SCRAPBOOK_STYLE);
  const [viewer, setViewer] = useState<'self' | 'other'>('other');

  return (
    <div className="scrapbook-style-preview">
      <div className="scrapbook-style-preview-controls">
        <div className="scrapbook-style-preview-group" role="tablist" aria-label="Canvas style">
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={s.value === style}
              className={s.value === style ? 'is-active' : ''}
              onClick={() => setStyle(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="scrapbook-style-preview-group" role="tablist" aria-label="Viewer">
          <button type="button" role="tab" aria-selected={viewer === 'self'} className={viewer === 'self' ? 'is-active' : ''} onClick={() => setViewer('self')}>
            self
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewer === 'other'}
            className={viewer === 'other' ? 'is-active' : ''}
            onClick={() => setViewer('other')}
          >
            other
          </button>
        </div>
      </div>
      <div className="scrapbook-style-preview-frame">
        <ScrapbookCanvasPage style={style} view={viewer === 'self' ? 'own' : 'visitor'} />
      </div>
    </div>
  );
}
