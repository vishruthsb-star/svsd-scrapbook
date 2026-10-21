/**
 * Approved production layout for the paired top-right scrapbook actions.
 *
 * The layout lab consumes this same source for its reset state, while the live
 * canvas uses it only for CanvasScreen's top-right visitor placement.
 */
export const PRODUCTION_FAB_LAYOUT = {
  boopButton: {
    width: 99,
    height: 46,
    logoScale: 1.69,
    logoOffsetX: 0,
    logoOffsetY: 0,
    logoRotation: 0,
    /** Visible header-to-AddFab gap measured in the production canvas. */
    verticalGap: 13,
    horizontalOffset: 0,
  },
  addFab: {
    offsetX: 0,
    offsetY: -7,
  },
} as const;
