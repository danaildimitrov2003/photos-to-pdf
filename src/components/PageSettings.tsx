import { useStore, resolvePageConfig } from '../store/useStore';
import { BUILT_IN_FONTS, BG_COLOR_PRESETS, FONT_COLOR_PRESETS } from '../types';
import { ColorPicker } from './ColorPicker';

export function PageSettings() {
  const currentPage = useStore((s) => s.currentPage);
  const photos = useStore((s) => s.photos);
  const globalConfig = useStore((s) => s.globalConfig);
  const pageOverrides = useStore((s) => s.pageOverrides);
  const setPageOverride = useStore((s) => s.setPageOverride);
  const clearPageOverride = useStore((s) => s.clearPageOverride);
  const clearAllPageOverrides = useStore((s) => s.clearAllPageOverrides);
  const customFonts = useStore((s) => s.customFonts);

  if (photos.length === 0) return null;

  const config = resolvePageConfig(globalConfig, pageOverrides, currentPage);
  const overrides = pageOverrides[currentPage] || {};
  const hasOverrides = Object.keys(overrides).length > 0;
  const allFonts = [...BUILT_IN_FONTS, ...customFonts.map((f) => f.name)];

  const setOverride = (key: string, value: unknown) => {
    setPageOverride(currentPage, { [key]: value });
  };

  const renderOverrideToggle = (key: keyof typeof overrides) => {
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

  return (
    <div className="page-settings">
      <div className="page-settings-header">
        <span className="section-label">
          Page {currentPage + 1} Settings
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
        {renderOverrideToggle('isCover')}
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
          {renderOverrideToggle('showPageNumber')}
        </div>
      )}

      {/* Photo size slider */}
      <div className="section">
        <div className="setting-row">
          <span className="section-label">Photo Size: {Math.round(config.photoScale * 100)}%</span>
          {renderOverrideToggle('photoScale')}
        </div>
        <input
          type="range"
          min="30"
          max="100"
          value={Math.round(config.photoScale * 100)}
          onChange={(e) => setOverride('photoScale', parseInt(e.target.value) / 100)}
          className="slider"
        />
      </div>

      {/* Font */}
      <div className="section">
        <div className="setting-row">
          <span className="section-label">Font</span>
          {renderOverrideToggle('font')}
        </div>
        <select
          value={config.font}
          onChange={(e) => setOverride('font', e.target.value)}
        >
          {allFonts.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
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
          <span className="section-label">Font Size</span>
          {renderOverrideToggle('fontSize')}
        </div>
        <div className="font-size-row">
          <input
            type="number"
            value={config.fontSize}
            min={6}
            max={72}
            onChange={(e) => setOverride('fontSize', parseInt(e.target.value) || 14)}
          />
          <span className="unit">pt</span>
        </div>
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
    </div>
  );
}
