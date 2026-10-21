import { useEffect, useId } from 'react';
import './ShowcaseControls.css';

interface ShowcaseControlsProps {
  autoFit: boolean;
  scale: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAutoFit: () => void;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
}

export default function ShowcaseControls({ autoFit, scale, open, onOpenChange, onAutoFit, onScaleChange, onReset }: ShowcaseControlsProps) {
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange, open]);

  return (
    <div className="showcase-controls">
      {open && (
        <section id={panelId} className="showcase-controls__panel" aria-label="Showcase scale controls">
          <label className="showcase-controls__scale-label" htmlFor={`${panelId}-scale`}>
            Scale <output>{Math.round(scale * 100)}%</output>
          </label>
          <input
            id={`${panelId}-scale`}
            className="showcase-controls__slider"
            type="range"
            min="50"
            max="150"
            step="5"
            value={Math.round(scale * 100)}
            aria-label="iPhone scale"
            onChange={(event) => onScaleChange(Number(event.target.value) / 100)}
          />
          <div className="showcase-controls__actions">
            <button type="button" onClick={onAutoFit} disabled={autoFit}>Auto Fit</button>
            <button type="button" onClick={onReset}>Reset</button>
          </div>
        </section>
      )}
      <button
        className="showcase-controls__toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Hide showcase controls' : 'Show showcase controls'}
        onClick={() => onOpenChange(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 17h16M8 4v6M16 14v6" />
        </svg>
      </button>
    </div>
  );
}
