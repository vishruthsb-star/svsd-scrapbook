import type { StampViewer } from '../types';
import { DEFAULT_INK, INK_FILTER_STYLE } from '../utils/filters';
import './ItemBack.css';

export interface ItemBackProps {
  /** left/right inset of the rows block */
  px: number;
  /** top offset of the rows block */
  top: number;
  /** height of the blank row between "to" and "from" */
  gap: number;
  owner: string;
  from: string;
  viewer: StampViewer;
  date: string;
  censorFill: string;
  censorScribble: string;
  /** width of the censor bar; defaults to 64 (matches the stamp) */
  censorWidth?: number;
}

/**
 * The shared "to — owner / from — name-or-censor / date" back face used by every item
 * kind (Item.dc.html renders this identically for stamp/note/voice/tag, varying only the
 * surrounding card size). Viewer rules: 'other' censors the sender's name and hides the
 * date; 'owner' shows the sender's name and the date; 'self' shows "you" in place of the
 * sender's name (still with the date).
 */
export default function ItemBack({ px, top, gap, owner, from, viewer, date, censorFill, censorScribble, censorWidth = 64 }: ItemBackProps) {
  return (
    <div className="item-back-rows" style={{ left: px, right: px, top }}>
      <div className="item-back-row">
        <span className="sm">to —</span>
        <span className="nm">{owner}</span>
      </div>
      <div className="item-back-gap" style={{ height: gap }} />
      <div className="item-back-row">
        <span className="sm">from —</span>
        {viewer === 'other' ? (
          <svg className="item-back-censor" width={censorWidth} height="20" viewBox="0 0 90 22" preserveAspectRatio="none">
            <g style={INK_FILTER_STYLE}>
              <path d={censorFill} style={{ fill: DEFAULT_INK, stroke: 'none' }} />
              <path d={censorScribble} style={{ fill: 'none', stroke: DEFAULT_INK, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
            </g>
          </svg>
        ) : (
          <span className="nm">{viewer === 'self' ? 'you' : from}</span>
        )}
      </div>
      {viewer !== 'other' && <div className="item-back-row item-back-date">{date}</div>}
    </div>
  );
}
