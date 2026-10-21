import { useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import './ScrapbookCover.css';

export interface ScrapbookCoverProps {
  name?: string;
  coverImage?: string | null;
  onClick?: () => void;
  className?: string;
}

const PAGE_TRANSFORMS = [
  'translate(-18px, -6px) rotate(-9deg)',
  'translate(16px, -10px) rotate(7deg)',
  'translate(-6px, 16px) rotate(-5deg)',
];
const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

export default function ScrapbookCover({
  name = 'vishruth’s scrapbook',
  coverImage = null,
  onClick,
  className = '',
}: ScrapbookCoverProps) {
  const rawId = useId().replace(/:/g, '');
  const hatchId = `scrapbook-hatch-${rawId}`;
  const inkId = `scrapbook-ink-${rawId}`;
  const clipId = `scrapbook-image-clip-${rawId}`;
  const pages = useRef<Array<SVGGElement | null>>([]);
  const loose = useRef<SVGGElement>(null);
  const cover = useRef<SVGGElement>(null);
  const tagShape = useRef<SVGGElement>(null);
  const tagText = useRef<HTMLDivElement>(null);

  const burst = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClick?.();
      return;
    }
    const animate = (element: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!element) return;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(frames, { duration: 1500, fill: 'none', ...options });
    };
    pages.current.forEach((page, index) => animate(page, [
      { transform: 'none' },
      { transform: PAGE_TRANSFORMS[index], offset: 0.35 },
      { transform: PAGE_TRANSFORMS[index], offset: 0.7 },
      { transform: 'none' },
    ], { easing: SPRING }));
    animate(loose.current, [
      { transform: 'none' },
      { transform: 'translate(24px,-10px) rotate(12deg) scale(1.1)', offset: 0.35 },
      { transform: 'translate(24px,-10px) rotate(12deg) scale(1.1)', offset: 0.7 },
      { transform: 'none' },
    ], { easing: SPRING });
    animate(cover.current, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.04) rotate(.8deg)', offset: 0.3 },
      { transform: 'scale(1)' },
    ], { easing: SPRING });
    animate(tagShape.current, [{ transform: 'rotate(0)' }, { transform: 'rotate(8deg)', offset: 0.3 }, { transform: 'rotate(-4deg)', offset: 0.6 }, { transform: 'rotate(0)' }], { easing: 'ease-out' });
    animate(tagText.current, [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(2deg)', offset: 0.3 }, { transform: 'rotate(-10deg)', offset: 0.6 }, { transform: 'rotate(-6deg)' }], { easing: 'ease-out' });
    onClick?.();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      burst();
    }
  };
  const handleClick = () => burst();

  return (
    <div className={`scrapbook-cover ${className}`} role="button" tabIndex={0} aria-label={`Open ${name}`} onClick={handleClick} onKeyDown={handleKeyDown}>
      <svg viewBox="0 0 400 430" aria-hidden="true" className="scrapbook-cover-art">
        <defs>
          <filter id={inkId} filterUnits="userSpaceOnUse" x="-100" y="-100" width="700" height="700"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="2.4" /></filter>
          <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#111111" strokeWidth="1.1" /></pattern>
          <clipPath id={clipId}><rect x="66" y="92" width="190" height="190" /></clipPath>
        </defs>
        <g filter={`url(#${inkId})`}>
          {[
            ['rotate(-3 182 225)', 48, 60, '#FAF7F0'], ['rotate(2 174 231)', 40, 66, '#E8DFC8'], ['rotate(5 190 219)', 56, 54, '#F3EBD8'],
          ].map(([transform, x, y, fill], index) => (
            <g key={String(transform)} ref={(element) => { pages.current[index] = element; }} className="scrapbook-cover-layer" transform={String(transform)}><rect x={Number(x)} y={Number(y)} width="268" height="330" fill={String(fill)} stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
          ))}
          <g ref={loose} className="scrapbook-cover-layer">
            <g transform="rotate(-9 320 330)"><path d="M300 300 L346 300 L346 372 L300 372 Z" fill="#D8422C" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M300 312 L346 312" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
            <g transform="rotate(-8 46 325)"><rect x="14" y="300" width="64" height="50" fill="#FAF7F0" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
            {[['M22 318 L66 318'], ['M22 327 L58 327'], ['M22 336 L50 336'], ['M22 345 L66 345']].map(([d]) => <path key={d} d={d} stroke="#111111" strokeWidth="1.4" strokeLinecap="round" fill="none" transform="rotate(-8 22 318)" />)}
          </g>
          <g ref={cover} className="scrapbook-cover-layer">
            <g transform="rotate(0.5 170 217)"><rect x="36" y="52" width="268" height="330" fill="#353030" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
            {[54, 94, 134, 174, 214, 254, 294].map((x) => <path key={x} d={`M${x} 40 Q${x + 6} 32 ${x + 14} 40 Q${x + 20} 48 ${x + 14} 56 Q${x + 6} 62 ${x} 56`} fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
            {[61, 101, 141, 181, 221, 261, 301].map((cx) => <ellipse key={cx} cx={cx} cy="70" rx="5" ry="3.5" fill="#111111" />)}
            {[56, 96, 136, 176, 216, 256, 296].map((x) => <path key={x} d={`M${x} 48 Q${x + 4} 36 ${x + 10} 48`} fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
            <g transform="rotate(2 161 187)">
              <rect x="57" y="83" width="208" height="208" fill="#FAF7F0" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {coverImage ? <image href={coverImage} x="66" y="92" width="190" height="190" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} /> : <><rect x="66" y="92" width="190" height="190" fill={`url(#${hatchId})`} stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="115" y="177" width="92" height="20" fill="#FAF7F0" /><text x="161" y="191" textAnchor="middle" fontFamily="var(--font-condensed)" fontWeight="500" fontSize="11" letterSpacing="1.5" fill="#111111">ALBUM COVER</text></>}
              {coverImage && <rect x="66" y="92" width="190" height="190" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            </g>
            <g transform="rotate(-35 92 92)"><rect x="70" y="84" width="44" height="16" fill={`url(#${hatchId})`} stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g><g transform="rotate(38 250 96)"><rect x="228" y="88" width="44" height="16" fill={`url(#${hatchId})`} stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
          </g>
          <g ref={tagShape} className="scrapbook-cover-tag"><g transform="rotate(-6 180 345)"><path d="M70 322 L292 322 L306 346 L292 370 L70 370 Z" fill="#FAF7F0" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="288" cy="346" r="5" fill="#F2C14E" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g></g>
        </g>
      </svg>
      <div ref={tagText} className="scrapbook-cover-name" title={name}>{name}</div>
    </div>
  );
}
