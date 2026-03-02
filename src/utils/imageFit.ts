import type { PageConfig, PhotoEntry } from '../types';

/**
 * Compute the actual display dimensions for an image, preserving its
 * natural aspect ratio when there is no explicit per-page size override.
 *
 * When the user has NOT manually set imageWidthPct / imageHeightPct on this
 * page, we "contain" the image within the global bounding box (preserving
 * the photo's natural aspect ratio).
 *
 * When the user HAS set an override (e.g. by dragging an edge handle or
 * adjusting the stepper), we honour the exact values — the image may be
 * stretched.
 *
 * Returns { widthPct, heightPct } — the effective container dimensions as
 * percentages of page width/height.
 */
export function computeEffectiveImageDims(
  photo: PhotoEntry,
  config: PageConfig,
  pageOverrides: Record<number, Partial<PageConfig>>,
  pageIndex: number,
  pageWidthMm: number,
  pageHeightMm: number,
): { widthPct: number; heightPct: number } {
  const overrides = pageOverrides[pageIndex] || {};
  const hasExplicitSize =
    'imageWidthPct' in overrides || 'imageHeightPct' in overrides;

  if (hasExplicitSize || !photo.naturalWidth || !photo.naturalHeight) {
    // User explicitly set dimensions on this page, or we don't have natural
    // dims — use config values as-is.
    return {
      widthPct: config.imageWidthPct,
      heightPct: config.imageHeightPct,
    };
  }

  // No per-page size override → fit image into the global bounding box
  // while preserving its natural aspect ratio.
  const boxW = config.imageWidthPct;   // % of page width
  const boxH = config.imageHeightPct;  // % of page height

  // Convert bounding-box percentages to real-world mm so we can compare
  // aspect ratios in a common unit.
  const boxRealW = (boxW / 100) * pageWidthMm;
  const boxRealH = (boxH / 100) * pageHeightMm;

  const imageAspect = photo.naturalWidth / photo.naturalHeight;
  const boxAspect = boxRealW / boxRealH;

  let fitW: number;
  let fitH: number;

  if (imageAspect > boxAspect) {
    // Image is wider than box → constrain by width
    fitW = boxW;
    const fitRealH = boxRealW / imageAspect;
    fitH = (fitRealH / pageHeightMm) * 100;
  } else {
    // Image is taller than (or equal to) box → constrain by height
    fitH = boxH;
    const fitRealW = boxRealH * imageAspect;
    fitW = (fitRealW / pageWidthMm) * 100;
  }

  return {
    widthPct: Math.round(fitW * 10) / 10,
    heightPct: Math.round(fitH * 10) / 10,
  };
}
