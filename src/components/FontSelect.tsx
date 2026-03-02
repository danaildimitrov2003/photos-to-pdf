import { useRef } from 'react';
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

  const allFonts = [...BUILT_IN_FONTS, ...customFonts.map((f) => f.name)];

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__import__') {
      fileRef.current?.click();
      // Reset select back to current value
      e.target.value = value;
    } else {
      onChange(val);
    }
  };

  return (
    <>
      <select value={value} onChange={handleChange}>
        {allFonts.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
        <option disabled>───────────</option>
        <option value="__import__">Import Font...</option>
      </select>
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
    </>
  );
}
