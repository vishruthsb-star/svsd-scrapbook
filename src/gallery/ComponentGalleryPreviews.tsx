import { useState } from 'react';
import Decor from '@/components/Decor';
import FlipCard from '@/components/FlipCard';
import ItemBack from '@/components/ItemBack';
import PillButton from '@/components/PillButton/PillButton';
import RemoveButton from '@/components/RemoveButton';
import { ScrapbookItem } from '@/components/ScrapbookItem';
import type { ScrapbookItemType } from '@/components/ScrapbookItem';

const previewButtonStyle = {
  border: '1px solid #cfc8bb',
  background: '#fffdf7',
  borderRadius: 999,
  padding: '7px 12px',
  font: '12px var(--font-condensed)',
  cursor: 'pointer',
} as const;

export function PillButtonPreview() {
  const [pressed, setPressed] = useState(false);
  return <div style={{ display: 'grid', justifyItems: 'center', gap: 14 }}><PillButton onClick={() => setPressed((value) => !value)}>Put them back</PillButton><span style={{ font: '13px var(--font-hand)' }} aria-live="polite">{pressed ? 'Button activated' : 'Click the pill to test it'}</span></div>;
}

export function ScrapbookItemPreview() {
  const [type, setType] = useState<ScrapbookItemType>('stamp');
  const [removed, setRemoved] = useState(false);
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(['stamp', 'note', 'voice', 'tag'] as const).map((kind) => <button key={kind} type="button" style={{ ...previewButtonStyle, background: type === kind ? '#e8dfc8' : '#fffdf7' }} onClick={() => { setType(kind); setRemoved(false); }}>{kind}</button>)}
      </div>
      {removed ? <div style={{ width: 210, minHeight: 80, display: 'grid', placeItems: 'center', font: '14px var(--font-hand)' }}>Memory removed <button type="button" style={previewButtonStyle} onClick={() => setRemoved(false)}>restore preview</button></div> : <ScrapbookItem id="gallery-scrapbook-item" type={type} text={type === 'note' ? 'wish you were here' : type === 'tag' ? 'a good read' : 'the view from here'} label={type === 'tag' ? 'link' : 'photo'} date="Oct 12" year="2026" from="maya" owner="Vishruth" view="own" seed={17} dur="0:42" url="https://example.com/article" onRemove={() => setRemoved(true)} />}
      <span style={{ font: '12px var(--font-condensed)', letterSpacing: '.08em' }}>Tap the card to flip it; choose a kind to switch the preview.</span>
    </div>
  );
}

export function DecorPreview() {
  const [seed, setSeed] = useState(7);
  return <div style={{ display: 'grid', justifyItems: 'center', gap: 18 }}>
    <Decor seed={seed} width={180} height={130} field="#FAF7F0">
      <div style={{ width: 180, height: 130, boxSizing: 'border-box', border: '2px solid #111', background: '#FAF7F0', display: 'grid', placeItems: 'center', font: '18px var(--font-hand)' }}>paper scrap</div>
    </Decor>
    <div style={{ display: 'flex', gap: 8 }}>{[7, 18, 29, 41].map((value) => <button key={value} type="button" style={{ ...previewButtonStyle, background: seed === value ? '#e8dfc8' : '#fffdf7' }} onClick={() => setSeed(value)}>seed {value}</button>)}</div>
    <span style={{ font: '12px var(--font-condensed)' }}>Change the seed to inspect the deterministic tape, clip, or torn-corner variations.</span>
  </div>;
}

export function FlipCardPreview() {
  return <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}><FlipCard width={210} height={150} front={<div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: '#FAF7F0', border: '2px solid #111', display: 'grid', placeItems: 'center', font: '18px var(--font-hand)' }}>front · tap to flip</div>} back={<div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: '#E8DFC8', border: '2px solid #111', display: 'grid', placeItems: 'center', font: '18px var(--font-hand)' }}>back · tap to return</div>} /><span style={{ font: '12px var(--font-condensed)' }}>Click, tap, or focus and press Enter/Space.</span></div>;
}

export function ItemBackPreview() {
  const [viewer, setViewer] = useState<'owner' | 'self' | 'other'>('owner');
  return <div style={{ display: 'grid', justifyItems: 'center', gap: 14 }}>
    <div style={{ position: 'relative', width: 200, height: 170, boxSizing: 'border-box', border: '2px solid #111', background: '#FAF7F0', fontFamily: 'var(--font-hand)', fontWeight: 300 }}>
      <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}><path d="M12 58H188M12 86H188M12 114H188M12 142H188" stroke="#8FB0CC" strokeOpacity=".55" /></svg>
      <ItemBack px={15} top={18} gap={18} owner="Vishruth" from="maya" viewer={viewer} date="OCT 12 2026" censorFill="M4 7 Q22 1 42 7 T86 7 L86 18 Q62 22 44 17 T4 18 Z" censorScribble="M5 17 Q20 4 36 18 T65 13 T86 9" censorWidth={72} />
    </div>
    <div style={{ display: 'flex', gap: 8 }}>{(['owner', 'self', 'other'] as const).map((value) => <button key={value} type="button" style={{ ...previewButtonStyle, background: viewer === value ? '#e8dfc8' : '#fffdf7' }} onClick={() => setViewer(value)}>{value}</button>)}</div>
  </div>;
}

export function RemoveButtonPreview() {
  const [removed, setRemoved] = useState(false);
  return <div style={{ position: 'relative', width: 200, height: 150, boxSizing: 'border-box', border: '2px solid #111', background: '#FAF7F0', display: 'grid', placeItems: 'center', font: '16px var(--font-hand)' }}>
    {removed ? <span>Removed <button type="button" style={previewButtonStyle} onClick={() => setRemoved(false)}>restore</button></span> : <><span>back of a memory</span><RemoveButton cardWidth={200} seed={13} onRemove={() => setRemoved(true)} /></>}
  </div>;
}
