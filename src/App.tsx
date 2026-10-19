import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Stamp from './components/Stamp';
import Note from './components/Note';
import VoicePostcard from './components/VoicePostcard';
import ParcelTag from './components/ParcelTag';
import { Library } from './components/Library';
import ScrapDefs from './components/ScrapDefs';
import { makeRng } from './utils/geometry';
import type { StampMedia, StampViewer } from './types';
import './App.css';

const SAMPLE_CAPTION = 'four of us and a very large fish tank';
const SAMPLE_NOTE_TEXT = 'you laughed at the exact same part of the film i did, a full second before everyone else.';
const OWNER = 'vishruth';
const FROM = 'jun';
const DATE = '18 OCT 2026 · 9:14 PM';
const SAMPLE_URL = 'https://the-quiet-hour.blog/rain-notes';
const SAMPLE_LINK_LABEL = 'the quiet hour';
const EMPTY_PREVIEW: StampMedia = { kind: 'empty', ratio: 1 };

function rerollSeed(seed: number): number {
  return seed + 1 + Math.floor(Math.random() * 999);
}

const BOARD_STORAGE_KEY = 'scrapbook-board-v1';
const BOARD_REMOVE_MS = 220;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** A small, deterministic tilt derived from an item's own seed — not Math.random(), so it never jitters on re-render. */
function seededRot(seed: number, amplitude = 5): number {
  return makeRng(seed + 777).J(amplitude);
}

function ViewerToggle({ value, onChange }: { value: StampViewer; onChange: (v: StampViewer) => void }) {
  return (
    <div className="seg">
      <button type="button" className={value === 'other' ? 'on' : ''} onClick={() => onChange('other')}>
        someone else
      </button>
      <button type="button" className={value === 'owner' ? 'on' : ''} onClick={() => onChange('owner')}>
        the owner
      </button>
      <button type="button" className={value === 'self' ? 'on' : ''} onClick={() => onChange('self')}>
        the sender
      </button>
    </div>
  );
}

interface RatioSpec {
  key: string;
  ratio: number;
}

const GALLERY_RATIOS: RatioSpec[] = [
  { key: '1:1', ratio: 1 },
  { key: '4:3', ratio: 4 / 3 },
  { key: '3:2', ratio: 3 / 2 },
  { key: '16:9', ratio: 16 / 9 },
  { key: '3:4', ratio: 3 / 4 },
  { key: '9:16', ratio: 9 / 16 },
];

const TAG_PRESET_RATIOS: RatioSpec[] = [
  { key: 'tall', ratio: 9 / 16 },
  { key: 'square', ratio: 1 },
  { key: 'wide', ratio: 16 / 9 },
];

const ALL_BOARD_IDS = [
  'b-stamp-1', 'b-note-1', 'b-voice-1', 'b-tag-1',
  'b-stamp-2', 'b-note-2', 'b-voice-2', 'b-tag-2',
  'b-stamp-3', 'b-note-3', 'b-voice-3', 'b-tag-3',
];

function loadBoardIds(): string[] {
  try {
    const raw = localStorage.getItem(BOARD_STORAGE_KEY);
    if (!raw) return ALL_BOARD_IDS;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const kept = parsed.filter((x): x is string => typeof x === 'string' && ALL_BOARD_IDS.includes(x));
      if (kept.length) return kept;
    }
  } catch {
    // ignore malformed storage, fall back to the full board
  }
  return ALL_BOARD_IDS;
}

/** Hand-picked scatter positions for the board — a loose flat-lay, not a grid. */
const BOARD_LAYOUT: Array<{ left: string; top: number }> = [
  { left: '2%', top: 10 },
  { left: '22%', top: 160 },
  { left: '40%', top: 20 },
  { left: '60%', top: 180 },
  { left: '80%', top: 0 },
  { left: '6%', top: 360 },
  { left: '26%', top: 380 },
  { left: '46%', top: 330 },
  { left: '66%', top: 400 },
  { left: '15%', top: 580 },
  { left: '48%', top: 600 },
  { left: '72%', top: 340 },
];

