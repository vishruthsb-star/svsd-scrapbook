import { Link } from 'react-router-dom';
import { COMPONENTS, SCREENS, type GalleryEntry } from './registry';
import './gallery.css';

function GalleryCard({ entry }: { entry: GalleryEntry }) {
  const href = entry.kind === 'screen' ? `/screens/${entry.id}` : `/components/${entry.id}`;
  return (
    <Link to={href} className="gallery-card">
      <div className={entry.kind === 'screen' ? 'gallery-card-preview gallery-card-preview-screen' : 'gallery-card-preview'}>
        <div className={entry.kind === 'screen' ? 'gallery-card-preview-scale gallery-card-preview-scale-screen' : 'gallery-card-preview-scale'}>
          {entry.render()}
        </div>
      </div>
      <div className="gallery-card-title">{entry.title}</div>
      <div className="gallery-card-description">{entry.description}</div>
    </Link>
  );
}

export default function GalleryIndex() {
  return (
    <div className="gallery-root">
      <header className="gallery-masthead">
        <h1>Scrapbook component gallery</h1>
        <p>Every screen and component, rendered live from its real source.</p>
      </header>

      <section className="gallery-section">
        <h2>Screens</h2>
        <div className="gallery-grid">
          {SCREENS.map((entry) => (
            <GalleryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <section className="gallery-section">
        <h2>Components</h2>
        <div className="gallery-grid">
          {COMPONENTS.map((entry) => (
            <GalleryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
