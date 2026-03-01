import { create } from 'zustand';
import type {
  PageConfig,
  PhotoEntry,
  CustomFont,
} from '../types';
import { DEFAULT_PAGE_CONFIG } from '../types';

interface AppState {
  // Photos
  photos: PhotoEntry[];
  setPhotos: (photos: PhotoEntry[]) => void;

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

export const useStore = create<AppState>((set) => ({
  photos: [],
  setPhotos: (photos) => set({ photos, currentPage: 0 }),

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
