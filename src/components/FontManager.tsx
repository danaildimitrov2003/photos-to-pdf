import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { BUILT_IN_FONTS } from '../types';

export function FontManager() {
  const customFonts = useStore((s) => s.customFonts);
  const addCustomFont = useStore((s) => s.addCustomFont);
  const removeCustomFont = useStore((s) => s.removeCustomFont);
  const fileRef = useRef<HTMLInputElement>(null);

  const allFonts = [...BUILT_IN_FONTS, ...customFonts.map((f) => f.name)];

  const handleFontUpload = async (file: File) => {
    const name = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');

    // Check duplicate
    if (allFonts.includes(name)) {
      alert(`Font "${name}" already exists.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;

      // Register font with browser using FontFace API
      try {
        const fontFace = new FontFace(name, `url(${dataUrl})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        addCustomFont({ name, dataUrl, fontFace });
      } catch (err) {
        console.error('Failed to load font:', err);
        alert(`Failed to load font "${name}". Make sure it's a valid TTF/OTF/WOFF file.`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="section">
      <span className="section-label">Custom Fonts</span>
      <button
        className="btn btn-sm"
        onClick={() => fileRef.current?.click()}
      >
        Import Font (TTF/OTF/WOFF)
      </button>
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
      {customFonts.length > 0 && (
        <div className="custom-font-list">
          {customFonts.map((f) => (
            <div key={f.name} className="custom-font-item">
              <span style={{ fontFamily: `'${f.name}'`, fontSize: '0.9rem' }}>
                {f.name}
              </span>
              <button
                className="btn-icon"
                onClick={() => removeCustomFont(f.name)}
                title="Remove font"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
