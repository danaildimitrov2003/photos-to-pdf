import { useStore } from '../store/useStore';
import { BG_COLOR_PRESETS, FONT_COLOR_PRESETS, PAGE_SIZES } from '../types';
import { ColorPicker } from './ColorPicker';
import { StepperInput } from './StepperInput';
import { FontSelect } from './FontSelect';

export function GlobalSettings() {
  const globalConfig = useStore((s) => s.globalConfig);
  const setGlobalConfig = useStore((s) => s.setGlobalConfig);
  const numberingStartPage = useStore((s) => s.numberingStartPage);
  const setNumberingStartPage = useStore((s) => s.setNumberingStartPage);
  const photos = useStore((s) => s.photos);
  const pageSize = useStore((s) => s.pageSize);
  const setPageSize = useStore((s) => s.setPageSize);
  const customPageSize = useStore((s) => s.customPageSize);
  const setCustomPageSize = useStore((s) => s.setCustomPageSize);

  const isCustomSize = !PAGE_SIZES.find(
    (s) => s.widthMm === pageSize.widthMm && s.heightMm === pageSize.heightMm
  );

  // Slider drives both W and H proportionally, preserving their ratio
  const sliderValue = Math.round(Math.max(globalConfig.imageWidthPct, globalConfig.imageHeightPct));

  return (
    <div className="global-settings">
      <span className="section-label section-label-group">Global Defaults</span>

      {/* Page size */}
      <div className="section">
        <span className="section-label">Page Size</span>
        <select
          value={isCustomSize ? '__custom__' : pageSize.name}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__custom__') {
              setPageSize({
                name: 'Custom',
                widthMm: customPageSize.widthMm,
                heightMm: customPageSize.heightMm,
              });
            } else {
              const found = PAGE_SIZES.find((s) => s.name === val);
              if (found) setPageSize(found);
            }
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.widthMm} x {s.heightMm} mm)
            </option>
          ))}
          <option value="__custom__">Custom...</option>
        </select>
        {(isCustomSize || pageSize.name === 'Custom') && (
          <div className="custom-size-row">
            <div className="size-input-group">
              <label className="size-label">W</label>
              <input
                type="number"
                value={pageSize.widthMm}
                min={50}
                max={1000}
                onChange={(e) => {
                  const w = parseInt(e.target.value) || 210;
                  setCustomPageSize({ ...customPageSize, widthMm: w });
                  setPageSize({ name: 'Custom', widthMm: w, heightMm: pageSize.heightMm });
                }}
              />
              <span className="unit">mm</span>
            </div>
            <span className="size-separator">x</span>
            <div className="size-input-group">
              <label className="size-label">H</label>
              <input
                type="number"
                value={pageSize.heightMm}
                min={50}
                max={1000}
                onChange={(e) => {
                  const h = parseInt(e.target.value) || 297;
                  setCustomPageSize({ ...customPageSize, heightMm: h });
                  setPageSize({ name: 'Custom', widthMm: pageSize.widthMm, heightMm: h });
                }}
              />
              <span className="unit">mm</span>
            </div>
          </div>
        )}
      </div>

      {/* Numbering start */}
      <div className="section">
        <span className="section-label">Start Numbering From Page</span>
        <StepperInput
          value={numberingStartPage + 1}
          min={1}
          max={Math.max(photos.length, 1)}
          onChange={(v) => setNumberingStartPage(v - 1)}
        />
        <span className="unit" style={{ marginTop: -2 }}>
          {numberingStartPage === 0
            ? '(all pages numbered)'
            : `(pages 1-${numberingStartPage} have no number)`}
        </span>
      </div>

      {/* Image size — unified slider + W/H fields */}
      <div className="section">
        <span className="section-label">Image Size</span>
        <input
          type="range"
          min="10"
          max="100"
          value={sliderValue}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            const curMax = Math.max(globalConfig.imageWidthPct, globalConfig.imageHeightPct);
            if (curMax <= 0) {
              setGlobalConfig({ imageWidthPct: v, imageHeightPct: v, photoScale: v / 100 });
              return;
            }
            const scale = v / curMax;
            setGlobalConfig({
              imageWidthPct: Math.round(Math.max(10, Math.min(100, globalConfig.imageWidthPct * scale))),
              imageHeightPct: Math.round(Math.max(10, Math.min(100, globalConfig.imageHeightPct * scale))),
              photoScale: v / 100,
            });
          }}
          className="slider"
        />
        <div className="image-size-fields">
          <StepperInput
            label="W"
            value={Math.round(globalConfig.imageWidthPct)}
            min={10}
            max={100}
            unit="%"
            onChange={(v) => setGlobalConfig({ imageWidthPct: v, photoScale: v / 100 })}
          />
          <StepperInput
            label="H"
            value={Math.round(globalConfig.imageHeightPct)}
            min={10}
            max={100}
            unit="%"
            onChange={(v) => setGlobalConfig({ imageHeightPct: v })}
          />
        </div>
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
        <span className="section-label">Number Font</span>
        <FontSelect
          value={globalConfig.font}
          onChange={(f) => setGlobalConfig({ font: f })}
        />
        <div
          className="font-preview-text"
          style={{ fontFamily: `'${globalConfig.font}', cursive, fantasy, serif` }}
        >
          1 2 3 4 5
        </div>
      </div>

      {/* Font size */}
      <div className="section">
        <span className="section-label">Number Font Size</span>
        <StepperInput
          value={globalConfig.fontSize}
          min={6}
          max={72}
          unit="pt"
          onChange={(v) => setGlobalConfig({ fontSize: v })}
        />
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

      {/* Title defaults */}
      <span className="section-label section-label-group" style={{ marginTop: 8 }}>Title Defaults</span>

      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={globalConfig.showTitle}
            onChange={(e) =>
              setGlobalConfig({ showTitle: e.target.checked })
            }
          />
          <span>Show image title</span>
        </label>
      </div>

      {globalConfig.showTitle && (
        <>
          <div className="section">
            <span className="section-label">Title Font</span>
            <FontSelect
              value={globalConfig.titleFont}
              onChange={(f) => setGlobalConfig({ titleFont: f })}
            />
          </div>

          <div className="section">
            <span className="section-label">Title Font Size</span>
            <StepperInput
              value={globalConfig.titleFontSize}
              min={6}
              max={72}
              unit="pt"
              onChange={(v) => setGlobalConfig({ titleFontSize: v })}
            />
          </div>

          <ColorPicker
            label="Title Color"
            value={globalConfig.titleFontColor}
            presets={FONT_COLOR_PRESETS}
            onChange={(c) => setGlobalConfig({ titleFontColor: c })}
          />
        </>
      )}
    </div>
  );
}
