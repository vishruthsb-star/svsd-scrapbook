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
}

export default function ScrapbookHeader({
  title = 'vishruth’s scrapbook',
  avatarSrc,
  onBack,
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
      <p className="scrapbook-header-title">{title}</p>
      {avatarSrc ? (
        <img className="scrapbook-header-avatar" src={avatarSrc} alt="Profile photo" />
      ) : (
        <div className="scrapbook-header-avatar" role="img" aria-label="Profile photo" />
      )}
    </header>
  );
}
