import { useRef } from 'react';
import { BG_COLOR_PRESETS, FONT_COLOR_PRESETS } from '../types';

interface ColorPickerProps {
  label: string;
  value: string;
  presets: typeof BG_COLOR_PRESETS | typeof FONT_COLOR_PRESETS;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, presets, onChange }: ColorPickerProps) {
  const isValidHex = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="section">
      <span className="section-label">{label}</span>
      <div className="color-options">
        <div className="color-swatches">
          {presets.map((p) => (
            <div
              key={p.color}
              className={`color-swatch ${value.toUpperCase() === p.color.toUpperCase() ? 'active' : ''}`}
              style={{
                background: p.color,
                border:
                  p.color === '#000000' ||
                  p.color === '#333333' ||
                  p.color === '#2C2C2C' ||
                  p.color === '#1a1a2e'
                    ? '1px solid #444'
                    : undefined,
              }}
              title={p.name}
              onClick={() => onChange(p.color)}
            />
          ))}
        </div>
        <div className="hex-input-row">
          <input
            type="text"
            placeholder="#FFFFFF"
            value={value}
            maxLength={7}
            onChange={(e) => {
              const v = e.target.value;
              if (isValidHex(v)) onChange(v);
              // Always update the input visually
              e.target.value = v;
            }}
            onBlur={(e) => {
              if (!isValidHex(e.target.value)) {
                e.target.value = value;
              }
            }}
          />
          <div
            className="hex-preview-wrapper"
            onClick={() => nativePickerRef.current?.click()}
            title="Click to open color picker"
          >
            <div
              className="hex-preview"
              style={{ background: value }}
            />
            <input
              ref={nativePickerRef}
              type="color"
              className="native-color-input"
              value={value}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
