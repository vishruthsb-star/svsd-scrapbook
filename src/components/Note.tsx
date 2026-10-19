import { useMemo, useState } from 'react';
import type { StampViewer } from '../types';
import { censorWidthFor } from '../utils/layout';
import { NOTE_BT, NOTE_GAP, NOTE_H, NOTE_PX, NOTE_W, inkStrokeWidths, noteGeometry } from '../utils/geometry';
import { DEFAULT_INK, FIELD_PAPER, INK_FILTER_STYLE } from '../utils/filters';
import FlipCard from './FlipCard';
import ItemBack from './ItemBack';
import Decor from './Decor';
import RemoveButton from './RemoveButton';
import { shouldShowRemoveAction } from '../utils/removeAction';
import './Item.css';
import './Note.css';

export interface NoteProps {
  id?: string;
  text: string;
  owner: string;
  senderName: string;
  date: string;
  viewer: StampViewer;
  seed: number;
  zoom?: number;
  rot?: number;
  onRemove?: (id: string) => void;
}

export default function Note({ id = '', text, owner, senderName, date, viewer, seed, zoom = 1, rot = 0, onRemove }: NoteProps) {
  const [flipped, setFlipped] = useState(false);
  const G = useMemo(() => noteGeometry(seed), [seed]);

  const sw = inkStrokeWidths(zoom);
  const censorWidth = censorWidthFor(NOTE_W, NOTE_PX);

  const front = (
    <>
      <svg className="item-lay" width={NOTE_W} height={NOTE_H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: FIELD_PAPER, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.redD} style={{ fill: '#D8422C', stroke: 'none' }} />
          <path d={G.blueD} style={{ fill: '#2E6BE6', stroke: 'none' }} />
        </g>
      </svg>
      <div className="note-text">{text}</div>
    </>
  );

  const handleRemove = onRemove ? () => onRemove(id) : undefined;
  const showRemove = shouldShowRemoveAction(viewer, handleRemove);

  const back = (
    <>
      <svg className="item-lay" width={NOTE_W} height={NOTE_H} style={{ strokeWidth: sw.thick }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: FIELD_PAPER, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.backLines} style={{ strokeWidth: sw.thin }} />
        </g>
      </svg>
      <ItemBack
        px={NOTE_PX}
        top={NOTE_BT}
        gap={NOTE_GAP}
        owner={owner}
        from={senderName}
        viewer={viewer}
        date={date}
        censorFill={G.censorFill}
        censorScribble={G.censorScribble}
        censorWidth={censorWidth}
      />
      {showRemove && <RemoveButton cardWidth={NOTE_W} seed={seed} ink={DEFAULT_INK} onRemove={handleRemove!} />}
    </>
  );

  return (
    <Decor seed={seed} width={NOTE_W} height={NOTE_H} zoom={zoom} rot={rot} field={FIELD_PAPER}>
      <FlipCard front={front} back={back} width={NOTE_W} height={NOTE_H} flipped={flipped} onFlip={setFlipped} />
    </Decor>
  );
}
