import { useStore } from '../store/useStore';

export function FontManager() {
  const customFonts = useStore((s) => s.customFonts);
  const removeCustomFont = useStore((s) => s.removeCustomFont);

  if (customFonts.length === 0) return null;

  return (
    <div className="section">
      <span className="section-label">Custom Fonts</span>
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
    </div>
  );
}
