import paperAirplane from '../../assets/icons/paper-airplane.svg?raw';
import './Header.css';

export interface HeaderProps {
  ownerName: string;
  onSendClick?: () => void;
}

/** The compact correspondence masthead used by the final Home screen. */
export default function Header({ ownerName, onSendClick }: HeaderProps) {
  return (
    <header className="header-root">
      <div className="header-topline">
        <span className="header-mark" aria-label={`${ownerName}'s correspondence`}>c/o</span>
        <button type="button" className="header-send" aria-label="send" onClick={onSendClick} dangerouslySetInnerHTML={{ __html: paperAirplane }} />
      </div>
      <div className="header-titles">
        <p className="header-title">a library of thoughts</p>
        <p className="header-eyebrow">composed by your people</p>
      </div>
    </header>
  );
}
