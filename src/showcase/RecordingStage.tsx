import { useEffect } from 'react';
import './RecordingStage.css';

const CHANNEL = 'scrapbook-showcase-recording';

export default function RecordingStage() {
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: 'stage-ready' });
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === 'stop' || event.data.type === 'cancel') window.close();
    };
    return () => channel.close();
  }, []);
  return <main className="recording-stage" aria-label="Scrapbook recording"><iframe src={`${import.meta.env.BASE_URL}#/screens/app`} title="Interactive scrapbook recording" /></main>;
}
