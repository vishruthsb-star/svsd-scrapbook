import type { CanvasStyle } from '@/scrapbook/canvas';
import type { ScrapbookContributor, ScrapbookPresentation } from '@/types';

export const PRESENTATION_TO_CANVAS_STYLE: Record<ScrapbookPresentation, CanvasStyle> = {
  canvas: 'torn-strata',
  wheel: 'paper-wheel',
  envelope: 'envelopes-lip',
  cover: 'theme-spreads',
};

export const SCRAPBOOK_PRESENTATIONS: readonly ScrapbookPresentation[] = [
  'canvas',
  'wheel',
  'envelope',
  'cover',
];

export const PROFILE_CONTRIBUTORS: readonly ScrapbookContributor[] = [
  { id: 'owner', name: 'vishruth', permission: 'owner', fill: '#F4C9D4', rotation: -1 },
  { id: 'varun', name: 'varun', permission: 'can write', fill: '#C9D9F4', rotation: 1.2 },
  { id: 'maya', name: 'maya', permission: 'can write', fill: '#F6E3B4', rotation: -0.8 },
  { id: 'jun', name: 'jun', permission: 'can look', fill: '#D6C9F0', rotation: 1.5 },
  { id: 'ana', name: 'ana', permission: 'can write', fill: '#C5E8D9', rotation: -1.2 },
];

export function isScrapbookPresentation(value: string | null): value is ScrapbookPresentation {
  return value !== null && SCRAPBOOK_PRESENTATIONS.some((presentation) => presentation === value);
}
