export type SortMode = 'name' | 'date-newest' | 'date-oldest' | 'random' | 'size-smallest' | 'size-largest' | 'reverse-name' | 'type';

// Normalized position: x/y are percentages (0-100) of page dimensions
export interface Position {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
}

export interface PageSize {
  name: string;
  widthMm: number;
  heightMm: number;
}

export const PAGE_SIZES: PageSize[] = [
  { name: 'A4', widthMm: 210, heightMm: 297 },
  { name: 'Letter', widthMm: 215.9, heightMm: 279.4 },
  { name: 'A3', widthMm: 297, heightMm: 420 },
  { name: 'A5', widthMm: 148, heightMm: 210 },
  { name: 'Square (200mm)', widthMm: 200, heightMm: 200 },
  { name: '4x6 Photo', widthMm: 101.6, heightMm: 152.4 },
  { name: '5x7 Photo', widthMm: 127, heightMm: 177.8 },
];

export interface PageConfig {
  photoScale: number;       // 0.3 to 1.0 (percentage of page) - used as default
  showPageNumber: boolean;
  font: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  isCover: boolean;         // if true, no page number, doesn't count in numbering
  // Position offsets (percentages of page, centered by default)
  imagePosition: Position;   // center of the image
  pageNumberPosition: Position; // center of the page number
  // Per-page image dimensions (percentage of page, independent W/H)
  imageWidthPct: number;    // 10-100, percentage of page width
  imageHeightPct: number;   // 10-100, percentage of page height
  // Title
  showTitle: boolean;
  titleText: string;
  titleFont: string;
  titleFontSize: number;
  titleFontColor: string;
  titlePosition: Position;        // top-left corner of the bounding box (%)
  titleWidthPct: number;          // bounding box width as % of page (10-100)
  titleHeightPct: number;         // bounding box height as % of page (5-100)
  titleTextAlign: 'left' | 'center' | 'right';
}

export interface PhotoEntry {
  file: File | null;          // null for empty pages
  name: string;
  num: number;
  dataUrl: string;            // empty string for empty pages
  lastModified: number;       // file.lastModified timestamp
  fileSize: number;           // file.size in bytes
  naturalWidth: number;       // image natural width in pixels (0 for empty pages)
  naturalHeight: number;      // image natural height in pixels (0 for empty pages)
  isEmpty?: boolean;          // true for manually inserted empty pages
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
  fontSize: 30,
  fontColor: '#000000',
  bgColor: '#FFFFFF',
  isCover: false,
  imagePosition: { x: 50, y: 47 },       // centered, slightly above middle
  pageNumberPosition: { x: 50, y: 95 },   // centered at bottom
  imageWidthPct: 75,
  imageHeightPct: 70,
  showTitle: false,
  titleText: '',
  titleFont: 'Chopin Script',
  titleFontSize: 30,
  titleFontColor: '#000000',
  titlePosition: { x: 10, y: 4 },          // top-left anchor of bounding box
  titleWidthPct: 80,
  titleHeightPct: 12,
  titleTextAlign: 'center',
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
