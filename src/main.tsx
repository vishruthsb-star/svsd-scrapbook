import '@fontsource/shantell-sans/300.css';
import '@fontsource/shantell-sans/500.css';
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/dm-mono/400.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import ScrapDefs from './components/ScrapDefs';
import ComponentStage from './gallery/ComponentStage';
import GalleryIndex from './gallery/GalleryIndex';
import ScreenStage from './gallery/ScreenStage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScrapDefs />
    <HashRouter>
      <Routes>
        <Route path="/" element={<GalleryIndex />} />
        <Route path="/screens/:id" element={<ScreenStage />} />
        <Route path="/components/:id" element={<ComponentStage />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
