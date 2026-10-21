import { ScreenShell } from '@/components/ScreenShell';
import HomeScreen from './HomeScreen';

export interface HomeScreenShellProps { selectedPerson?: number; onSelectPerson?: (index: number) => void; }

export default function HomeScreenShell(props: HomeScreenShellProps) {
  return (
    <ScreenShell>
      <HomeScreen {...props} />
    </ScreenShell>
  );
}
