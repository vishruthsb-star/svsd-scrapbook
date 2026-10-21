/**
 * Measurements for public/mockups/iphone-frame.png.
 *
 * All public geometry is normalized to the 740 × 740 source canvas, so the
 * presentation harness can scale the frame and its live display together.
 * Pixel measurements are retained here as comments/constants for calibration.
 */
export const IPHONE_FRAME_IMAGE = {
  width: 740,
  height: 740,
} as const

const normalizeX = (pixels: number) => pixels / IPHONE_FRAME_IMAGE.width
const normalizeY = (pixels: number) => pixels / IPHONE_FRAME_IMAGE.height

/**
 * The live display aperture measured from the supplied asset.
 *
 * Pixel bounds: x=223, y=53, width=294, height=633. The 40 px radius follows
 * the display edge underneath the visible black bezel; the bezel is part of
 * the PNG and therefore safely overlaps a display clipped to this aperture.
 */
export const IPHONE_SCREEN_VIEWPORT = {
  x: normalizeX(223),
  y: normalizeY(53),
  width: normalizeX(294),
  height: normalizeY(633),
  cornerRadius: normalizeX(40),
} as const

/**
 * Dynamic Island occlusion, retained for a future live-display safe-area
 * treatment. The frame PNG already renders this hardware above the display.
 * Pixel bounds: x=323, y=64, width=94, height=29.
 */
export const IPHONE_DYNAMIC_ISLAND = {
  x: normalizeX(323),
  y: normalizeY(64),
  width: normalizeX(94),
  height: normalizeY(29),
  cornerRadius: normalizeX(14.5),
} as const

/** Weak anti-aliased outer-pixel extent: x=210, y=42, width=322, height=656. */
export const IPHONE_FRAME_BOUNDS = {
  x: normalizeX(210),
  y: normalizeY(42),
  width: normalizeX(322),
  height: normalizeY(656),
} as const
