import './ScrapbookHeader.css';

/**
 * Faithful port of references/scrapbook-header.html (Figma node 118:1744, "Frame 13").
 * 354x61 pill: back-arrow icon, title, 44x44 avatar (falls back to a gradient placeholder
 * when no avatarSrc is given).
 */
export interface ScrapbookHeaderProps {
  /** Defaults to the reference copy exactly, including the curly apostrophe. */
  title?: string;
  /** Profile photo URL. When omitted, the avatar renders the reference's gradient placeholder. */
  avatarSrc?: string;
  onBack?: () => void;
  /** Opens the scrapbook's profile/settings screen from either identity affordance. */
  onProfileOpen?: () => void;
}

export default function ScrapbookHeader({
  title = 'vishruth’s scrapbook',
  avatarSrc,
  onBack,
  onProfileOpen,
}: ScrapbookHeaderProps) {
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
        <button type="button" className="scrapbook-header-avatar-button" aria-label="Open scrapbook profile" onClick={onProfileOpen}>
          {avatarSrc ? <img className="scrapbook-header-avatar" src={avatarSrc} alt="" /> : <span className="scrapbook-header-avatar" aria-hidden="true" />}
        </button>
      ) : avatarSrc ? <img className="scrapbook-header-avatar" src={avatarSrc} alt="Profile photo" /> : <div className="scrapbook-header-avatar" role="img" aria-label="Profile photo" />}
    </header>
  );
}
