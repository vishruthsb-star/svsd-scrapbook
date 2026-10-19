import paperAirplane from '../../assets/icons/paper-airplane.svg?raw';
import './Header.css';

export interface HeaderProps {
  ownerName: string;
  onSendClick?: () => void;
}

export default function Header({ ownerName, onSendClick }: HeaderProps) {
  return (
    <header className="header-root">
      <div className="header-titles">
        <p className="header-eyebrow">welcome to</p>
        <p className="header-title">{ownerName}’s Library</p>
      </div>
      <button
        type="button"
        className="header-send"
        aria-label="send"
        onClick={onSendClick}
        dangerouslySetInnerHTML={{ __html: paperAirplane }}
      />
    </header>
  );
}
