import { useMemo, useRef, useState, type MouseEvent } from 'react';
import type { StampViewer } from '../types';
import { censorWidthFor } from '../utils/layout';
import { VOICE_BAR_COUNT, VOICE_BT, VOICE_GAP, VOICE_H, VOICE_PX, VOICE_W, inkStrokeWidths, voiceGeometry } from '../utils/geometry';
import { DEFAULT_INK, FIELD_PAPER, INK_FILTER_STYLE } from '../utils/filters';
import FlipCard from './FlipCard';
import ItemBack from './ItemBack';
import Decor from './Decor';
import RemoveButton from './RemoveButton';
import { shouldShowRemoveAction } from '../utils/removeAction';
import './Item.css';
import './VoicePostcard.css';

export interface VoicePostcardProps {
  id?: string;
  audioSrc?: string;
  durationSec?: number;
  owner: string;
  senderName: string;
  date: string;
  viewer: StampViewer;
  seed: number;
  zoom?: number;
  rot?: number;
  onRemove?: (id: string) => void;
  /** Compose uses the same card geometry with its intentionally inverted ink/paper palette. */
  variant?: 'default' | 'compose';
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface VoicePlaybackProps {
  audioSrc?: string;
  durationSec?: number;
  bars: string[];
  strokeWidth: string;
}

/**
 * Owns everything that depends on playback state (the real `<audio>`, play/pause, the
 * revealed waveform, the duration label). Mounted with `key={audioSrc}` by the parent, so
 * swapping sources resets all of this for free via a normal remount — no manual "reset
 * state when this prop changes" effect needed.
 */
function VoicePlayback({ audioSrc, durationSec, bars, strokeWidth, ink }: VoicePlaybackProps & { ink: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [knownDuration, setKnownDuration] = useState<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // No audio: the design's default/empty state shows the waveform fully drawn (progress 1).
  const revealProgress = audioSrc ? progress : 1;
  const shown = Math.round(VOICE_BAR_COUNT * revealProgress);
  const barsPath = bars.slice(0, shown).join('');

  const displayDuration = knownDuration ?? durationSec;
  const durLabel = displayDuration !== undefined ? formatDuration(displayDuration) : '';

  function togglePlay(e: MouseEvent) {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        style={{ display: 'none' }}
        onLoadedMetadata={(e) => setKnownDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const { currentTime, duration } = e.currentTarget;
          if (duration) setProgress(currentTime / duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
      />
      <svg className="item-lay" width={VOICE_W} height={VOICE_H} style={{ strokeWidth, stroke: ink }}>
        <g style={INK_FILTER_STYLE}>
          <path d={barsPath} />
        </g>
      </svg>
      <button type="button" className="voice-play-hit" aria-label={playing ? 'pause' : 'play'} onClick={togglePlay} disabled={!audioSrc} />
      <div className="voice-dur">{durLabel}</div>
    </>
  );
}

export default function VoicePostcard({
  id = '',
  audioSrc,
  durationSec,
  owner,
  senderName,
  date,
  viewer,
  seed,
  zoom = 1,
  rot = 0,
  onRemove,
  variant = 'default',
}: VoicePostcardProps) {
  const [flipped, setFlipped] = useState(false);
  const G = useMemo(() => voiceGeometry(seed), [seed]);

  const sw = inkStrokeWidths(zoom);
  const censorWidth = censorWidthFor(VOICE_W, VOICE_PX);
  const ink = variant === 'compose' ? FIELD_PAPER : DEFAULT_INK;
  const field = variant === 'compose' ? '#10100f' : FIELD_PAPER;

  const front = (
    <>
      <svg className="item-lay" width={VOICE_W} height={VOICE_H} style={{ strokeWidth: sw.thick, stroke: ink }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: field, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.divider} />
          <path d={G.chipLines} />
          <path d={G.scalBox} />
          <path d={G.playTriangle} style={{ fill: ink, stroke: 'none' }} />
        </g>
      </svg>
      <VoicePlayback key={audioSrc ?? 'none'} audioSrc={audioSrc} durationSec={durationSec} bars={G.bars} strokeWidth={sw.thick} ink={ink} />
    </>
  );

  const handleRemove = onRemove ? () => onRemove(id) : undefined;
  const showRemove = shouldShowRemoveAction(viewer, handleRemove);

  const back = (
    <>
      <svg className="item-lay" width={VOICE_W} height={VOICE_H} style={{ strokeWidth: sw.thick, stroke: ink }}>
        <g style={INK_FILTER_STYLE}>
          <path d={G.fillD} style={{ fill: field, stroke: 'none' }} />
          <path d={G.outline} />
          <path d={G.backLines} style={{ strokeWidth: sw.thin }} />
        </g>
      </svg>
      <ItemBack
        px={VOICE_PX}
        top={VOICE_BT}
        gap={VOICE_GAP}
        owner={owner}
        from={senderName}
        viewer={viewer}
        date={date}
        censorFill={G.censorFill}
        censorScribble={G.censorScribble}
        censorWidth={censorWidth}
      />
      {showRemove && <RemoveButton cardWidth={VOICE_W} seed={seed} ink={ink} onRemove={handleRemove!} />}
    </>
  );

  return (
    <Decor seed={seed} width={VOICE_W} height={VOICE_H} zoom={zoom} rot={rot} ink={ink} field={field}>
      <FlipCard front={front} back={back} width={VOICE_W} height={VOICE_H} flipped={flipped} onFlip={setFlipped} />
    </Decor>
  );
}
