import '@fontsource/shantell-sans/300.css';
import '@fontsource/shantell-sans/500.css';
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import ScrapDefs from './components/ScrapDefs';
import ComponentStage from './gallery/ComponentStage';
import GalleryIndex from './gallery/GalleryIndex';
import ScreenStage from './gallery/ScreenStage';
import IphoneShowcase from './showcase/IphoneShowcase';
import RecordingStage from './showcase/RecordingStage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScrapDefs />
    <HashRouter>
      <Routes>
        <Route path="/" element={<GalleryIndex />} />
        <Route path="/showcase" element={<IphoneShowcase />} />
        <Route path="/capture" element={<RecordingStage />} />
        <Route path="/screens/:id" element={<ScreenStage />} />
        <Route path="/components/:id" element={<ComponentStage />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
