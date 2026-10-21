import type { ChangeEvent } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AddFab } from '@/components/AddFab';
import type { AddFabHandle } from '@/components/AddFab';
import { BoopFab } from '@/components/BoopFab';
import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import { PRODUCTION_FAB_LAYOUT } from '@/scrapbook/canvas/fabLayoutConfig';
import './ScrapbookFabLayoutLab.css';

const DEFAULTS: Record<'width' | 'height' | 'logo' | 'gap' | 'offset' | 'addX' | 'addY' | 'logoX' | 'logoY' | 'logoRotation', number> = {
  width: PRODUCTION_FAB_LAYOUT.boopButton.width,
  height: PRODUCTION_FAB_LAYOUT.boopButton.height,
  logo: PRODUCTION_FAB_LAYOUT.boopButton.logoScale * 100,
  gap: PRODUCTION_FAB_LAYOUT.boopButton.verticalGap,
  offset: PRODUCTION_FAB_LAYOUT.boopButton.horizontalOffset,
  addX: PRODUCTION_FAB_LAYOUT.addFab.offsetX,
  addY: PRODUCTION_FAB_LAYOUT.addFab.offsetY,
  logoX: PRODUCTION_FAB_LAYOUT.boopButton.logoOffsetX,
  logoY: PRODUCTION_FAB_LAYOUT.boopButton.logoOffsetY,
  logoRotation: PRODUCTION_FAB_LAYOUT.boopButton.logoRotation,
};

type Values = typeof DEFAULTS;
type Key = keyof Values;
type Metrics = { add?: DOMRect; boop?: DOMRect; mark?: DOMRect; frame?: DOMRect };

const RANGES: Record<Key, [number, number]> = {
  width: [50, 180], height: [30, 100], logo: [10, 400], gap: [-20, 120],
  offset: [-100, 100], addX: [-150, 150], addY: [-150, 150],
  logoX: [-50, 50], logoY: [-30, 30], logoRotation: [-30, 30],
};

const LABELS: Record<Key, string> = {
  width: 'BOOP width', height: 'BOOP height', logo: 'BOOP logo scale', gap: 'Vertical gap',
  offset: 'BOOP horizontal offset', addX: 'AddFab horizontal offset', addY: 'AddFab vertical offset',
  logoX: 'BOOP logo horizontal offset', logoY: 'BOOP logo vertical offset', logoRotation: 'BOOP logo rotation',
};

function Field({ label, field, min, max, value, unit = 'px', onChange }: {
  label: string; field: Key; min: number; max: number; value: number; unit?: string;
  onChange: (field: Key, value: number) => void;
}) {
  const update = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === '') return;
    onChange(field, Math.max(min, Math.min(max, Number(event.target.value) || 0)));
  };
  return (
    <label className="fab-lab-field">
      <span>{label}<b>{value}{unit}</b></span>
      <div>
        <input type="range" min={min} max={max} step={1} value={value} onChange={update} />
        <input aria-label={label} type="number" min={min} max={max} step={1} value={value} onChange={update} />
      </div>
    </label>
  );
}

