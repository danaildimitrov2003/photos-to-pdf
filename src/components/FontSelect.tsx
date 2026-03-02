import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BUILT_IN_FONTS } from '../types';

interface FontSelectProps {
  value: string;
  onChange: (font: string) => void;
}

export function FontSelect({ value, onChange }: FontSelectProps) {
  const customFonts = useStore((s) => s.customFonts);
  const addCustomFont = useStore((s) => s.addCustomFont);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const allFonts = [...BUILT_IN_FONTS, ...customFonts.map((f) => f.name)];

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleFontUpload = async (file: File) => {
    const name = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');

    if (allFonts.includes(name)) {
      alert(`Font "${name}" already exists.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const fontFace = new FontFace(name, `url(${dataUrl})`);
        await fontFace.load();
        document.fonts.add(fontFace);
        addCustomFont({ name, dataUrl, fontFace });
        onChange(name);
      } catch (err) {
        console.error('Failed to load font:', err);
        alert(`Failed to load font "${name}". Make sure it's a valid TTF/OTF/WOFF file.`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="font-select-wrapper" ref={dropdownRef}>
      <button
        className="font-select-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span
          className="font-select-preview"
          style={{ fontFamily: `'${value}', cursive, fantasy, serif` }}
        >
          {value}
        </span>
        <span className="font-select-arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="font-select-dropdown">
          {allFonts.map((f) => (
            <div
              key={f}
              className={`font-select-option ${f === value ? 'active' : ''}`}
              onClick={() => { onChange(f); setOpen(false); }}
              style={{ fontFamily: `'${f}', cursive, fantasy, serif` }}
            >
              {f}
            </div>
          ))}
          <div className="font-select-divider" />
          <div
            className="font-select-option font-select-import"
            onClick={() => { fileRef.current?.click(); setOpen(false); }}
          >
            Import Font...
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFontUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
