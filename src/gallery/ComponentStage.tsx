import { Link, useParams } from 'react-router-dom';
import { COMPONENTS } from './registry';
import './gallery.css';

export default function ComponentStage() {
  const { id } = useParams<{ id: string }>();
  const entry = COMPONENTS.find((c) => c.id === id);

  if (!entry) {
    return (
      <div className="gallery-stage-page">
        <Link to="/" className="gallery-back-link">
          ← gallery
        </Link>
        <p>No component registered as “{id}”.</p>
      </div>
    );
  }

  return (
    <div className="gallery-stage-page">
      <Link to="/" className="gallery-back-link">
        ← gallery
      </Link>
      <h1 className="gallery-stage-title">{entry.title}</h1>
      <div className="gallery-stage">{entry.render()}</div>
    </div>
  );
}
