export interface PageConfig {
  photoScale: number;       // 0.3 to 1.0 (percentage of page)
  showPageNumber: boolean;
  font: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  isCover: boolean;         // if true, no page number, doesn't count in numbering
}

export interface PhotoEntry {
  file: File;
  name: string;
  num: number;
  dataUrl: string;
}

export interface CustomFont {
  name: string;
  dataUrl: string;          // base64 data URL of the font file
  fontFace?: FontFace;      // browser FontFace object for rendering
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  photoScale: 0.75,
  showPageNumber: true,
  font: 'Chopin Script',
  fontSize: 14,
  fontColor: '#000000',
  bgColor: '#FFFFFF',
  isCover: false,
};

export const BUILT_IN_FONTS = [
  'Chopin Script',
  'Papyrus',
  'Dancing Script',
  'Great Vibes',
  'Playfair Display',
  'Cinzel',
  'Cormorant Garamond',
  'Satisfy',
  'Pacifico',
  'Lobster',
];

export const BG_COLOR_PRESETS = [
  { color: '#FFFFFF', name: 'White' },
  { color: '#F5F5DC', name: 'Beige' },
  { color: '#FFFDD0', name: 'Cream' },
  { color: '#FFF8E7', name: 'Ivory' },
  { color: '#F0F0F0', name: 'Light Gray' },
  { color: '#D3D3D3', name: 'Gray' },
  { color: '#2C2C2C', name: 'Dark Gray' },
  { color: '#000000', name: 'Black' },
  { color: '#1a1a2e', name: 'Navy' },
  { color: '#FFF0F5', name: 'Lavender Blush' },
  { color: '#F0FFF0', name: 'Honeydew' },
  { color: '#F5F0EB', name: 'Warm White' },
];

export const FONT_COLOR_PRESETS = [
  { color: '#000000', name: 'Black' },
  { color: '#333333', name: 'Dark Gray' },
  { color: '#666666', name: 'Gray' },
  { color: '#999999', name: 'Light Gray' },
  { color: '#FFFFFF', name: 'White' },
  { color: '#8B4513', name: 'Brown' },
  { color: '#800020', name: 'Burgundy' },
  { color: '#C0A060', name: 'Gold' },
  { color: '#2563EB', name: 'Blue' },
];
