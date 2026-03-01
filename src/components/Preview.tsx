import { useMemo } from 'react';
import { useStore, resolvePageConfig } from '../store/useStore';

export function Preview() {
  const photos = useStore((s) => s.photos);
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const globalConfig = useStore((s) => s.globalConfig);
  const pageOverrides = useStore((s) => s.pageOverrides);
  const numberingStartPage = useStore((s) => s.numberingStartPage);

  const config = resolvePageConfig(globalConfig, pageOverrides, currentPage);

  // Calculate the display number for the current page
  const displayNumber = useMemo(() => {
    if (photos.length === 0) return null;
    if (config.isCover || !config.showPageNumber) return null;
    if (currentPage < numberingStartPage) return null;

    // Count non-cover pages from numberingStartPage to currentPage
    let num = 0;
    for (let i = numberingStartPage; i <= currentPage; i++) {
      const cfg = resolvePageConfig(globalConfig, pageOverrides, i);
      if (!cfg.isCover) num++;
    }
    return num;
  }, [photos.length, currentPage, numberingStartPage, globalConfig, pageOverrides, config.isCover, config.showPageNumber]);

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

  const photo = photos[currentPage];

  return (
    <div className="preview-container">
      <div
        className="preview-page"
        style={{ backgroundColor: config.bgColor }}
      >
        <div
          className="photo-container"
          style={{
            width: `${config.photoScale * 100}%`,
            height: `${config.photoScale * 93}%`,
          }}
        >
          <img src={photo.dataUrl} alt={photo.name} />
        </div>
        {displayNumber !== null && (
          <div
            className="page-number"
            style={{
              fontFamily: `'${config.font}', cursive, fantasy, serif`,
              fontSize: `${config.fontSize}px`,
              color: config.fontColor,
            }}
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
