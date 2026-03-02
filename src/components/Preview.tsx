import { useMemo, useRef, useCallback, useState } from 'react';
import { useStore, resolvePageConfig } from '../store/useStore';
import type { Position } from '../types';
import { computeEffectiveImageDims } from '../utils/imageFit';

type DragTarget = 'image' | 'pageNumber' | 'title' | null;
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

const SNAP_THRESHOLD = 1.5; // percentage threshold for snapping

// Snap lines as percentages of page
const SNAP_X = [0, 10, 25, 33.33, 50, 66.67, 75, 90, 100];
const SNAP_Y = [0, 10, 25, 33.33, 50, 66.67, 75, 90, 100];

function snapValue(val: number, lines: number[]): { snapped: number; line: number | null } {
  for (const line of lines) {
    if (Math.abs(val - line) < SNAP_THRESHOLD) {
      return { snapped: line, line };
    }
  }
  return { snapped: val, line: null };
}

export function Preview() {
  const photos = useStore((s) => s.photos);
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const globalConfig = useStore((s) => s.globalConfig);
  const pageOverrides = useStore((s) => s.pageOverrides);
  const setPageOverride = useStore((s) => s.setPageOverride);
  const numberingStartPage = useStore((s) => s.numberingStartPage);
  const pageSize = useStore((s) => s.pageSize);

  const config = resolvePageConfig(globalConfig, pageOverrides, currentPage);

  const pageRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [resizing, setResizing] = useState<ResizeHandle>(null);
  const [activeSnapLines, setActiveSnapLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startPos: Position;
    startW: number;
    startH: number;
    imageAspect: number;
  }>({
    startX: 0, startY: 0,
    startPos: { x: 0, y: 0 },
    startW: 75, startH: 70,
    imageAspect: 1,
  });

  // Calculate the display number for the current page
  const displayNumber = useMemo(() => {
    if (photos.length === 0) return null;
    if (config.isCover || !config.showPageNumber) return null;
    if (currentPage < numberingStartPage) return null;

    let num = 0;
    for (let i = numberingStartPage; i <= currentPage; i++) {
      const cfg = resolvePageConfig(globalConfig, pageOverrides, i);
      if (!cfg.isCover) num++;
    }
    return num;
  }, [photos.length, currentPage, numberingStartPage, globalConfig, pageOverrides, config.isCover, config.showPageNumber]);

  // Get title text to display
  const titleText = useMemo(() => {
    if (!config.showTitle) return null;
    if (config.titleText) return config.titleText;
    if (photos.length > 0 && photos[currentPage]) {
      return photos[currentPage].name.replace(/\.[^.]+$/, '');
    }
    return null;
  }, [config.showTitle, config.titleText, photos, currentPage]);

  // Preview dimensions based on page size aspect ratio
  const previewDims = useMemo(() => {
    const maxW = 420;
    const maxH = 594;
    const aspect = pageSize.widthMm / pageSize.heightMm;

    let w: number, h: number;
    if (aspect > maxW / maxH) {
      w = maxW;
      h = maxW / aspect;
    } else {
      h = maxH;
      w = maxH * aspect;
    }
    return { width: Math.round(w), height: Math.round(h) };
  }, [pageSize.widthMm, pageSize.heightMm]);

  // Get current photo (may be undefined if no photos loaded)
  const photo = photos.length > 0 ? photos[currentPage] : null;

  // Compute aspect-ratio-correct image dimensions.
  // When there's no per-page size override, this fits the image into the
  // global bounding box while preserving the photo's natural aspect ratio.
  const effectiveDims = useMemo(() => {
    if (!photo) return { widthPct: config.imageWidthPct, heightPct: config.imageHeightPct };
    return computeEffectiveImageDims(
      photo,
      config,
      pageOverrides,
      currentPage,
      pageSize.widthMm,
      pageSize.heightMm,
    );
  }, [photo, config, pageOverrides, currentPage, pageSize.widthMm, pageSize.heightMm]);

  // Drag handler for moving elements
  const handleMouseDown = useCallback(
    (target: DragTarget, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(target);

      let startPos: Position;
      if (target === 'image') startPos = config.imagePosition;
      else if (target === 'pageNumber') startPos = config.pageNumberPosition;
      else startPos = config.titlePosition;

      dragStartRef.current = {
        ...dragStartRef.current,
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...startPos },
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        const dx = ev.clientX - dragStartRef.current.startX;
        const dy = ev.clientY - dragStartRef.current.startY;

        const pctX = (dx / rect.width) * 100;
        const pctY = (dy / rect.height) * 100;

        let rawX = dragStartRef.current.startPos.x + pctX;
        let rawY = dragStartRef.current.startPos.y + pctY;

        // Clamp
        rawX = Math.max(0, Math.min(100, rawX));
        rawY = Math.max(0, Math.min(100, rawY));

        // Snap
        const sx = snapValue(rawX, SNAP_X);
        const sy = snapValue(rawY, SNAP_Y);

        const snappedX: number[] = [];
        const snappedY: number[] = [];
        if (sx.line !== null) snappedX.push(sx.line);
        if (sy.line !== null) snappedY.push(sy.line);
        setActiveSnapLines({ x: snappedX, y: snappedY });

        const newPos: Position = { x: sx.snapped, y: sy.snapped };

        if (target === 'image') {
          setPageOverride(currentPage, { imagePosition: newPos });
        } else if (target === 'pageNumber') {
          setPageOverride(currentPage, { pageNumberPosition: newPos });
        } else if (target === 'title') {
          setPageOverride(currentPage, { titlePosition: newPos });
        }
      };

      const handleMouseUp = () => {
        setDragging(null);
        setActiveSnapLines({ x: [], y: [] });
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [config.imagePosition, config.pageNumberPosition, config.titlePosition, currentPage, setPageOverride]
  );

  // Resize handler for image
  const handleResizeMouseDown = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(handle);

      // Use the effective (fitted) dimensions as the starting point for resize.
      const startW = effectiveDims.widthPct;
      const startH = effectiveDims.heightPct;

      // Compute the aspect ratio of the current rendered image in real-world units.
      // imageWidthPct is % of page width, imageHeightPct is % of page height,
      // so the real aspect = (W% * pageWidthMm) / (H% * pageHeightMm).
      const imageAspect = (startW * pageSize.widthMm) / (startH * pageSize.heightMm);

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...config.imagePosition },
        startW,
        startH,
        imageAspect,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!pageRef.current || !handle) return;
        const rect = pageRef.current.getBoundingClientRect();
        const dx = ev.clientX - dragStartRef.current.startX;
        const dy = ev.clientY - dragStartRef.current.startY;

        const dPctX = (dx / rect.width) * 100;
        const dPctY = (dy / rect.height) * 100;

        const { startW, startH, startPos, imageAspect: aspect } = dragStartRef.current;

        const isCorner = handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se';

        let newW = startW;
        let newH = startH;
        let newPos = { ...startPos };

        if (isCorner) {
          // Corner resize: preserve aspect ratio
          let dW = 0;
          let dH = 0;

          if (handle === 'se') { dW = dPctX; dH = dPctY; }
          else if (handle === 'sw') { dW = -dPctX; dH = dPctY; }
          else if (handle === 'ne') { dW = dPctX; dH = -dPctY; }
          else if (handle === 'nw') { dW = -dPctX; dH = -dPctY; }

          // Use the larger delta to drive the resize, lock aspect ratio
          const realDW = (dW / 100) * pageSize.widthMm;
          const realDH = (dH / 100) * pageSize.heightMm;

          if (Math.abs(realDW) >= Math.abs(realDH)) {
            newW = Math.max(10, Math.min(100, startW + dW));
            const realW = (newW / 100) * pageSize.widthMm;
            const realH = realW / aspect;
            newH = Math.max(10, Math.min(100, (realH / pageSize.heightMm) * 100));
          } else {
            newH = Math.max(10, Math.min(100, startH + dH));
            const realH = (newH / 100) * pageSize.heightMm;
            const realW = realH * aspect;
            newW = Math.max(10, Math.min(100, (realW / pageSize.widthMm) * 100));
          }

          // Adjust position so the opposite corner stays fixed
          if (handle === 'nw') {
            newPos = {
              x: startPos.x + (startW - newW) / 2,
              y: startPos.y + (startH - newH) / 2,
            };
          } else if (handle === 'ne') {
            newPos = {
              x: startPos.x - (startW - newW) / 2,
              y: startPos.y + (startH - newH) / 2,
            };
          } else if (handle === 'sw') {
            newPos = {
              x: startPos.x + (startW - newW) / 2,
              y: startPos.y - (startH - newH) / 2,
            };
          } else if (handle === 'se') {
            newPos = {
              x: startPos.x - (startW - newW) / 2,
              y: startPos.y - (startH - newH) / 2,
            };
          }
        } else {
          // Edge resize: stretch freely (changes one dimension, image may distort)
          if (handle === 'e') {
            newW = Math.max(10, Math.min(100, startW + dPctX));
            newPos = { x: startPos.x - (startW - newW) / 2, y: startPos.y };
          } else if (handle === 'w') {
            newW = Math.max(10, Math.min(100, startW - dPctX));
            newPos = { x: startPos.x + (startW - newW) / 2, y: startPos.y };
          } else if (handle === 's') {
            newH = Math.max(10, Math.min(100, startH + dPctY));
            newPos = { x: startPos.x, y: startPos.y - (startH - newH) / 2 };
          } else if (handle === 'n') {
            newH = Math.max(10, Math.min(100, startH - dPctY));
            newPos = { x: startPos.x, y: startPos.y + (startH - newH) / 2 };
          }
        }

        setPageOverride(currentPage, {
          imageWidthPct: Math.round(newW * 10) / 10,
          imageHeightPct: Math.round(newH * 10) / 10,
          imagePosition: {
            x: Math.max(0, Math.min(100, newPos.x)),
            y: Math.max(0, Math.min(100, newPos.y)),
          },
        });
      };

      const handleMouseUp = () => {
        setResizing(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [effectiveDims.widthPct, effectiveDims.heightPct, config.imagePosition, currentPage, setPageOverride, pageSize.widthMm, pageSize.heightMm]
  );

  const isInteracting = dragging !== null || resizing !== null;

  if (photos.length === 0) {
    return (
      <div className="preview-container">
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <p>Select a folder with photos to get started</p>
        </div>
      </div>
    );
  }

  const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div className="preview-container">
      <div className="preview-size-label">
        {pageSize.name} ({pageSize.widthMm} x {pageSize.heightMm} mm)
      </div>
      <div
        ref={pageRef}
        className={`preview-page ${isInteracting ? 'is-dragging' : ''}`}
        style={{
          backgroundColor: config.bgColor,
          width: previewDims.width,
          height: previewDims.height,
        }}
      >
        {/* Snap guide lines */}
        {activeSnapLines.x.map((x) => (
          <div
            key={`snap-x-${x}`}
            className="snap-line snap-line-vertical"
            style={{ left: `${x}%` }}
          />
        ))}
        {activeSnapLines.y.map((y) => (
          <div
            key={`snap-y-${y}`}
            className="snap-line snap-line-horizontal"
            style={{ top: `${y}%` }}
          />
        ))}

        {/* Draggable + Resizable image */}
        <div
          className={`draggable-element draggable-image ${dragging === 'image' || resizing ? 'active-drag' : ''}`}
          style={{
            width: `${effectiveDims.widthPct}%`,
            height: `${effectiveDims.heightPct}%`,
            left: `${config.imagePosition.x}%`,
            top: `${config.imagePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => handleMouseDown('image', e)}
        >
          <img src={photo!.dataUrl} alt={photo!.name} draggable={false} />

          {/* Resize handles */}
          {handles.map((h) => (
            <div
              key={h}
              className={`resize-handle resize-handle-${h}`}
              onMouseDown={(e) => handleResizeMouseDown(h, e)}
            />
          ))}
        </div>

        {/* Draggable title */}
        {titleText && (
          <div
            className={`draggable-element draggable-title ${dragging === 'title' ? 'active-drag' : ''}`}
            style={{
              left: `${config.titlePosition.x}%`,
              top: `${config.titlePosition.y}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: `'${config.titleFont}', cursive, fantasy, serif`,
              fontSize: `${config.titleFontSize}px`,
              color: config.titleFontColor,
            }}
            onMouseDown={(e) => handleMouseDown('title', e)}
          >
            {titleText}
          </div>
        )}

        {/* Draggable page number */}
        {displayNumber !== null && (
          <div
            className={`draggable-element draggable-page-number ${dragging === 'pageNumber' ? 'active-drag' : ''}`}
            style={{
              left: `${config.pageNumberPosition.x}%`,
              top: `${config.pageNumberPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: `'${config.font}', cursive, fantasy, serif`,
              fontSize: `${config.fontSize}px`,
              color: config.fontColor,
            }}
            onMouseDown={(e) => handleMouseDown('pageNumber', e)}
          >
            {displayNumber}
          </div>
        )}

        {config.isCover && (
          <div className="cover-badge">COVER</div>
        )}
      </div>

      {/* Page navigation */}
      <div className="preview-footer">
        <button
          className="btn btn-nav"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          &larr; Prev
        </button>
        <span className="page-indicator">
          {currentPage + 1} / {photos.length}
        </span>
        <button
          className="btn btn-nav"
          disabled={currentPage === photos.length - 1}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
