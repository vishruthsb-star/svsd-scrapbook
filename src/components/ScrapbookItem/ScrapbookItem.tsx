import type { StampMedia, StampViewer } from '@/types';
import Note from '../Note';
import ParcelTag from '../ParcelTag';
import Stamp from '../Stamp';
import VoicePostcard from '../VoicePostcard';

export type ScrapbookItemType = 'stamp' | 'note' | 'voice' | 'tag';
export type ScrapbookItemAttach = 'tape' | 'clip' | 'corners' | 'none';

export interface ScrapbookItemProps {
  id: string;
  type: ScrapbookItemType;
  text?: string;
  label?: string;
  city?: string;
  date: string;
  year: string;
  denom?: string;
  dur?: string;
  src?: string;
  /** Real image aspect ratio (width / height) — see src/scrapbook/fixtures/sampleItems.ts. */
  ratio?: number;
  from: string;
  owner: string;
  /** Page-level view ('own' = your own scrapbook, 'visitor' = someone else's) — mapped to
   * the item components' 3-valued StampViewer below. Volume 1 SPEC OVERRIDES naming. */
  view: 'own' | 'visitor';
  attach?: ScrapbookItemAttach;
  rot?: number;
  zoom?: number;
  seed: number;
  onRemove?: (id: string) => void;
}

function mapView(view: 'own' | 'visitor'): StampViewer {
  // 'own': you're looking at your own scrapbook, so the item components' viewer is
  // 'owner' (sees sender name + date). 'visitor': someone else's, so 'other' (censored, no
  // date). Per the Volume 1 SPEC OVERRIDES: "for items the visitor themself dropped, use
  // 'self' only if the data model exposes it, otherwise 'other'" — the sample-item fixture
  // doesn't tag per-visitor authorship, so that case always falls through to 'other' here.
  return view === 'own' ? 'owner' : 'other';
}

function parseDurSec(dur: string | undefined): number | undefined {
  if (!dur) return undefined;
  const [m, s] = dur.split(':').map(Number);
  return m * 60 + s;
}

/**
 * Thin adapter dispatching the reference's `dc-import name="Item"` prop shape (type, text,
 * label, city, date, year, denom, dur, src, from, viewer, attach, rot, zoom) onto the
 * repo's real Stamp/Note/VoicePostcard/ParcelTag — per docs/scrapbook-canvas-spec.md's
 * "Item" section ("no generic Item... dispatches to Stamp / Note / VoicePostcard /
 * ParcelTag"). Those four components are NOT edited here or anywhere by this adapter.
 *
 * Known gaps, not invented around:
 * - `attach` is accepted for API parity with the reference but has no effect: the real
 *   Decor system (utils/decor.ts) picks tape/clip/corners/none deterministically from the
 *   item's `seed` alone and documents that "the user never controls it" — there is no prop
 *   on Stamp/Note/VoicePostcard/ParcelTag to force a specific piece.
 * - `label`/`city`/`denom` have no dedicated postmark/denomination rendering in the real
 *   Stamp (CLAUDE.md's component map only lists "photo/video slot + caption"). `label` is
 *   reused as the empty-media-slot chip text (Stamp's `media.label` / ParcelTag's
 *   `preview.label`) since that's the one place a short place-name-like string already has
 *   a home; `city`/`denom` are simply unused.
 * - ParcelTag requires a `url`; the reference's tag fixture items (`quiet`, `buses`) don't
 *   carry one. Defaults to `''` rather than inventing a destination.
 */
export default function ScrapbookItem({
  id,
  type,
  text,
  label,
  date,
  year,
  src,
  ratio,
  from,
  owner,
  view,
  rot,
  zoom,
  seed,
  dur,
  onRemove,
}: ScrapbookItemProps) {
  const itemViewer = mapView(view);
  const dateStr = `${date} ${year}`.toUpperCase();

  if (type === 'stamp') {
    const media: StampMedia = src ? { kind: 'image', src, ratio: ratio ?? 1, label } : { kind: 'empty', ratio: ratio ?? 1, label };
    return (
      <Stamp
        id={id}
        media={media}
        caption={text ?? ''}
        owner={owner}
        from={from}
        date={dateStr}
        viewer={itemViewer}
        seed={seed}
        zoom={zoom}
        rot={rot}
        onRemove={onRemove}
      />
    );
  }

  if (type === 'note') {
    return (
      <Note
        id={id}
        text={text ?? ''}
        owner={owner}
        senderName={from}
        date={dateStr}
        viewer={itemViewer}
        seed={seed}
        zoom={zoom}
        rot={rot}
        onRemove={onRemove}
      />
    );
  }

  if (type === 'voice') {
    return (
      <VoicePostcard
        id={id}
        durationSec={parseDurSec(dur)}
        owner={owner}
        senderName={from}
        date={dateStr}
        viewer={itemViewer}
        seed={seed}
        zoom={zoom}
        rot={rot}
        onRemove={onRemove}
      />
    );
  }

  const preview: StampMedia = src ? { kind: 'image', src, ratio: ratio ?? 1, label } : { kind: 'empty', ratio: ratio ?? 1, label };
  return (
    <ParcelTag
      id={id}
      url=""
      linkLabel={text ?? ''}
      preview={preview}
      owner={owner}
      senderName={from}
      date={dateStr}
      viewer={itemViewer}
      seed={seed}
      zoom={zoom}
      rot={rot}
      onRemove={onRemove}
    />
  );
}
