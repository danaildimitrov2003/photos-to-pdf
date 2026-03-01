import { jsPDF } from 'jspdf';
import type { PageConfig, PhotoEntry } from '../types';

const DPI = 150;
const CANVAS_W = Math.round((210 / 25.4) * DPI); // ~1240
const CANVAS_H = Math.round((297 / 25.4) * DPI); // ~1754

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
  pageNumber: number | null, // null = no number shown
  config: PageConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Photo area based on scale
  const scale = config.photoScale;
  const photoAreaW = CANVAS_W * scale;
  const photoAreaH = CANVAS_H * (scale * 0.93); // slight vertical adjustment
  const photoAreaX = (CANVAS_W - photoAreaW) / 2;
  const photoAreaY = (CANVAS_H - photoAreaH) / 2 - CANVAS_H * 0.03;

  // Fit image preserving aspect ratio
  const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
  const areaAspect = photoAreaW / photoAreaH;

  let drawW: number, drawH: number;
  if (imgAspect > areaAspect) {
    drawW = photoAreaW;
    drawH = photoAreaW / imgAspect;
  } else {
    drawH = photoAreaH;
    drawW = photoAreaH * imgAspect;
  }

  const drawX = photoAreaX + (photoAreaW - drawW) / 2;
  const drawY = photoAreaY + (photoAreaH - drawH) / 2;

  ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);

  // Page number
  if (pageNumber !== null && config.showPageNumber) {
    const fontSizePx = Math.round(config.fontSize * (DPI / 72));
    ctx.font = `${fontSizePx}px '${config.font}', cursive, fantasy, serif`;
    ctx.fillStyle = config.fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textY = CANVAS_H - CANVAS_H * 0.05;
    ctx.fillText(`${pageNumber}`, CANVAS_W / 2, textY);
  }

  return canvas;
}

export async function generatePDF(
  photos: PhotoEntry[],
  getPageConfig: (index: number) => PageConfig,
  numberingStartPage: number,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentNumber = 1;

  for (let i = 0; i < photos.length; i++) {
    if (i > 0) doc.addPage();

    const pct = Math.round(((i + 1) / photos.length) * 100);
    onProgress(pct, `Processing page ${i + 1} of ${photos.length}...`);

    const config = getPageConfig(i);
    const img = await loadImage(photos[i].dataUrl);

    // Determine page number to display
    let displayNumber: number | null = null;
    if (i >= numberingStartPage && config.showPageNumber && !config.isCover) {
      displayNumber = currentNumber;
    }

    const canvas = renderPageToCanvas(img, displayNumber, config);
    const pageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(pageDataUrl, 'JPEG', 0, 0, 210, 297);

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
