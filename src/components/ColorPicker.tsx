import { useRef, useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { BG_COLOR_PRESETS, FONT_COLOR_PRESETS } from '../types';

interface ColorPickerProps {
  label: string;
  value: string;
  presets: typeof BG_COLOR_PRESETS | typeof FONT_COLOR_PRESETS;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, presets, onChange }: ColorPickerProps) {
  const isValidHex = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
      setPopoverOpen(false);
    }
  }, []);

  useEffect(() => {
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popoverOpen, handleClickOutside]);

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
          <div className="hex-preview-wrapper" ref={popoverRef}>
            <div
              className="hex-preview"
              style={{ background: value }}
              onClick={() => setPopoverOpen((o) => !o)}
              title="Click to open color picker"
            />
            {popoverOpen && (
              <div className="color-popover">
                <HexColorPicker
                  color={value}
                  onChange={(c) => onChange(c.toUpperCase())}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
