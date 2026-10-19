import { useId, useRef, useState } from 'react';
import './InviteSection.css';

export interface InviteSectionProps {
  handle?: string;
  onInvite?: () => void;
}

const CLIPBOARD_PATH = 'M8.5 8.5h11v11h-11z M15.5 8.5V4.5h-11v11h4';
const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5';

export default function InviteSection({ handle = 'vishruth', onInvite }: InviteSectionProps) {
  const link = `c-o.page/${handle}`;

  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const inkId = `inv-ink-${rawId}`;
  const boilId = `inv-boil-${rawId}`;

  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleCopy = () => {
    try {
      if (navigator.clipboard) {
        void navigator.clipboard.writeText(link);
      } else {
        const temp = document.createElement('textarea');
        temp.value = link;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
    } catch {
      // clipboard access denied — the "copied" confirmation simply won't reflect a real copy
    }
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  const buttonTransform = press ? 'scale(.96) rotate(-1deg)' : 'none';
  const buttonFilter = hover ? `url(#${boilId})` : `url(#${inkId})`;

  return (
    <section className="invite-root">
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id={inkId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={2400} height={2400}>
            <feTurbulence type="fractalNoise" baseFrequency={0.06} numOctaves={2} seed={5} />
            <feDisplacementMap in="SourceGraphic" scale={1.1} />
          </filter>
          <filter id={boilId} filterUnits="userSpaceOnUse" x={-300} y={-300} width={2400} height={2400}>
            <feTurbulence type="fractalNoise" baseFrequency={0.06} numOctaves={2} seed={5}>
              <animate attributeName="seed" values="5;9;14" dur="0.42s" calcMode="discrete" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale={1.8} />
          </filter>
        </defs>
      </svg>

      <svg className="invite-flower" width={55} height={83} viewBox="0 0 55 83" fill="none" aria-hidden="true">
        <g style={{ filter: `url(#${inkId})` }} stroke="#111111" strokeLinecap="round" strokeLinejoin="round">
          <path d="M27.5 80 C26 58 29 36 25 16" strokeWidth={1.6} />
          <path d="M26 52 C18 48 12 50 7 44" strokeWidth={1.4} />
          <path d="M27 62 C35 59 40 62 46 57" strokeWidth={1.4} />
          <path
            d="M25 16 C20 12 20 5 26 2 C32 5 32 12 27 16 C32 13 39 14 41 20 C38 25 31 25 26 21 C29 26 28 33 22 34 C17 30 18 23 23 19 C18 21 11 19 10 13 C13 8 20 8 25 13 Z"
            strokeWidth={1.5}
          />
        </g>
      </svg>

      <div className="invite-copy">
        <div className="invite-copy-strong">someone belongs in your scrapbook</div>
        <div className="invite-copy-muted">give them a way in</div>
      </div>

      <div className="invite-link-row">
        <div className="invite-link-inner">
          <div
            className="invite-copy-icon"
            role="button"
            tabIndex={0}
            aria-label="copy link"
            onClick={handleCopy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCopy();
              }
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
              <g style={{ filter: `url(#${inkId})` }}>
                <path d={copied ? CHECK_PATH : CLIPBOARD_PATH} strokeWidth={1.75} />
              </g>
            </svg>
          </div>
          <input readOnly value={link} aria-label="your link" onFocus={(e) => e.target.select()} className="invite-link-input" />
        </div>
        <svg width="100%" height={8} viewBox="0 0 300 8" preserveAspectRatio="none" className="invite-link-underline" aria-hidden="true">
          <g style={{ filter: `url(#${inkId})` }}>
            <path d="M-2 4 C84 2 192 6 302 3" fill="none" stroke="#111111" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        {copied && <span className="invite-copied">copied!</span>}
      </div>

      <button
        type="button"
        className="invite-button"
        style={{ transform: buttonTransform }}
        onClick={onInvite}
        onPointerDown={() => setPress(true)}
        onPointerUp={() => setPress(false)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setPress(false);
          setHover(false);
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 132 60" preserveAspectRatio="none" className="invite-button-blob" aria-hidden="true">
          <g style={{ filter: buttonFilter }}>
            <path
              d="M70 3 C120 1 132 18 130 32 C128 50 100 58 64 57 C24 56 3 46 3 30 C3 12 30 4 78 6"
              fill="#494444"
              stroke="#494444"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
        <span className="invite-button-label">invite a friend</span>
      </button>
    </section>
  );
}
