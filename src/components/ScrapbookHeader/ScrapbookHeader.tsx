import { useEffect, useState } from 'react';
import './ScrapbookHeader.css';

/**
 * Faithful port of references/scrapbook-header.html (Figma node 118:1744, "Frame 13").
 * 354x61 pill: back-arrow icon, title, 44x44 scrapbook cover (falls back to the
 * reference gradient when no usable cover source is given).
 */
export interface ScrapbookHeaderProps {
  /** Defaults to the reference copy exactly, including the curly apostrophe. */
  title?: string;
  /** Album-cover URL for the scrapbook currently being viewed. */
  coverSrc?: string;
  /** @deprecated Use coverSrc. Kept for existing isolated consumers. */
  avatarSrc?: string;
  onBack?: () => void;
  /** Opens the scrapbook's profile/settings screen from either identity affordance. */
  onProfileOpen?: () => void;
}

export default function ScrapbookHeader({
  title = 'vishruth’s scrapbook',
  coverSrc,
  avatarSrc,
  onBack,
  onProfileOpen,
}: ScrapbookHeaderProps) {
  const imageSrc = coverSrc ?? avatarSrc;
  const [imageFailed, setImageFailed] = useState(false);

  // A profile edit can replace a failed source; let the cover slot attempt the new image.
  useEffect(() => setImageFailed(false), [imageSrc]);

  const cover = imageSrc && !imageFailed
    ? <img src={imageSrc} alt="" onError={() => setImageFailed(true)} />
    : <span aria-hidden="true" />;

  return (
    <header className="scrapbook-header">
      <button
        type="button"
        className="scrapbook-header-back"
        aria-label="Back"
        onClick={onBack}
      >
        <svg className="scrapbook-header-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19.59 12.06H4.71M10.94 5.83L4.71 12.06L10.94 18.29"
            stroke="#464646"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {onProfileOpen ? (
        <button type="button" className="scrapbook-header-title scrapbook-header-profile-trigger" onClick={onProfileOpen}>
          {title}
        </button>
      ) : <p className="scrapbook-header-title">{title}</p>}
      {onProfileOpen ? (
        <button type="button" className="scrapbook-header__cover scrapbook-header-cover-button" aria-label="Open scrapbook profile" onClick={onProfileOpen}>
          {cover}
        </button>
      ) : (
        <div className="scrapbook-header__cover" role="img" aria-label="Scrapbook cover">
          {cover}
        </div>
      )}
    </header>
  );
}
