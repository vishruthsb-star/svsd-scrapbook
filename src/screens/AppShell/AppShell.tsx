import { useState } from 'react';
import HomeBottomNavigation from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import type { HomeBottomNavigationValue } from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import CanvasScreen from '@/screens/CanvasScreen/CanvasScreen';
import HomeScreenShell from '@/screens/HomeScreen/HomeScreenShell';
import './AppShell.css';

export default function AppShell() {
  const [navValue, setNavValue] = useState<HomeBottomNavigationValue>('home');

  return (
    <div className="app-shell-root">
      <div
        className="app-shell-screen app-shell-home"
        role="tabpanel"
        aria-labelledby="nav-home"
        hidden={navValue !== 'home'}
        inert={navValue !== 'home'}
      >
        <HomeScreenShell />
      </div>
      <div
        className="app-shell-screen app-shell-canvas"
        role="tabpanel"
        aria-labelledby="nav-journal"
        hidden={navValue !== 'journal'}
        inert={navValue !== 'journal'}
      >
        <CanvasScreen />
      </div>
      <nav className="app-shell-nav-overlay">
        <HomeBottomNavigation value={navValue} onChange={setNavValue} />
      </nav>
    </div>
  );
}
