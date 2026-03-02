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
  // Separate empty pages from real photos so empty pages keep their positions
  const emptySlots: { index: number; entry: PhotoEntry }[] = [];
  const realPhotos: PhotoEntry[] = [];
  photos.forEach((p, i) => {
    if (p.isEmpty) {
      emptySlots.push({ index: i, entry: p });
    } else {
      realPhotos.push(p);
    }
  });

  // Sort only real photos
  const sorted = [...realPhotos];
  switch (mode) {
    case 'name':
      sorted.sort((a, b) => {
        const numA = a.name.match(/(\d+)/);
        const numB = b.name.match(/(\d+)/);
        const nA = numA ? parseInt(numA[1], 10) : 999999;
        const nB = numB ? parseInt(numB[1], 10) : 999999;
        return nA - nB;
      });
      break;
    case 'reverse-name':
      sorted.sort((a, b) => {
        const numA = a.name.match(/(\d+)/);
        const numB = b.name.match(/(\d+)/);
        const nA = numA ? parseInt(numA[1], 10) : 999999;
        const nB = numB ? parseInt(numB[1], 10) : 999999;
        return nB - nA;
      });
      break;
    case 'date':
      sorted.sort((a, b) => a.lastModified - b.lastModified);
      break;
    case 'size':
      sorted.sort((a, b) => a.fileSize - b.fileSize);
      break;
    case 'random':
      // Fisher-Yates shuffle
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;
    case 'type':
      sorted.sort((a, b) => {
        const extA = a.name.split('.').pop()?.toLowerCase() || '';
        const extB = b.name.split('.').pop()?.toLowerCase() || '';
        if (extA !== extB) return extA.localeCompare(extB);
        return a.name.localeCompare(b.name);
      });
      break;
  }

  // Re-insert empty pages at their original indices (clamped to new length)
  const result = [...sorted];
  for (const slot of emptySlots) {
    const insertAt = Math.min(slot.index, result.length);
    result.splice(insertAt, 0, slot.entry);
  }
  return result;
}

/**
 * Shift all page-override keys above `afterIndex` by `delta` (+1 for insert, -1 for delete).
 */
function shiftOverrides(
  overrides: Record<number, Partial<PageConfig>>,
  afterIndex: number,
  delta: number,
): Record<number, Partial<PageConfig>> {
  const result: Record<number, Partial<PageConfig>> = {};
  for (const [key, value] of Object.entries(overrides)) {
    const idx = Number(key);
    if (idx > afterIndex) {
      result[idx + delta] = value;
    } else {
      result[idx] = value;
    }
  }
  return result;
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

  // Empty page / page management
  insertEmptyPage: (afterIndex: number) => void;
  setPagePhoto: (
    pageIndex: number,
    file: File,
    dataUrl: string,
    naturalWidth: number,
    naturalHeight: number,
  ) => void;
  deletePage: (pageIndex: number) => void;

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

  insertEmptyPage: (afterIndex) =>
    set((s) => {
      const newPhotos = [...s.photos];
      const emptyEntry: PhotoEntry = {
        file: null,
        name: `Empty Page`,
        num: 0,
        dataUrl: '',
        lastModified: Date.now(),
        fileSize: 0,
        naturalWidth: 0,
        naturalHeight: 0,
        isEmpty: true,
      };
      newPhotos.splice(afterIndex + 1, 0, emptyEntry);

      // Shift all overrides with index > afterIndex by +1
      const newOverrides = shiftOverrides(s.pageOverrides, afterIndex, 1);

      // If numberingStartPage is after the insertion point, shift it too
      const newStart =
        s.numberingStartPage > afterIndex
          ? s.numberingStartPage + 1
          : s.numberingStartPage;

      return {
        photos: newPhotos,
        pageOverrides: newOverrides,
        currentPage: afterIndex + 1,
        numberingStartPage: newStart,
      };
    }),

  setPagePhoto: (pageIndex, file, dataUrl, naturalWidth, naturalHeight) =>
    set((s) => {
      const newPhotos = [...s.photos];
      newPhotos[pageIndex] = {
        ...newPhotos[pageIndex],
        file,
        name: file.name,
        dataUrl,
        lastModified: file.lastModified,
        fileSize: file.size,
        naturalWidth,
        naturalHeight,
        isEmpty: false,
      };
      return { photos: newPhotos };
    }),

  deletePage: (pageIndex) =>
    set((s) => {
      if (s.photos.length <= 1) return {}; // don't delete the last page

      const newPhotos = [...s.photos];
      newPhotos.splice(pageIndex, 1);

      // Remove override at pageIndex, then shift all above it by -1
      const withoutDeleted = { ...s.pageOverrides };
      delete withoutDeleted[pageIndex];
      const newOverrides = shiftOverrides(withoutDeleted, pageIndex - 1, -1);

      // Adjust currentPage
      let newCurrent = s.currentPage;
      if (newCurrent >= newPhotos.length) {
        newCurrent = newPhotos.length - 1;
      }

      // Adjust numberingStartPage
      let newStart = s.numberingStartPage;
      if (newStart > pageIndex) {
        newStart = Math.max(0, newStart - 1);
      } else if (newStart === pageIndex && newStart >= newPhotos.length) {
        newStart = Math.max(0, newPhotos.length - 1);
      }

      return {
        photos: newPhotos,
        pageOverrides: newOverrides,
        currentPage: newCurrent,
        numberingStartPage: newStart,
      };
    }),

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
