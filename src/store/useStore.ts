import { create } from 'zustand';
import type {
  PageConfig,
  PhotoEntry,
  CustomFont,
  SortMode,
  PageSize,
} from '../types';
import { DEFAULT_PAGE_CONFIG, PAGE_SIZES } from '../types';

export function sortPhotos(photos: PhotoEntry[], mode: SortMode): PhotoEntry[] {
  const arr = [...photos];
  switch (mode) {
    case 'name':
      return arr.sort((a, b) => {
        const numA = a.name.match(/(\d+)/);
        const numB = b.name.match(/(\d+)/);
        const nA = numA ? parseInt(numA[1], 10) : 999999;
        const nB = numB ? parseInt(numB[1], 10) : 999999;
        return nA - nB;
      });
    case 'reverse-name':
      return arr.sort((a, b) => {
        const numA = a.name.match(/(\d+)/);
        const numB = b.name.match(/(\d+)/);
        const nA = numA ? parseInt(numA[1], 10) : 999999;
        const nB = numB ? parseInt(numB[1], 10) : 999999;
        return nB - nA;
      });
    case 'date':
      return arr.sort((a, b) => a.lastModified - b.lastModified);
    case 'size':
      return arr.sort((a, b) => a.fileSize - b.fileSize);
    case 'random':
      // Fisher-Yates shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    case 'type':
      return arr.sort((a, b) => {
        const extA = a.name.split('.').pop()?.toLowerCase() || '';
        const extB = b.name.split('.').pop()?.toLowerCase() || '';
        if (extA !== extB) return extA.localeCompare(extB);
        return a.name.localeCompare(b.name);
      });
    default:
      return arr;
  }
}

interface AppState {
  // Photos
  photos: PhotoEntry[];
  setPhotos: (photos: PhotoEntry[]) => void;

  // Sort mode
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;

  // Page size
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
  customPageSize: { widthMm: number; heightMm: number };
  setCustomPageSize: (size: { widthMm: number; heightMm: number }) => void;

  // Current page being viewed/edited
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Global defaults (applied to all pages unless overridden)
  globalConfig: PageConfig;
  setGlobalConfig: (config: Partial<PageConfig>) => void;

  // Per-page overrides (only stores the fields that differ from global)
  pageOverrides: Record<number, Partial<PageConfig>>;
  setPageOverride: (pageIndex: number, overrides: Partial<PageConfig>) => void;
  clearPageOverride: (pageIndex: number, key: keyof PageConfig) => void;
  clearAllPageOverrides: (pageIndex: number) => void;

  // Page numbering: which page number to start counting from
  numberingStartPage: number; // 0-indexed: page numbers start displaying from this page
  setNumberingStartPage: (page: number) => void;

  // Custom fonts
  customFonts: CustomFont[];
  addCustomFont: (font: CustomFont) => void;
  removeCustomFont: (name: string) => void;

  // PDF generation
  isGenerating: boolean;
  generationProgress: number;
  setIsGenerating: (v: boolean) => void;
  setGenerationProgress: (v: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  photos: [],
  setPhotos: (photos) => {
    const mode = get().sortMode;
    set({ photos: sortPhotos(photos, mode), currentPage: 0 });
  },

  sortMode: 'name',
  setSortMode: (mode) => {
    const photos = get().photos;
    if (photos.length > 0) {
      set({ sortMode: mode, photos: sortPhotos(photos, mode), currentPage: 0 });
    } else {
      set({ sortMode: mode });
    }
  },

  pageSize: PAGE_SIZES[0], // A4 default
  setPageSize: (size) => set({ pageSize: size }),
  customPageSize: { widthMm: 210, heightMm: 297 },
  setCustomPageSize: (size) => set({ customPageSize: size }),

  currentPage: 0,
  setCurrentPage: (page) => set({ currentPage: page }),

  globalConfig: { ...DEFAULT_PAGE_CONFIG },
  setGlobalConfig: (config) =>
    set((s) => ({
      globalConfig: { ...s.globalConfig, ...config },
    })),

  pageOverrides: {},
  setPageOverride: (pageIndex, overrides) =>
    set((s) => ({
      pageOverrides: {
        ...s.pageOverrides,
        [pageIndex]: { ...s.pageOverrides[pageIndex], ...overrides },
      },
    })),
  clearPageOverride: (pageIndex, key) =>
    set((s) => {
      const current = { ...s.pageOverrides[pageIndex] };
      delete current[key];
      const newOverrides = { ...s.pageOverrides };
      if (Object.keys(current).length === 0) {
        delete newOverrides[pageIndex];
      } else {
        newOverrides[pageIndex] = current;
      }
      return { pageOverrides: newOverrides };
    }),
  clearAllPageOverrides: (pageIndex) =>
    set((s) => {
      const newOverrides = { ...s.pageOverrides };
      delete newOverrides[pageIndex];
      return { pageOverrides: newOverrides };
    }),

  numberingStartPage: 1,
  setNumberingStartPage: (page) => set({ numberingStartPage: page }),

  customFonts: [],
  addCustomFont: (font) =>
    set((s) => ({ customFonts: [...s.customFonts, font] })),
  removeCustomFont: (name) =>
    set((s) => ({
      customFonts: s.customFonts.filter((f) => f.name !== name),
    })),

  isGenerating: false,
  generationProgress: 0,
  setIsGenerating: (v) => set({ isGenerating: v }),
  setGenerationProgress: (v) => set({ generationProgress: v }),
}));

/**
 * Resolve the effective config for a page by merging global defaults with
 * per-page overrides. This is a pure function — call it with reactive
 * values from useStore selectors so React re-renders properly.
 */
export function resolvePageConfig(
  globalConfig: PageConfig,
  pageOverrides: Record<number, Partial<PageConfig>>,
  pageIndex: number
): PageConfig {
  const overrides = pageOverrides[pageIndex] || {};
  return { ...globalConfig, ...overrides };
}
