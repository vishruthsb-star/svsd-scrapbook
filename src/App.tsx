import { useEffect, useMemo, useRef, useState } from 'react';
import Stamp from './components/Stamp';
import StampDefs from './components/StampDefs';
import type { StampMedia, StampViewer } from './types';
import './App.css';

const SAMPLE_CAPTION = 'four of us and a very large fish tank';
const OWNER = 'vishruth';
const FROM = 'jun';
const DATE = '18 OCT 2026 · 9:14 PM';

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
  const [caption, setCaption] = useState(SAMPLE_CAPTION);
  const [viewer, setViewer] = useState<StampViewer>('other');
  const [upload, setUpload] = useState<StampMedia | null>(null);
  const uploadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBaseImg(img);
    img.src = '/aquarium.jpg';
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

  return (
    <>
      <StampDefs />
      <div className="page">
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
          <p className="note">type in the caption, toggle who's viewing, or drop in your own photo or video.</p>
          <div className="play">
            <div className="stage">
              {playgroundMedia && (
                <Stamp
                  media={playgroundMedia}
                  caption={caption}
                  owner={OWNER}
                  from={FROM}
                  date={DATE}
                  viewer={viewer}
                  seed={11}
                  zoom={2}
                  rot={-2}
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
                <div className="seg">
                  <button type="button" className={viewer === 'other' ? 'on' : ''} onClick={() => setViewer('other')}>
                    someone else
                  </button>
                  <button type="button" className={viewer === 'owner' ? 'on' : ''} onClick={() => setViewer('owner')}>
                    the owner
                  </button>
                </div>
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
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