/** Crops an image to a target aspect ratio on a canvas — stands in for "someone uploaded a file of this shape". */
function cropTo(img: HTMLImageElement, ratio: number, focusY: number): { src: string; ratio: number } {
  const iw = img.naturalWidth,
    ih = img.naturalHeight,
    ir = iw / ih;
  let cw: number, ch: number;
  if (ir > ratio) {
    ch = ih;
    cw = ih * ratio;
  } else {
    cw = iw;
    ch = iw / ratio;
  }
  const cx = (iw - cw) / 2;
  const cy = Math.min(ih - ch, Math.max(0, ih * focusY - ch / 2));
  const sc = Math.min(1, 900 / Math.max(cw, ch));
  const c = document.createElement('canvas');
  c.width = Math.round(cw * sc);
  c.height = Math.round(ch * sc);
  c.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, c.width, c.height);
  return { src: c.toDataURL('image/jpeg', 0.88), ratio: c.width / c.height };
}

function App() {
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [boardViewer, setBoardViewer] = useState<StampViewer>('other');
  const [caption, setCaption] = useState(SAMPLE_CAPTION);
  const [viewer, setViewer] = useState<StampViewer>('other');
  const [upload, setUpload] = useState<StampMedia | null>(null);
  const [stampRemoved, setStampRemoved] = useState(false);
  const uploadUrlRef = useRef<string | null>(null);

  const [noteText, setNoteText] = useState(SAMPLE_NOTE_TEXT);
  const [noteViewer, setNoteViewer] = useState<StampViewer>('other');
  const [noteSender, setNoteSender] = useState(FROM);
  const [noteDate, setNoteDate] = useState(DATE);
  const [noteSeed, setNoteSeed] = useState(31);
  const [noteRemoved, setNoteRemoved] = useState(false);

  const [voiceAudioSrc, setVoiceAudioSrc] = useState<string | undefined>(undefined);
  const [voiceViewer, setVoiceViewer] = useState<StampViewer>('other');
  const [voiceSender, setVoiceSender] = useState('priya');
  const [voiceDate, setVoiceDate] = useState(DATE);
  const [voiceSeed, setVoiceSeed] = useState(41);
  const [voiceRemoved, setVoiceRemoved] = useState(false);
  const voiceUrlRef = useRef<string | null>(null);

  const [tagUrl, setTagUrl] = useState(SAMPLE_URL);
  const [tagLinkLabel, setTagLinkLabel] = useState(SAMPLE_LINK_LABEL);
  const [tagViewer, setTagViewer] = useState<StampViewer>('other');
  const [tagSender, setTagSender] = useState('theo');
  const [tagDate, setTagDate] = useState(DATE);
  const [tagSeed, setTagSeed] = useState(51);
  const [tagPreview, setTagPreview] = useState<StampMedia>(EMPTY_PREVIEW);
  const [tagFetching, setTagFetching] = useState(false);
  const [tagFetchError, setTagFetchError] = useState<string | null>(null);
  const [tagRemoved, setTagRemoved] = useState(false);
  const tagUrlRef = useRef<string | null>(null);

  const [librarySel, setLibrarySel] = useState(2);
  const [libraryLastOpen, setLibraryLastOpen] = useState<string | null>(null);

  const [boardIds, setBoardIds] = useState<string[]>(loadBoardIds);
  const [leavingBoardIds, setLeavingBoardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardIds));
    } catch {
      // storage unavailable (private mode, quota) — board just won't persist across reloads
    }
  }, [boardIds]);

  const handleBoardRemove = useCallback((id: string) => {
    setLeavingBoardIds((prev) => new Set(prev).add(id));
    const delay = prefersReducedMotion() ? 0 : BOARD_REMOVE_MS;
    window.setTimeout(() => {
      setBoardIds((ids) => ids.filter((x) => x !== id));
      setLeavingBoardIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, delay);
  }, []);

  function handleBoardReset() {
    setLeavingBoardIds(new Set());
    setBoardIds(ALL_BOARD_IDS);
  }

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBaseImg(img);
    img.src = '/aquarium.jpg';
  }, []);

  // Revoke every live object URL on unmount, in addition to revoking on replace (handled
  // at each call site below).
  useEffect(() => {
    return () => {
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
      if (voiceUrlRef.current) URL.revokeObjectURL(voiceUrlRef.current);
      if (tagUrlRef.current) URL.revokeObjectURL(tagUrlRef.current);
    };
  }, []);

  const gallery = useMemo(() => {
    if (!baseImg) return [];
    return GALLERY_RATIOS.map((spec, i) => ({
      spec,
      seed: 21 + i,
      media: { kind: 'image', ...cropTo(baseImg, spec.ratio, 0.6) } as StampMedia,
    }));
  }, [baseImg]);

  const playgroundMedia: StampMedia | null = upload ?? (baseImg ? { kind: 'image', src: baseImg.src, ratio: baseImg.naturalWidth / baseImg.naturalHeight } : null);

  const tagPresets = useMemo(() => {
    const withPreviews = baseImg
      ? TAG_PRESET_RATIOS.map((spec, i) => ({
          spec,
          seed: 61 + i,
          preview: { kind: 'image', ...cropTo(baseImg, spec.ratio, 0.5) } as StampMedia,
        }))
      : [];
    return [
      ...withPreviews,
      { spec: { key: 'no preview', ratio: 1 }, seed: 64, preview: EMPTY_PREVIEW },
    ];
  }, [baseImg]);

  const boardEntries = useMemo((): { key: string; node: ReactNode }[] => {
    const ratios = [4 / 3, 1, 16 / 9];
    const stampMedia: StampMedia[] = ratios.map((r) =>
      baseImg ? ({ kind: 'image', ...cropTo(baseImg, r, 0.55) } as StampMedia) : ({ kind: 'empty', ratio: r, label: 'photo' } as StampMedia),
    );
    const tagPreviewImg: StampMedia = baseImg ? ({ kind: 'image', ...cropTo(baseImg, 1, 0.5) } as StampMedia) : EMPTY_PREVIEW;

    return [
      {
        key: 'b-stamp-1',
        node: (
          <Stamp id="b-stamp-1" media={stampMedia[0]} caption="the night the bus never came" owner={OWNER} from="maya" date={DATE} viewer={boardViewer} seed={201} zoom={0.95} rot={seededRot(201)} onRemove={handleBoardRemove} />
        ),
      },
      {
        key: 'b-note-1',
        node: <Note id="b-note-1" text={SAMPLE_NOTE_TEXT} owner={OWNER} senderName="jun" date={DATE} viewer={boardViewer} seed={211} zoom={0.85} rot={seededRot(211)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-voice-1',
        node: <VoicePostcard id="b-voice-1" owner={OWNER} senderName="priya" date={DATE} viewer={boardViewer} seed={221} zoom={0.85} rot={seededRot(221)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-tag-1',
        node: (
          <ParcelTag id="b-tag-1" url={SAMPLE_URL} linkLabel={SAMPLE_LINK_LABEL} preview={tagPreviewImg} owner={OWNER} senderName="theo" date={DATE} viewer={boardViewer} seed={231} zoom={0.9} rot={seededRot(231)} onRemove={handleBoardRemove} />
        ),
      },
      {
        key: 'b-stamp-2',
        node: <Stamp id="b-stamp-2" media={stampMedia[1]} caption="" owner={OWNER} from="sam" date={DATE} viewer={boardViewer} seed={202} zoom={0.9} rot={seededRot(202)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-note-2',
        node: (
          <Note
            id="b-note-2"
            text="ok but who taught you to whistle like that"
            owner={OWNER}
            senderName="ana"
            date={DATE}
            viewer={boardViewer}
            seed={212}
            zoom={0.8}
            rot={seededRot(212)}
            onRemove={handleBoardRemove}
          />
        ),
      },
      {
        key: 'b-voice-2',
        node: <VoicePostcard id="b-voice-2" owner={OWNER} senderName="sam" date={DATE} viewer={boardViewer} seed={222} zoom={0.8} rot={seededRot(222)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-tag-2',
        node: (
          <ParcelTag
            id="b-tag-2"
            url="https://songs-for-buses.example/playlist"
            linkLabel="songs for buses"
            preview={EMPTY_PREVIEW}
            owner={OWNER}
            senderName="maya"
            date={DATE}
            viewer={boardViewer}
            seed={232}
            zoom={0.85}
            rot={seededRot(232)}
            onRemove={handleBoardRemove}
          />
        ),
      },
      {
        key: 'b-stamp-3',
        node: <Stamp id="b-stamp-3" media={stampMedia[2]} caption={SAMPLE_CAPTION} owner={OWNER} from="jun" date={DATE} viewer={boardViewer} seed={203} zoom={1} rot={seededRot(203)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-note-3',
        node: (
          <Note
            id="b-note-3"
            text="the way you say 'anyway' like a door closing"
            owner={OWNER}
            senderName="theo"
            date={DATE}
            viewer={boardViewer}
            seed={213}
            zoom={0.85}
            rot={seededRot(213)}
            onRemove={handleBoardRemove}
          />
        ),
      },
      {
        key: 'b-voice-3',
        node: <VoicePostcard id="b-voice-3" owner={OWNER} senderName="ana" date={DATE} viewer={boardViewer} seed={223} zoom={0.85} rot={seededRot(223)} onRemove={handleBoardRemove} />,
      },
      {
        key: 'b-tag-3',
        node: (
          <ParcelTag
            id="b-tag-3"
            url="https://example.com/a-recipe-youd-ruin"
            linkLabel="a recipe you'd ruin"
            preview={EMPTY_PREVIEW}
            owner={OWNER}
            senderName="priya"
            date={DATE}
            viewer={boardViewer}
            seed={233}
            zoom={0.9}
            rot={seededRot(233)}
            onRemove={handleBoardRemove}
          />
        ),
      },
    ];
  }, [baseImg, boardViewer, handleBoardRemove]);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    uploadUrlRef.current = url;
    if (file.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => setUpload({ kind: 'video', src: url, ratio: v.videoWidth / v.videoHeight });
      v.src = url;
    } else {
      const im = new Image();
      im.onload = () => setUpload({ kind: 'image', src: url, ratio: im.naturalWidth / im.naturalHeight });
      im.src = url;
    }
  }

  function handleVoiceFile(file: File) {
    const url = URL.createObjectURL(file);
    if (voiceUrlRef.current) URL.revokeObjectURL(voiceUrlRef.current);
    voiceUrlRef.current = url;
    setVoiceAudioSrc(url);
  }

  function handleTagPreviewFile(file: File) {
    const url = URL.createObjectURL(file);
    if (tagUrlRef.current) URL.revokeObjectURL(tagUrlRef.current);
    tagUrlRef.current = url;
    setTagFetchError(null);
    if (file.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => setTagPreview({ kind: 'video', src: url, ratio: v.videoWidth / v.videoHeight });
      v.src = url;
    } else {
      const im = new Image();
      im.onload = () => setTagPreview({ kind: 'image', src: url, ratio: im.naturalWidth / im.naturalHeight });
      im.src = url;
    }
  }

  async function handleFetchTagPreview() {
    if (!tagUrl.trim()) return;
    setTagFetching(true);
    setTagFetchError(null);
    // The fetched preview is a remote URL, not a blob — drop any uploaded preview's object
    // URL now so it isn't left dangling once we switch away from it.
    if (tagUrlRef.current) {
      URL.revokeObjectURL(tagUrlRef.current);
      tagUrlRef.current = null;
    }
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(tagUrl)}&screenshot=true`);
      const json = await res.json();
      // Microlink's "image" field is often just a small logo/og-image, while "screenshot" is a
      // full-page capture — pick whichever is actually larger instead of always preferring
      // "image", so the preview isn't blurrily upscaled when a bigger source is available.
      const candidates = [json?.data?.image, json?.data?.screenshot].filter(Boolean) as Array<{ url?: string; width?: number; height?: number }>;
      candidates.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
      const src: string | undefined = candidates[0]?.url;
      if (!src) {
        setTagFetchError("couldn't get a preview for that link");
        return;
      }
      const im = new Image();
      im.onload = () => setTagPreview({ kind: 'image', src, ratio: im.naturalWidth / im.naturalHeight });
      im.onerror = () => setTagFetchError("couldn't load the fetched preview image");
      im.src = src;
    } catch {
      setTagFetchError("couldn't reach the preview service");
    } finally {
      setTagFetching(false);
    }
  }

  function handleClearTagPreview() {
    if (tagUrlRef.current) {
      URL.revokeObjectURL(tagUrlRef.current);
      tagUrlRef.current = null;
    }
    setTagFetchError(null);
    setTagPreview(EMPTY_PREVIEW);
  }

  return (
    <>
      <ScrapDefs />
      <div className="page">
        <section>
          <h2>the board</h2>
          <p className="note">
            a mixed scatter of stamps, notes, voice postcards, and parcel tags — for screen-recording them together.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label className="t">viewing as (applies to the whole board)</label>
              <ViewerToggle value={boardViewer} onChange={setBoardViewer} />
            </div>
            <button type="button" className="dev-reroll" onClick={handleBoardReset}>
              reset board
            </button>
          </div>
          <div className="board">
            {boardEntries.map((entry, i) => {
              const isLeaving = leavingBoardIds.has(entry.key);
              if (!boardIds.includes(entry.key) && !isLeaving) return null;
              return (
                <div
                  className={`board-item${isLeaving ? ' board-item-leaving' : ''}`}
                  key={entry.key}
                  style={{ left: BOARD_LAYOUT[i].left, top: BOARD_LAYOUT[i].top }}
                >
                  {entry.node}
                </div>
              );
            })}
          </div>
        </section>

        <header>
          <h1>stamp, rebuilt</h1>
          <p className="note">
            no postmark, no wavy lines. the photo slot takes the shape of whatever you give it, and the stamp grows
            around the slot and the caption. tap any stamp to turn it over.
          </p>
        </header>

        <section>
          <h2>same photo, six shapes</h2>
          <p className="note">
            each one is the aquarium photo cropped to the shape a person might upload. the slot is always sized to
            the file, so nothing is cut off inside the stamp.
          </p>
          <div className="shelf">
            {gallery.map(({ spec, seed, media }) => (
              <div className="item" key={spec.key}>
                <Stamp
                  media={media}
                  caption={SAMPLE_CAPTION}
                  owner={OWNER}
                  from={FROM}
                  date={DATE}
                  viewer={viewer}
                  seed={seed}
                  zoom={1.2}
                />
                <div className="cap cond">
                  <b>{spec.key}</b>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>try it</h2>
          <p className="note">type in the caption, toggle who's viewing, or drop in your own photo or video. flip to the back as owner/sender to see the remove control.</p>
          <div className="play">
            <div className="stage">
              {playgroundMedia && !stampRemoved && (
                <Stamp
                  id="stamp-playground"
                  media={playgroundMedia}
                  caption={caption}
                  owner={OWNER}
                  from={FROM}
                  date={DATE}
                  viewer={viewer}
                  seed={11}
                  zoom={2}
                  rot={-2}
                  onRemove={() => setStampRemoved(true)}
                />
              )}
            </div>
            <div className="controls">
              <div>
                <label className="t" htmlFor="cap">
                  caption
                </label>
                <textarea id="cap" spellCheck={false} value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>
              <div>
                <label className="t">viewing as</label>
                <ViewerToggle value={viewer} onChange={setViewer} />
              </div>
              <div>
                <label className="upload">
                  choose your own photo or video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
              </div>
              <div className="readout">{stampRemoved ? 'removed' : 'not removed'}</div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setStampRemoved(false)}>
                  reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>note card</h2>
          <p className="note">a handwritten text card — fixed size, no auto-growing. overflowing text spills past the card, same as the design.</p>
          <div className="play">
            <div className="stage">
              {!noteRemoved && (
                <Note
                  id="note-playground"
                  text={noteText}
                  owner={OWNER}
                  senderName={noteSender}
                  date={noteDate}
                  viewer={noteViewer}
                  seed={noteSeed}
                  zoom={1.6}
                  rot={-2}
                  onRemove={() => setNoteRemoved(true)}
                />
              )}
            </div>
            <div className="controls">
              <div>
                <label className="t" htmlFor="note-text">
                  text
                </label>
                <textarea id="note-text" spellCheck={false} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              </div>
              <div>
                <label className="t">viewing as</label>
                <ViewerToggle value={noteViewer} onChange={setNoteViewer} />
              </div>
              <div>
                <label className="t" htmlFor="note-sender">
                  sender name
                </label>
                <input id="note-sender" type="text" value={noteSender} onChange={(e) => setNoteSender(e.target.value)} />
              </div>
              <div>
                <label className="t" htmlFor="note-date">
                  date
                </label>
                <input id="note-date" type="text" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
              </div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setNoteSeed(rerollSeed)}>
                  dev: reroll decor
                </button>
              </div>
              <div className="readout">{noteRemoved ? 'removed' : 'not removed'}</div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setNoteRemoved(false)}>
                  reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>voice postcard</h2>
          <p className="note">
            a waveform that reveals itself as playback progresses. with no audio, it shows the design's default fully-drawn state.
          </p>
          <div className="play">
            <div className="stage">
              {!voiceRemoved && (
                <VoicePostcard
                  id="voice-playground"
                  audioSrc={voiceAudioSrc}
                  owner={OWNER}
                  senderName={voiceSender}
                  date={voiceDate}
                  viewer={voiceViewer}
                  seed={voiceSeed}
                  zoom={1.4}
                  rot={2}
                  onRemove={() => setVoiceRemoved(true)}
                />
              )}
            </div>
            <div className="controls">
              <div>
                <label className="upload">
                  choose an audio file
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVoiceFile(file);
                    }}
                  />
                </label>
              </div>
              <div>
                <label className="t">viewing as</label>
                <ViewerToggle value={voiceViewer} onChange={setVoiceViewer} />
              </div>
              <div>
                <label className="t" htmlFor="voice-sender">
                  sender name
                </label>
                <input id="voice-sender" type="text" value={voiceSender} onChange={(e) => setVoiceSender(e.target.value)} />
              </div>
              <div>
                <label className="t" htmlFor="voice-date">
                  date
                </label>
                <input id="voice-date" type="text" value={voiceDate} onChange={(e) => setVoiceDate(e.target.value)} />
              </div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setVoiceSeed(rerollSeed)}>
                  dev: reroll decor
                </button>
              </div>
              <div className="readout">{voiceRemoved ? 'removed' : 'not removed'}</div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setVoiceRemoved(false)}>
                  reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>parcel tag, different previews</h2>
          <p className="note">
            same tag, different preview shapes — the slot grows with the preview's own ratio like the stamp's photo
            slot. the last one has no preview at all, so it falls back to the link's favicon and hostname.
          </p>
          <div className="shelf">
            {tagPresets.map(({ spec, seed, preview }) => (
              <div className="item" key={spec.key}>
                <ParcelTag
                  url={SAMPLE_URL}
                  linkLabel={SAMPLE_LINK_LABEL}
                  preview={preview}
                  owner={OWNER}
                  senderName={tagSender}
                  date={tagDate}
                  viewer={tagViewer}
                  seed={seed}
                  zoom={1.1}
                />
                <div className="cap cond">
                  <b>{spec.key}</b>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>parcel tag</h2>
          <p className="note">a link, wearing a tag. drop in a preview image/video, or fetch a screenshot of the link itself.</p>
          <div className="play">
            <div className="stage">
              {!tagRemoved && (
                <ParcelTag
                  id="tag-playground"
                  url={tagUrl}
                  linkLabel={tagLinkLabel}
                  preview={tagPreview}
                  owner={OWNER}
                  senderName={tagSender}
                  date={tagDate}
                  viewer={tagViewer}
                  seed={tagSeed}
                  zoom={1.6}
                  rot={3}
                  onRemove={() => setTagRemoved(true)}
                />
              )}
            </div>
            <div className="controls">
              <div>
                <label className="t" htmlFor="tag-url">
                  url
                </label>
                <input id="tag-url" type="text" value={tagUrl} onChange={(e) => setTagUrl(e.target.value)} />
              </div>
              <div>
                <label className="t" htmlFor="tag-label">
                  link label
                </label>
                <input id="tag-label" type="text" value={tagLinkLabel} onChange={(e) => setTagLinkLabel(e.target.value)} />
              </div>
              <div>
                <label className="t">viewing as</label>
                <ViewerToggle value={tagViewer} onChange={setTagViewer} />
              </div>
              <div>
                <label className="t" htmlFor="tag-sender">
                  sender name
                </label>
                <input id="tag-sender" type="text" value={tagSender} onChange={(e) => setTagSender(e.target.value)} />
              </div>
              <div>
                <label className="t" htmlFor="tag-date">
                  date
                </label>
                <input id="tag-date" type="text" value={tagDate} onChange={(e) => setTagDate(e.target.value)} />
              </div>
              <div>
                <label className="upload">
                  choose a preview photo or video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTagPreviewFile(file);
                    }}
                  />
                </label>
              </div>
              <div className="seg">
                <button type="button" onClick={handleFetchTagPreview} disabled={tagFetching}>
                  {tagFetching ? 'fetching…' : 'fetch preview'}
                </button>
                <button type="button" onClick={handleClearTagPreview}>
                  clear preview
                </button>
              </div>
              {tagFetchError && <div className="readout warn">{tagFetchError}</div>}
              <div>
                <button type="button" className="dev-reroll" onClick={() => setTagSeed(rerollSeed)}>
                  dev: reroll decor
                </button>
              </div>
              <div className="readout">{tagRemoved ? 'removed' : 'not removed'}</div>
              <div>
                <button type="button" className="dev-reroll" onClick={() => setTagRemoved(false)}>
                  reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>library</h2>
          <p className="note">a card-catalog drawer — tap a tab to open that folder, tap the open tab or its cover to "open" it.</p>
          <div className="play">
            <div className="stage" id="library-demo">
              <Library selected={librarySel} onSelect={setLibrarySel} onOpen={(i) => setLibraryLastOpen(`opened #${i}`)} />
            </div>
            <div className="controls">
              <div className="readout">{libraryLastOpen ?? 'tap the open tab (or its cover) to fire onOpen'}</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
