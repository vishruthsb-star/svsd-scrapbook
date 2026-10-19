import { useParams } from 'react-router-dom';
import { SCREENS } from './registry';

export default function ScreenStage() {
  const { id } = useParams<{ id: string }>();
  const entry = SCREENS.find((s) => s.id === id);

  if (!entry) {
    return <p>No screen registered as “{id}”.</p>;
  }

  return <>{entry.render()}</>;
}
