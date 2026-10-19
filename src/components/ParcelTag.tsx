import { useMemo, useState, type MouseEvent } from 'react';
import type { StampMedia, StampViewer } from '../types';
import { TAG_LINK_ICON_GAP, TAG_LINK_ICON_W, TAG_LINK_TEXT_W, censorWidthFor, measureLinkHeight, tagLayout } from '../utils/layout';
import { inkStrokeWidths, tagGeometry } from '../utils/geometry';
import { DEFAULT_INK, FIELD_PAPER, HATCH_PATTERN_ID, INK_FILTER_STYLE } from '../utils/filters';
import { useMeasuredHeight } from '../utils/useMeasuredHeight';
import FlipCard from './FlipCard';
import ItemBack from './ItemBack';
import Decor from './Decor';
import RemoveAction from './RemoveAction';
import { shouldShowRemoveAction } from '../utils/removeAction';
import './Item.css';
import './ParcelTag.css';

interface TagPreviewMediaProps {
  preview: StampMedia;
  url: string;
  host: string;
  faviconUrl: string;
}

/**
 * Owns the "did this image/video actually load" state, keyed by (kind, src) by the
 * caller — so swapping the preview resets this for free via a normal remount, instead of
 * an effect resetting state for a prop that changed (the same pattern VoicePostcard uses
 * for its playback state). A broken image/video falls back to the same placeholder as an
 * empty slot (favicon+hostname if there's a url, else the hatched chip), never a raw
 * broken-image glyph.
 */
function TagPreviewMedia({ preview, url, host, faviconUrl }: TagPreviewMediaProps) {
  const [broken, setBroken] = useState(false);
  const showEmptyState = preview.kind === 'empty' || broken;

  return (
    <>
      {preview.kind === 'image' && !broken && <img src={preview.src} alt="" onError={() => setBroken(true)} />}
      {preview.kind === 'video' && !broken && (
        <video src={preview.src} muted loop autoPlay playsInline onError={() => setBroken(true)} />
      )}
      {showEmptyState &&
        (url ? (
          <div className="tag-favicon-fallback">
            <img
              className="tag-favicon"
              src={faviconUrl}
              alt=""
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
            <div className="tag-hostname">{host}</div>
          </div>
        ) : (
          <>
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              <rect width="100%" height="100%" fill={`url(#${HATCH_PATTERN_ID})`} />
            </svg>
            <div className="media-chip">{preview.label || 'link'}</div>
          </>
        ))}
    </>
  );
}

export interface ParcelTagProps {
  id?: string;
  url: string;
  linkLabel: string;
  /** the preview slot's media — same shape as the Stamp's `media` prop (image/video/empty) */
  preview: StampMedia;
  owner: string;
  senderName: string;
  date: string;
  viewer: StampViewer;
  seed: number;
  zoom?: number;
  rot?: number;
  onRemove?: (id: string) => void;
}

const BACK_PX = 14;
const BACK_BT = 54;

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function ParcelTag({
  id = '',
  url,
  linkLabel,
  preview,
  owner,
  senderName,
  date,
  viewer,
  seed,
  zoom = 1,
  rot = 0,
  onRemove,
}: ParcelTagProps) {
  const [flipped, setFlipped] = useState(false);

  const host = useMemo(() => hostnameOf(url), [url]);
  const linkText = linkLabel.trim() || host;
  const linkH = useMeasuredHeight(linkText, measureLinkHeight);

  const L = useMemo(() => tagLayout(preview.ratio, linkH), [preview.ratio, linkH]);
  const G = useMemo(() => tagGeometry(L, seed), [L, seed]);

  const sw = inkStrokeWidths(zoom);
  const censorWidth = censorWidthFor(L.W, BACK_PX);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;

  function stopFlip(e: MouseEvent) {
    e.stopPropagation();
  }

  const front = (
    <>
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: FIELD_PAPER, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.holes} />
          <path d={G.string} />
          <path d={G.underline} />
        </g>
      </svg>
      <div className="media-slot" style={{ left: L.slotX, top: L.slotY, width: L.slotW, height: L.slotH }}>
        <TagPreviewMedia key={preview.kind + '|' + (preview.src ?? '')} preview={preview} url={url} host={host} faviconUrl={faviconUrl} />
      </div>
      {/* frame drawn after (on top of) the media, same as Stamp's second item-lay pass — keeps the
          border crisp and fully visible instead of being covered by the photo underneath it */}
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.slotFrame} />
        </g>
      </svg>
      <a
        className="tag-link-row"
        style={{ left: L.linkX, top: L.linkY, width: L.linkW }}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stopFlip}
      >
        <svg
          className="tag-link-icon"
          width={TAG_LINK_ICON_W}
          height={TAG_LINK_ICON_W}
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginRight: TAG_LINK_ICON_GAP }}
        >
          <g style={INK_FILTER_STYLE}>
            <path d="M10 13a5 5 0 0 0 7.07 0l1.93-1.93a5 5 0 0 0-7.07-7.07L10.5 5.5" stroke="var(--ink-link)" strokeWidth={2.4} strokeLinecap="round" />
            <path d="M14 11a5 5 0 0 0-7.07 0L5 12.93a5 5 0 0 0 7.07 7.07L13.5 18.5" stroke="var(--ink-link)" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        </svg>
        <span className="tag-link-label" style={{ width: TAG_LINK_TEXT_W }}>
          {linkText}
        </span>
      </a>
    </>
  );

  const back = (
    <>
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: FIELD_PAPER, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.backLines} style={{ strokeWidth: sw.thin }} />
        </g>
      </svg>
      <ItemBack
        px={BACK_PX}
        top={BACK_BT}
        gap={0}
        owner={owner}
        from={senderName}
        viewer={viewer}
        date={date}
        censorFill={G.censorFill}
        censorScribble={G.censorScribble}
        censorWidth={censorWidth}
      />
    </>
  );

  const handleRemove = onRemove ? () => onRemove(id) : undefined;
  const showRemove = shouldShowRemoveAction(viewer, flipped, true, handleRemove);

  return (
    <Decor
      seed={seed}
      width={L.W}
      height={L.H}
      zoom={zoom}
      rot={rot}
      field={FIELD_PAPER}
      remove={showRemove ? <RemoveAction variant={viewer as 'self' | 'owner'} ink={DEFAULT_INK} onRemove={handleRemove!} /> : undefined}
    >
      <FlipCard front={front} back={back} width={L.W} height={L.H} flipped={flipped} onFlip={setFlipped} />
    </Decor>
  );
}
