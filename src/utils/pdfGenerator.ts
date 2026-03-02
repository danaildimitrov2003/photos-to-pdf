import { jsPDF } from 'jspdf';
import type { PageConfig, PhotoEntry, PageSize } from '../types';
import { computeEffectiveImageDims } from './imageFit';

const DPI = 150;

function mmToCanvasPx(mm: number): number {
  return Math.round((mm / 25.4) * DPI);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function renderPageToCanvas(
  photoImg: HTMLImageElement,
  pageNumber: number | null,
  config: PageConfig,
  pageSize: PageSize,
  titleText: string | null,
  effectiveWidthPct: number,
  effectiveHeightPct: number,
): HTMLCanvasElement {
  const CANVAS_W = mmToCanvasPx(pageSize.widthMm);
  const CANVAS_H = mmToCanvasPx(pageSize.heightMm);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Image area from effective dimensions (aspect-ratio-aware)
  const drawW = (effectiveWidthPct / 100) * CANVAS_W;
  const drawH = (effectiveHeightPct / 100) * CANVAS_H;

  // imagePosition is the center point as percentage of canvas
  const centerX = (config.imagePosition.x / 100) * CANVAS_W;
  const centerY = (config.imagePosition.y / 100) * CANVAS_H;
  const drawX = centerX - drawW / 2;
  const drawY = centerY - drawH / 2;

  // Draw image at the exact specified dimensions
  ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);

  // Title
  if (titleText && config.showTitle) {
    const titleFontSizePx = Math.round(config.titleFontSize * (DPI / 72));
    ctx.font = `${titleFontSizePx}px '${config.titleFont}', cursive, fantasy, serif`;
    ctx.fillStyle = config.titleFontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleX = (config.titlePosition.x / 100) * CANVAS_W;
    const titleY = (config.titlePosition.y / 100) * CANVAS_H;
    ctx.fillText(titleText, titleX, titleY);
  }

  // Page number
  if (pageNumber !== null && config.showPageNumber) {
    const fontSizePx = Math.round(config.fontSize * (DPI / 72));
    ctx.font = `${fontSizePx}px '${config.font}', cursive, fantasy, serif`;
    ctx.fillStyle = config.fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const numX = (config.pageNumberPosition.x / 100) * CANVAS_W;
    const numY = (config.pageNumberPosition.y / 100) * CANVAS_H;
    ctx.fillText(`${pageNumber}`, numX, numY);
  }

  return canvas;
}

export async function generatePDF(
  photos: PhotoEntry[],
  getPageConfig: (index: number) => PageConfig,
  numberingStartPage: number,
  pageSize: PageSize,
  pageOverrides: Record<number, Partial<PageConfig>>,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const doc = new jsPDF({
    orientation: pageSize.widthMm > pageSize.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageSize.widthMm, pageSize.heightMm],
  });

  let currentNumber = 1;

  for (let i = 0; i < photos.length; i++) {
    if (i > 0) doc.addPage([pageSize.widthMm, pageSize.heightMm]);

    const pct = Math.round(((i + 1) / photos.length) * 100);
    onProgress(pct, `Processing page ${i + 1} of ${photos.length}...`);

    const config = getPageConfig(i);
    const img = await loadImage(photos[i].dataUrl);

    // Compute effective image dimensions (aspect-ratio-aware when no override)
    const dims = computeEffectiveImageDims(
      photos[i], config, pageOverrides, i,
      pageSize.widthMm, pageSize.heightMm,
    );

    // Determine page number to display
    let displayNumber: number | null = null;
    if (i >= numberingStartPage && config.showPageNumber && !config.isCover) {
      displayNumber = currentNumber;
    }

    // Determine title text
    let titleText: string | null = null;
    if (config.showTitle) {
      titleText = config.titleText || photos[i].name.replace(/\.[^.]+$/, '');
    }

    const canvas = renderPageToCanvas(
      img, displayNumber, config, pageSize, titleText,
      dims.widthPct, dims.heightPct,
    );
    const pageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(pageDataUrl, 'JPEG', 0, 0, pageSize.widthMm, pageSize.heightMm);

    // Advance numbering only for non-cover pages at or past the start
    if (i >= numberingStartPage && !config.isCover) {
      currentNumber++;
    }

    // Yield to browser
    await new Promise((r) => setTimeout(r, 10));
  }

  onProgress(100, 'Saving PDF...');
  doc.save('photo-album.pdf');
}