export default function ScrapbookFabLayoutLab() {
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const [guides, setGuides] = useState(true);
  const [copyStatus, setCopyStatus] = useState('');
  const [metrics, setMetrics] = useState<Metrics>({});
  const addRef = useRef<AddFabHandle>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const setValue = (field: Key, value: number) => setValues((current) => ({ ...current, [field]: value }));
  const addPosition = { x: 316 + values.addX, y: 187 + values.addY };
  const boopPosition = {
    x: addPosition.x + values.offset,
    y: addPosition.y + 26 + values.gap + values.height / 2,
  };

  useLayoutEffect(() => {
    let active = true;
    const measure = () => {
      const frame = frameRef.current;
      if (!frame || !active) return;
      setMetrics({
        frame: frame.getBoundingClientRect(),
        add: frame.querySelector<HTMLElement>('.addfab__pill')?.getBoundingClientRect(),
        boop: frame.querySelector<HTMLElement>('.boopfab__pill')?.getBoundingClientRect(),
        mark: frame.querySelector<HTMLElement>('.boopfab__mark')?.getBoundingClientRect(),
      });
    };
    measure();
    const animation = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => { active = false; cancelAnimationFrame(animation); };
  }, [values, open]);

  const configuration = useMemo(() => JSON.stringify({
    boopButton: {
      width: values.width,
      height: values.height,
      logoScale: values.logo / 100,
      logoOffsetX: values.logoX,
      logoOffsetY: values.logoY,
      logoRotation: values.logoRotation,
      verticalGap: values.gap,
      horizontalOffset: values.offset,
    },
    addFab: { offsetX: values.addX, offsetY: values.addY },
  }, null, 2), [values]);

  const copyConfiguration = async () => {
    try {
      await navigator.clipboard.writeText(configuration);
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Select the JSON below to copy.');
    }
  };

  const measuredGap = metrics.add && metrics.boop ? Math.round(metrics.boop.top - metrics.add.bottom) : null;
  const centerOffset = metrics.add && metrics.boop
    ? Math.round((metrics.boop.left + metrics.boop.width / 2) - (metrics.add.left + metrics.add.width / 2))
    : null;
  const relative = (rect: DOMRect | undefined, axis: 'left' | 'top') => {
    if (!rect || !metrics.frame) return undefined;
    return rect[axis] - metrics.frame[axis];
  };
  const logoStyle = {
    transform: `translate(${values.logoX}px, ${values.logoY}px) rotate(${values.logoRotation}deg) scale(${values.logo / 100})`,
  };
  const measuredFields = (Object.keys(RANGES) as Key[]).map((field) => (
    <Field key={field} field={field} label={LABELS[field]} min={RANGES[field][0]} max={RANGES[field][1]}
      value={values[field]} unit={field === 'logo' ? '%' : field === 'logoRotation' ? '°' : 'px'} onChange={setValue} />
  ));

  return (
    <div className="fab-lab">
      <div className="fab-lab-preview">
        <div ref={frameRef} className="fab-lab-frame">
          <ScrapbookCanvasPage style="torn-strata" view="own" />
          <AddFab ref={addRef} className="fab-lab-addfab" placement="tr" frameW={390} frameH={844}
            cornerRadius={0} x={addPosition.x} y={addPosition.y} zIndex={200} onOpen={() => setOpen(false)} />
          <BoopFab senderName="Priya" x={boopPosition.x} y={boopPosition.y} open={open}
            onOpen={() => { addRef.current?.close(); setOpen(true); }} onClose={() => setOpen(false)} onSelect={() => undefined}
            buttonStyle={{ width: values.width, height: values.height, overflow: 'visible' }} markStyle={logoStyle} />
          {guides && (
            <div className="fab-lab-guides">
              <i style={{ left: addPosition.x }} />
              <i style={{ left: boopPosition.x }} />
              <em style={{ left: relative(metrics.add, 'left'), top: relative(metrics.add, 'top'), width: metrics.add?.width, height: metrics.add?.height }} />
              <em style={{ left: relative(metrics.boop, 'left'), top: relative(metrics.boop, 'top'), width: metrics.boop?.width, height: metrics.boop?.height }} />
              <em className="fab-lab-guide-logo" style={{ left: relative(metrics.mark, 'left'), top: relative(metrics.mark, 'top'), width: metrics.mark?.width, height: metrics.mark?.height }} />
              <small style={{ left: addPosition.x + 8, top: addPosition.y + 26 }}>gap {measuredGap ?? '—'}px</small>
            </div>
          )}
        </div>
      </div>
      <aside className="fab-lab-controls">
        <h2>Scrapbook FAB Layout Lab</h2>
        {measuredFields}
        <div className="fab-lab-presets" aria-label="Logo scale presets">
          {[50, 100, 150, 200, 300].map((preset) => <button type="button" key={preset} onClick={() => setValue('logo', preset)}>{preset}%</button>)}
        </div>
        <label className="fab-lab-toggle"><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} />Show Alignment Guides</label>
        <p className="fab-lab-readout">
          AddFab: {metrics.add ? `${Math.round(metrics.add.width)} × ${Math.round(metrics.add.height)}px` : 'not measured'}<br />
          BOOP: {metrics.boop ? `${Math.round(metrics.boop.width)} × ${Math.round(metrics.boop.height)}px` : 'not measured'}<br />
          Gap: {measuredGap ?? 'not measured'}px · center offset: {centerOffset ?? 'not measured'}px<br />
          Logo: {metrics.mark ? `${Math.round(metrics.mark.width)} × ${Math.round(metrics.mark.height)}px` : 'not measured'}
        </p>
        <button type="button" onClick={copyConfiguration}>Copy Configuration</button>
        <button type="button" onClick={() => setValues(DEFAULTS)}>Reset to Production Defaults</button>
        <span>{copyStatus}</span>
        <textarea readOnly value={configuration} aria-label="Current FAB configuration JSON" />
      </aside>
    </div>
  );
}
