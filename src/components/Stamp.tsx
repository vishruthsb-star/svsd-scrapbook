import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { StampMedia, StampViewer } from '../types';
import { layout, measureCaptionHeight, onFontsReady } from '../utils/layout';
import { stampGeometry } from '../utils/geometry';
import { HATCH_PATTERN_ID } from '../utils/filters';
import './Stamp.css';

export interface StampProps {
  media: StampMedia;
  caption: string;
  owner: string;
  from: string;
  date: string;
  viewer: StampViewer;
  seed: number;
  zoom?: number;
  rot?: number;
}

type ZoomableStyle = CSSProperties & { zoom?: number };

export default function Stamp({ media, caption, owner, from, date, viewer, seed, zoom = 1, rot = 0 }: StampProps) {
  const [flipped, setFlipped] = useState(false);
  const [capH, setCapH] = useState(() => measureCaptionHeight(caption));

  useEffect(() => {
    setCapH(measureCaptionHeight(caption));
  }, [caption]);

  useEffect(() => onFontsReady(() => setCapH(measureCaptionHeight(caption))), [caption]);

  const L = useMemo(() => layout(media.ratio, capH), [media.ratio, capH]);
  const G = useMemo(() => stampGeometry(L, seed), [L, seed]);

  const strokeW = (2 / zoom).toFixed(2);
  const backLineStrokeW = (1.4 / zoom).toFixed(2);

  return (
    <div
      className={`stamp${flipped ? ' flipped' : ''}`}
      style={{ width: L.W, height: L.H, zoom, transform: `rotate(${rot}deg)` } as ZoomableStyle}
      onClick={() => setFlipped((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setFlipped((v) => !v);
      }}
    >
      <div className="flipper">
        <div className="face front">
          <svg className="lay" width={L.W} height={L.H} style={{ strokeWidth: strokeW }}>
            <g className="ink">
              <path className="p-fill" d={G.outline} />
            </g>
          </svg>
          <div className="media" style={{ left: L.winX, top: L.winY, width: L.winW, height: L.winH }}>
            {media.kind === 'image' && <img src={media.src} alt="" />}
            {media.kind === 'video' && <video src={media.src} muted loop autoPlay playsInline />}
            {media.kind === 'empty' && (
              <>
                <svg width="100%" height="100%" style={{ display: 'block' }}>
                  <rect width="100%" height="100%" fill={`url(#${HATCH_PATTERN_ID})`} />
                </svg>
                <div className="chip">{media.label || 'photo'}</div>
              </>
            )}
          </div>
          <svg className="lay" width={L.W} height={L.H} style={{ strokeWidth: strokeW }}>
            <g className="ink">
              <path d={G.outline} />
              <path d={G.frame} />
            </g>
          </svg>
          {L.capH > 0 && (
            <div className="caption" style={{ top: L.capY }}>
              {caption}
            </div>
          )}
        </div>
        <div className="face back">
          <svg className="lay" width={L.W} height={L.H} style={{ strokeWidth: strokeW }}>
            <g className="ink">
              <path className="b-fill" d={G.outline} />
              <path d={G.outline} />
              <path d={G.backLines} style={{ strokeWidth: backLineStrokeW }} />
            </g>
          </svg>
          <div className="rows">
            <div className="row">
              <span className="sm">to —</span>
              <span className="nm">{owner}</span>
            </div>
            <div className="gap" />
            <div className="row">
              <span className="sm">from —</span>
              {viewer === 'other' ? (
                <svg className="censor" width="64" height="20" viewBox="0 0 90 22" preserveAspectRatio="none">
                  <g className="ink">
                    <path className="c-fill" d={G.censorFill} />
                    <path className="c-scrib" d={G.censorScribble} />
                  </g>
                </svg>
              ) : (
                <span className="nm">{viewer === 'self' ? 'you' : from}</span>
              )}
            </div>
            {viewer !== 'other' && <div className="row date">{date}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
