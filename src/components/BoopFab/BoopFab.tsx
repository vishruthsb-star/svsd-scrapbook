/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import reference from '../../../references/Scrapbook Boop Button V5.html?raw';
import './BoopFab.css';
import './BoopFabHeader.css';
import './BoopFabLayer.css';

export const BOOP_STAMP_KEYS = ['nostalgic', 'giddy', 'memory', 'curious', 'hug', 'hi', 'daydream', 'grateful', 'overjoyed', 'grin'] as const;
export type BoopStampKey = (typeof BOOP_STAMP_KEYS)[number];
export interface BoopStampData { key: BoopStampKey; label: string; inner: string; }

type ReferenceAssets = { BOOP_SVG: string; CLOSE_ICON: (id: string) => string; defs: (id: string) => string; stamps: (name: string, id: string) => BoopStampData[] };
let cachedAssets: ReferenceAssets | null = null;

// This is the exact BOOP mark and stamp factory from the approved HTML reference. Keeping
// it as source data avoids a second, drift-prone transcription of the ten authored SVGs.
function assets(): ReferenceAssets {
  if (cachedAssets) return cachedAssets;
  // The source slice includes the reference tokens used by its CSS/icon factory.
  const start = reference.indexOf('var FONT');
  const end = reference.indexOf('function BoopFab');
  if (start < 0 || end < 0) throw new Error('The BOOP reference assets could not be located.');
  cachedAssets = Function(`${reference.slice(start, end)}; return { BOOP_SVG, CLOSE_ICON, defs, stamps };`)() as ReferenceAssets;
  return cachedAssets;
}

export function BoopStamp({ stampKey, recipientName, className }: { stampKey: BoopStampKey; recipientName: string; className?: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = `boop-${rawId}`;
  const stamp = useMemo(() => assets().stamps(recipientName, id).find((entry) => entry.key === stampKey), [recipientName, id, stampKey]);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const fit = () => svgRef.current?.querySelectorAll<SVGTextElement>('text[data-fit]').forEach((node) => {
      const base = Number.parseFloat(node.dataset.baseSize ?? node.style.fontSize) || 16;
      node.dataset.baseSize = String(base); node.style.fontSize = `${base}px`;
      const max = Number(node.getAttribute('data-fit'));
      try { const length = node.getComputedTextLength(); if (length > max) node.style.fontSize = `${(base * max) / length}px`; } catch { /* SVG measurement is unavailable until fonts render. */ }
    });
    fit(); document.fonts?.ready.then(fit).catch(() => undefined);
  }, [stamp]);
  if (!stamp) return null;
  return <svg ref={svgRef} className={className} viewBox="0 0 300 300" aria-label={stamp.label} role="img" dangerouslySetInnerHTML={{ __html: `<defs>${assets().defs(id)}</defs>${stamp.inner}` }} />;
}

export interface BoopFabProps { recipientName: string; x: number; y: number; open: boolean; onOpen: () => void; onClose: () => void; onSelect: (key: BoopStampKey) => void; disabled?: boolean; /** Preview-only visual overrides; production callers omit these. */ buttonStyle?: CSSProperties; markStyle?: CSSProperties; }

export default function BoopFab({ recipientName, x, y, open, onOpen, onClose, onSelect, disabled = false, buttonStyle, markStyle }: BoopFabProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = `boop-picker-${rawId}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<BoopStampKey | null>(null);
  if (!open && picked) setPicked(null);
  const list = useMemo(() => assets().stamps(recipientName, id), [recipientName, id]);
  useEffect(() => { if (!open) buttonRef.current?.focus({ preventScroll: true }); else window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60); }, [open]);
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (open && e.key === 'Escape') onClose(); }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); }, [open, onClose]);
  const choose = (key: BoopStampKey) => { if (!open || picked) return; setPicked(key); onSelect(key); window.setTimeout(onClose, 460); };
  const a = assets();
  return <div className={`boopfab${open ? ' boopfab--open' : ''}${picked ? ' boopfab--picking' : ''}${disabled ? ' boopfab--under-addfab' : ''}`}>
    <div className="boopfab__scrim" onClick={onClose} />
    <div className="boopfab__veil" />
    <div className="boopfab__sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-hidden={!open}>
      <div className="boopfab__head"><div className="boopfab__heading"><span className="boopfab__title" id={`${id}-title`}>Send a boop</span><span className="boopfab__count">10 stamps</span></div><button ref={closeRef} className="boopfab__close" type="button" aria-label="Close stamp picker" onClick={onClose} dangerouslySetInnerHTML={{ __html: a.CLOSE_ICON(`${id}-icon`) }} /></div>
      <div className="boopfab__scroll"><div className="boopfab__grid">{list.map((stamp, index) => <button key={stamp.key} type="button" className={`boopfab__stamp${picked === stamp.key ? ' boopfab__stamp--picked' : ''}`} style={{ '--d': Math.min(index, 5) } as React.CSSProperties} aria-label={stamp.label} onClick={() => choose(stamp.key)}><span className="boopfab__card"><BoopStamp stampKey={stamp.key} recipientName={recipientName} /></span></button>)}</div></div>
    </div>
    <button ref={buttonRef} className="boopfab__pill" type="button" aria-label="Open stamps" aria-haspopup="dialog" aria-expanded={open} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} style={{ left: x, top: y, ...buttonStyle }} onClick={() => { if (!disabled) onOpen(); }}><span className="boopfab__mark-wrap" style={markStyle} dangerouslySetInnerHTML={{ __html: a.BOOP_SVG }} /></button>
  </div>;
}
