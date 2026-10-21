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
  recordingPhase: import('./recording').RecordingPhase;
  elapsedSeconds: number;
  recordingError: string | null;
  onRecord: () => void;
  onStop: () => void;
  onDownload: () => void;
}

export default function ShowcaseControls({ autoFit, scale, open, onOpenChange, onAutoFit, onScaleChange, onReset, recordingPhase, elapsedSeconds, recordingError, onRecord, onStop, onDownload }: ShowcaseControlsProps) {
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
          <div className="showcase-controls__recording">
            <strong>Recording</strong>
            <span>Resolution: 1206 × 2532</span>
            <span>Frame Rate: 60 FPS</span>
            {recordingPhase === 'idle' && <button className="showcase-controls__record" type="button" onClick={onRecord}>● Record</button>}
            {recordingPhase === 'preparing' && <span>Preparing capture tab…</span>}
            {recordingPhase === 'recording' && <><span className="showcase-controls__live">● REC&nbsp;&nbsp; {formatElapsed(elapsedSeconds)}</span><button type="button" onClick={onStop}>■ Stop Recording</button></>}
            {(recordingPhase === 'stopping' || recordingPhase === 'encoding') && <span>Processing recording…</span>}
            {recordingPhase === 'ready' && <><span>Recording ready</span><button type="button" onClick={onDownload}>Download MP4</button></>}
            {recordingPhase === 'error' && <><span className="showcase-controls__error">{recordingError}</span><button type="button" onClick={onRecord}>Try again</button></>}
          </div>
        </section>
      )}
      {recordingPhase === 'recording' && <button type="button" className="showcase-controls__recording-badge" onClick={onStop}>● REC {formatElapsed(elapsedSeconds)} · Stop</button>}
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

function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
