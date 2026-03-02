import { useRef } from 'react';
import { useStore, resolvePageConfig } from '../store/useStore';
import { BG_COLOR_PRESETS, FONT_COLOR_PRESETS } from '../types';
import { ColorPicker } from './ColorPicker';
import { StepperInput } from './StepperInput';
import { FontSelect } from './FontSelect';
import { computeEffectiveImageDims } from '../utils/imageFit';

export function PageSettings() {
  const currentPage = useStore((s) => s.currentPage);
  const photos = useStore((s) => s.photos);
  const globalConfig = useStore((s) => s.globalConfig);
  const pageOverrides = useStore((s) => s.pageOverrides);
  const setPageOverride = useStore((s) => s.setPageOverride);
  const clearPageOverride = useStore((s) => s.clearPageOverride);
  const clearAllPageOverrides = useStore((s) => s.clearAllPageOverrides);
  const pageSize = useStore((s) => s.pageSize);
  const insertEmptyPage = useStore((s) => s.insertEmptyPage);
  const setPagePhoto = useStore((s) => s.setPagePhoto);
  const clearPagePhoto = useStore((s) => s.clearPagePhoto);
  const deletePage = useStore((s) => s.deletePage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (photos.length === 0) return null;

  const config = resolvePageConfig(globalConfig, pageOverrides, currentPage);
  const overrides = pageOverrides[currentPage] || {};
  const hasOverrides = Object.keys(overrides).length > 0;
  const photo = photos[currentPage];
  const isEmptyPage = photo?.isEmpty === true;

  // Compute effective image dimensions (aspect-ratio-aware when no override)
  const effectiveDims = computeEffectiveImageDims(
    photo, config, pageOverrides, currentPage,
    pageSize.widthMm, pageSize.heightMm,
  );

  const setOverride = (key: string, value: unknown) => {
    setPageOverride(currentPage, { [key]: value });
  };

  const renderResetBtn = (key: keyof typeof overrides) => {
    if (key in overrides) {
      return (
        <button
          className="btn-reset"
          onClick={() => clearPageOverride(currentPage, key)}
          title="Reset to global default"
        >
          Reset
        </button>
      );
    }
    return null;
  };

  // Check if image size has been overridden (either W or H)
  const hasImageSizeOverride = 'imageWidthPct' in overrides || 'imageHeightPct' in overrides;

  const resetImageSize = () => {
    if ('imageWidthPct' in overrides) clearPageOverride(currentPage, 'imageWidthPct');
    if ('imageHeightPct' in overrides) clearPageOverride(currentPage, 'imageHeightPct');
    if ('photoScale' in overrides) clearPageOverride(currentPage, 'photoScale');
  };

  // Helper to check if a position-type override exists
  const hasPositionOverride = (key: 'imagePosition' | 'pageNumberPosition' | 'titlePosition') =>
    key in overrides;

  // Slider value from the larger of effective W/H
  const sliderValue = Math.round(Math.max(effectiveDims.widthPct, effectiveDims.heightPct));

  // Handle adding a photo to an empty page
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setPagePhoto(currentPage, file, dataUrl, img.naturalWidth, img.naturalHeight);
      };
      img.onerror = () => {
        setPagePhoto(currentPage, file, dataUrl, 1, 1);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="page-settings">
      <div className="page-settings-header">
        <span className="section-label">
          Page {currentPage + 1} Settings
          {isEmptyPage && <span className="empty-page-tag">EMPTY</span>}
        </span>
        {hasOverrides && (
          <button
            className="btn-reset"
            onClick={() => clearAllPageOverrides(currentPage)}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Page management buttons */}
      <div className="page-actions">
        <button
          className="btn btn-sm"
          onClick={() => insertEmptyPage(currentPage)}
          title="Insert an empty page after this one"
        >
          + Insert Empty Page
        </button>
        {isEmptyPage && (
          <>
            <button
              className="btn btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Add a photo to this empty page"
            >
              Add Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAddPhoto}
            />
          </>
        )}
        {!isEmptyPage && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => clearPagePhoto(currentPage)}
            title="Remove the photo, turning this into an empty page"
          >
            Remove Photo
          </button>
        )}
        {(isEmptyPage || photos.length > 1) && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => deletePage(currentPage)}
            title="Remove this page"
          >
            Delete Page
          </button>
        )}
      </div>

      {/* Cover page toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config.isCover}
            onChange={(e) => setOverride('isCover', e.target.checked)}
          />
          <span>Cover page (no number)</span>
        </label>
        {renderResetBtn('isCover')}
      </div>

      {/* Show page number */}
      {!config.isCover && (
        <div className="setting-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={config.showPageNumber}
              onChange={(e) => setOverride('showPageNumber', e.target.checked)}
            />
            <span>Show page number</span>
          </label>
          {renderResetBtn('showPageNumber')}
        </div>
      )}

      {/* Image size — unified slider + W/H fields (hidden for empty pages) */}
      {!isEmptyPage && (
        <div className="section">
          <div className="setting-row">
            <span className="section-label">Image Size</span>
            {hasImageSizeOverride && (
              <button
                className="btn-reset"
                onClick={resetImageSize}
                title="Reset to global default"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={sliderValue}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              const curMax = Math.max(effectiveDims.widthPct, effectiveDims.heightPct);
              if (curMax <= 0) {
                setPageOverride(currentPage, {
                  imageWidthPct: v,
                  imageHeightPct: v,
                  photoScale: v / 100,
                });
                return;
              }
              const scale = v / curMax;
              setPageOverride(currentPage, {
                imageWidthPct: Math.round(Math.max(10, Math.min(100, effectiveDims.widthPct * scale))),
                imageHeightPct: Math.round(Math.max(10, Math.min(100, effectiveDims.heightPct * scale))),
                photoScale: v / 100,
              });
            }}
            className="slider"
          />
          <div className="image-size-fields">
            <StepperInput
              label="W"
              value={Math.round(effectiveDims.widthPct)}
              min={10}
              max={100}
              unit="%"
              onChange={(v) => setPageOverride(currentPage, { imageWidthPct: v, photoScale: v / 100 })}
            />
            <StepperInput
              label="H"
              value={Math.round(effectiveDims.heightPct)}
              min={10}
              max={100}
              unit="%"
              onChange={(v) => setPageOverride(currentPage, { imageHeightPct: v })}
            />
          </div>
        </div>
      )}

      {/* Image position (hidden for empty pages) */}
      {!isEmptyPage && hasPositionOverride('imagePosition') && (
        <div className="setting-row">
          <span className="section-label">
            Image Pos: {Math.round(config.imagePosition.x)}%, {Math.round(config.imagePosition.y)}%
          </span>
          <button
            className="btn-reset"
            onClick={() => clearPageOverride(currentPage, 'imagePosition')}
            title="Reset to global default"
          >
            Reset
          </button>
        </div>
      )}

      {/* Page number position */}
      {hasPositionOverride('pageNumberPosition') && (
        <div className="setting-row">
          <span className="section-label">
            Number Pos: {Math.round(config.pageNumberPosition.x)}%, {Math.round(config.pageNumberPosition.y)}%
          </span>
          <button
            className="btn-reset"
            onClick={() => clearPageOverride(currentPage, 'pageNumberPosition')}
            title="Reset to global default"
          >
            Reset
          </button>
        </div>
      )}

      {/* Font */}
      <div className="section">
        <div className="setting-row">
          <span className="section-label">Number Font</span>
          {renderResetBtn('font')}
        </div>
        <FontSelect
          value={config.font}
          onChange={(f) => setOverride('font', f)}
        />
        <div
          className="font-preview-text"
          style={{ fontFamily: `'${config.font}', cursive, fantasy, serif` }}
        >
          1 2 3 4 5
        </div>
      </div>

      {/* Font size */}
      <div className="section">
        <div className="setting-row">
          <span className="section-label">Number Font Size</span>
          {renderResetBtn('fontSize')}
        </div>
        <StepperInput
          value={config.fontSize}
          min={6}
          max={72}
          unit="pt"
          onChange={(v) => setOverride('fontSize', v)}
        />
      </div>

      {/* Background color */}
      <ColorPicker
        label="Background"
        value={config.bgColor}
        presets={BG_COLOR_PRESETS}
        onChange={(c) => setOverride('bgColor', c)}
      />

      {/* Font color */}
      {config.showPageNumber && !config.isCover && (
        <ColorPicker
          label="Number Color"
          value={config.fontColor}
          presets={FONT_COLOR_PRESETS}
          onChange={(c) => setOverride('fontColor', c)}
        />
      )}

      {/* Title settings */}
      <span className="section-label section-label-group" style={{ marginTop: 8 }}>Title</span>

      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config.showTitle}
            onChange={(e) => setOverride('showTitle', e.target.checked)}
          />
          <span>Show title</span>
        </label>
        {renderResetBtn('showTitle')}
      </div>

      {config.showTitle && (
        <>
          <div className="section">
            <div className="setting-row">
              <span className="section-label">Title Text</span>
              {renderResetBtn('titleText')}
            </div>
            <textarea
              value={config.titleText || ''}
              placeholder={isEmptyPage ? 'Enter title...' : (photos[currentPage]?.name?.replace(/\.[^.]+$/, '') || 'Enter title...')}
              onChange={(e) => setOverride('titleText', e.target.value)}
              rows={2}
            />
          </div>

          <div className="section">
            <div className="setting-row">
              <span className="section-label">Title Font</span>
              {renderResetBtn('titleFont')}
            </div>
            <FontSelect
              value={config.titleFont}
              onChange={(f) => setOverride('titleFont', f)}
            />
          </div>

          <div className="section">
            <div className="setting-row">
              <span className="section-label">Title Font Size</span>
              {renderResetBtn('titleFontSize')}
            </div>
            <StepperInput
              value={config.titleFontSize}
              min={6}
              max={72}
              unit="pt"
              onChange={(v) => setOverride('titleFontSize', v)}
            />
          </div>

          <ColorPicker
            label="Title Color"
            value={config.titleFontColor}
            presets={FONT_COLOR_PRESETS}
            onChange={(c) => setOverride('titleFontColor', c)}
          />

          {/* Title bounding box size */}
          <div className="section">
            <div className="setting-row">
              <span className="section-label">Title Box Size</span>
              {('titleWidthPct' in overrides || 'titleHeightPct' in overrides) && (
                <button
                  className="btn-reset"
                  onClick={() => {
                    if ('titleWidthPct' in overrides) clearPageOverride(currentPage, 'titleWidthPct');
                    if ('titleHeightPct' in overrides) clearPageOverride(currentPage, 'titleHeightPct');
                  }}
                  title="Reset to global default"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="image-size-fields">
              <StepperInput
                label="W"
                value={Math.round(config.titleWidthPct)}
                min={10}
                max={100}
                unit="%"
                onChange={(v) => setOverride('titleWidthPct', v)}
              />
              <StepperInput
                label="H"
                value={Math.round(config.titleHeightPct)}
                min={5}
                max={100}
                unit="%"
                onChange={(v) => setOverride('titleHeightPct', v)}
              />
            </div>
          </div>

          {/* Title text alignment */}
          <div className="section">
            <div className="setting-row">
              <span className="section-label">Title Alignment</span>
              {renderResetBtn('titleTextAlign')}
            </div>
            <div className="text-align-group">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  className={`text-align-btn ${config.titleTextAlign === a ? 'active' : ''}`}
                  onClick={() => setOverride('titleTextAlign', a)}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Title position */}
          {hasPositionOverride('titlePosition') && (
            <div className="setting-row">
              <span className="section-label">
                Title Pos: {Math.round(config.titlePosition.x)}%, {Math.round(config.titlePosition.y)}%
              </span>
              <button
                className="btn-reset"
                onClick={() => clearPageOverride(currentPage, 'titlePosition')}
                title="Reset to global default"
              >
                Reset
              </button>
            </div>
          )}
        </>
      )}

      {/* Drag hint */}
      <div className="drag-hint">
        Drag elements in the preview to reposition. Drag image corners to resize (keeps aspect ratio) or edges to stretch freely. Title has a resizable bounding box — drag its edges/corners to resize the text area.
      </div>
    </div>
  );
}
