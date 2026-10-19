import { Header } from '@/components/Header';
import { InviteSection } from '@/components/InviteSection';
import { Library } from '@/components/Library';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_HANDLE, OWNER_NAME } from '@/data/mock';
import './HomeScreen.css';

export default function HomeScreen() {
  return (
    <div className="home-root">
      <div className="home-header-wrap">
        <Header ownerName={OWNER_NAME} />
      </div>
      <div className="home-library-wrap">
        <Library people={LIBRARY_PEOPLE} defaultSelected={LIBRARY_ACTIVE_INDEX} />
      </div>
      <div className="home-invite-wrap">
        <InviteSection handle={OWNER_HANDLE} />
      </div>
    </div>
  );
}
