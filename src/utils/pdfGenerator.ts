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

/**
 * Word-wrap text into lines that fit within maxWidth.
 * Handles explicit \n newlines and word-level wrapping.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para === '') {
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

export function renderPageToCanvas(
  photoImg: HTMLImageElement | null,
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

  // Image (only for non-empty pages)
  if (photoImg) {
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
  }

  // Title (word-wrapped inside bounding box)
  if (titleText && config.showTitle) {
    const titleFontSizePx = Math.round(config.titleFontSize * (DPI / 72));
    ctx.font = `${titleFontSizePx}px '${config.titleFont}', cursive, fantasy, serif`;
    ctx.fillStyle = config.titleFontColor;
    ctx.textBaseline = 'top';

    // Bounding box in canvas pixels (titlePosition is top-left anchor)
    const boxX = (config.titlePosition.x / 100) * CANVAS_W;
    const boxY = (config.titlePosition.y / 100) * CANVAS_H;
    const boxW = (config.titleWidthPct / 100) * CANVAS_W;
    const boxH = (config.titleHeightPct / 100) * CANVAS_H;

    const lineHeight = titleFontSizePx * 1.3;
    const lines = wrapText(ctx, titleText, boxW - 8); // small padding
    const padding = 4;

    // Set text alignment
    const align = config.titleTextAlign || 'center';
    ctx.textAlign = align;

    let alignX: number;
    if (align === 'left') alignX = boxX + padding;
    else if (align === 'right') alignX = boxX + boxW - padding;
    else alignX = boxX + boxW / 2; // center

    for (let i = 0; i < lines.length; i++) {
      const lineY = boxY + padding + i * lineHeight;
      if (lineY + lineHeight > boxY + boxH) break; // clip to box
      ctx.fillText(lines[i], alignX, lineY);
    }
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
    const isEmpty = photos[i].isEmpty === true;

    // Load image only for non-empty pages
    const img = isEmpty ? null : await loadImage(photos[i].dataUrl);

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
      if (config.titleText) {
        titleText = config.titleText;
      } else if (!isEmpty) {
        titleText = photos[i].name.replace(/\.[^.]+$/, '');
      }
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
