import { useStore } from '../store/useStore';
import { BUILT_IN_FONTS, BG_COLOR_PRESETS, FONT_COLOR_PRESETS } from '../types';
import { ColorPicker } from './ColorPicker';

export function GlobalSettings() {
  const globalConfig = useStore((s) => s.globalConfig);
  const setGlobalConfig = useStore((s) => s.setGlobalConfig);
  const numberingStartPage = useStore((s) => s.numberingStartPage);
  const setNumberingStartPage = useStore((s) => s.setNumberingStartPage);
  const photos = useStore((s) => s.photos);
  const customFonts = useStore((s) => s.customFonts);

  const allFonts = [...BUILT_IN_FONTS, ...customFonts.map((f) => f.name)];

  return (
    <div className="global-settings">
      <span className="section-label section-label-group">Global Defaults</span>

      {/* Numbering start */}
      <div className="section">
        <span className="section-label">Start Numbering From Page</span>
        <div className="font-size-row">
          <input
            type="number"
            value={numberingStartPage + 1}
            min={1}
            max={Math.max(photos.length, 1)}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v >= 1) {
                setNumberingStartPage(v - 1);
              }
            }}
          />
          <span className="unit">
            {numberingStartPage === 0
              ? '(all pages numbered)'
              : `(pages 1-${numberingStartPage} have no number)`}
          </span>
        </div>
      </div>

      {/* Photo size slider */}
      <div className="section">
        <span className="section-label">
          Photo Size: {Math.round(globalConfig.photoScale * 100)}%
        </span>
        <input
          type="range"
          min="30"
          max="100"
          value={Math.round(globalConfig.photoScale * 100)}
          onChange={(e) =>
            setGlobalConfig({ photoScale: parseInt(e.target.value) / 100 })
          }
          className="slider"
        />
      </div>

      {/* Show page number */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={globalConfig.showPageNumber}
            onChange={(e) =>
              setGlobalConfig({ showPageNumber: e.target.checked })
            }
          />
          <span>Show page numbers</span>
        </label>
      </div>

      {/* Font */}
      <div className="section">
        <span className="section-label">Font</span>
        <select
          value={globalConfig.font}
          onChange={(e) => setGlobalConfig({ font: e.target.value })}
        >
          {allFonts.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <div
          className="font-preview-text"
          style={{ fontFamily: `'${globalConfig.font}', cursive, fantasy, serif` }}
        >
          1 2 3 4 5
        </div>
      </div>

      {/* Font size */}
      <div className="section">
        <span className="section-label">Font Size</span>
        <div className="font-size-row">
          <input
            type="number"
            value={globalConfig.fontSize}
            min={6}
            max={72}
            onChange={(e) =>
              setGlobalConfig({ fontSize: parseInt(e.target.value) || 14 })
            }
          />
          <span className="unit">pt</span>
        </div>
      </div>

      {/* Background color */}
      <ColorPicker
        label="Background"
        value={globalConfig.bgColor}
        presets={BG_COLOR_PRESETS}
        onChange={(c) => setGlobalConfig({ bgColor: c })}
      />

      {/* Font color */}
      <ColorPicker
        label="Number Color"
        value={globalConfig.fontColor}
        presets={FONT_COLOR_PRESETS}
        onChange={(c) => setGlobalConfig({ fontColor: c })}
      />
    </div>
  );
}
