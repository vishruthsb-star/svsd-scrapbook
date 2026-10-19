import { useMemo, useState } from 'react';
import type { StampMedia, StampViewer } from '../types';
import { censorWidthFor, layout, measureCaptionHeight } from '../utils/layout';
import { inkStrokeWidths, stampGeometry } from '../utils/geometry';
import { DEFAULT_INK, FIELD_WHITE, HATCH_PATTERN_ID, INK_FILTER_STYLE } from '../utils/filters';
import { useMeasuredHeight } from '../utils/useMeasuredHeight';
import FlipCard from './FlipCard';
import ItemBack from './ItemBack';
import Decor from './Decor';
import RemoveButton from './RemoveButton';
import { shouldShowRemoveAction } from '../utils/removeAction';
import './Item.css';
import './Stamp.css';

export interface StampProps {
  id?: string;
  media: StampMedia;
  caption: string;
  owner: string;
  from: string;
  date: string;
  viewer: StampViewer;
  seed: number;
  zoom?: number;
  rot?: number;
  onRemove?: (id: string) => void;
}

const BACK_PX = 18;

export default function Stamp({ id = '', media, caption, owner, from, date, viewer, seed, zoom = 1, rot = 0, onRemove }: StampProps) {
  const [flipped, setFlipped] = useState(false);
  const capH = useMeasuredHeight(caption, measureCaptionHeight);

  const L = useMemo(() => layout(media.ratio, capH), [media.ratio, capH]);
  const G = useMemo(() => stampGeometry(L, seed), [L, seed]);

  const sw = inkStrokeWidths(zoom);
  const censorWidth = censorWidthFor(L.W, BACK_PX);

  const front = (
    <>
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.outline} style={{ fill: FIELD_WHITE, stroke: 'none' }} />
        </g>
      </svg>
      <div className="media-slot" style={{ left: L.winX, top: L.winY, width: L.winW, height: L.winH }}>
        {media.kind === 'image' && <img src={media.src} alt="" />}
        {media.kind === 'video' && <video src={media.src} muted loop autoPlay playsInline />}
        {media.kind === 'empty' && (
          <>
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              <rect width="100%" height="100%" fill={`url(#${HATCH_PATTERN_ID})`} />
            </svg>
            <div className="media-chip">{media.label || 'photo'}</div>
          </>
        )}
      </div>
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.outline} />
          <path d={G.frame} />
        </g>
      </svg>
      {L.capH > 0 && (
        <div className="stamp-caption" style={{ top: L.capY }}>
          {caption}
        </div>
      )}
    </>
  );

  const handleRemove = onRemove ? () => onRemove(id) : undefined;
  const showRemove = shouldShowRemoveAction(viewer, handleRemove);

  const back = (
    <>
      <svg className="item-lay" width={L.W} height={L.H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.outline} style={{ fill: FIELD_WHITE, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.backLines} style={{ strokeWidth: sw.thin }} />
        </g>
      </svg>
      <ItemBack
        px={BACK_PX}
        top={24}
        gap={24}
        owner={owner}
        from={from}
        viewer={viewer}
        date={date}
        censorFill={G.censorFill}
        censorScribble={G.censorScribble}
        censorWidth={censorWidth}
      />
      {showRemove && <RemoveButton cardWidth={L.W} seed={seed} ink={DEFAULT_INK} onRemove={handleRemove!} />}
    </>
  );

  return (
    <Decor seed={seed} width={L.W} height={L.H} zoom={zoom} rot={rot} field={FIELD_WHITE}>
      <FlipCard front={front} back={back} width={L.W} height={L.H} flipped={flipped} onFlip={setFlipped} />
    </Decor>
  );
}
