# Photos to PDF

A React web app that converts a folder of numbered photos into a styled PDF album with configurable page numbers, fonts, colors, and per-page settings.

## Features

- **Folder import** - Select a folder of images (PNG, JPG, etc.). Files are sorted by the numeric part of the filename (e.g. `001.png` through `100.png`).
- **Live A4 preview** - Browse pages with arrow keys or navigation buttons. Changes are reflected instantly.
- **Page numbers** - Rendered at the bottom of each page with your choice of font, size, and color.
- **Cover pages** - Toggle any page as a "cover" (no page number, excluded from numbering count).
- **Start numbering from page N** - Skip numbering on the first N pages globally.
- **Photo size** - Adjustable via slider (30%-100% of page), globally or per-page.
- **Per-page overrides** - Each page can override: photo size, font, font size, font color, background color, show/hide number, and cover toggle. Each override has a "Reset" button to revert to the global default.
- **Fonts** - Built-in selection (Chopin Script, Papyrus, Dancing Script, Great Vibes, Playfair Display, Cinzel, Cormorant Garamond, Satisfy, Pacifico, Lobster) plus custom TTF/OTF/WOFF font import.
- **Colors** - Preset swatches, hex input, and a native color picker for both background and font color.
- **PDF generation** - Canvas-based rendering at 150 DPI. Each page is rasterized to canvas (preserving custom fonts) then added as JPEG to the PDF. Progress bar shown during generation.
- **Dark theme** UI.

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- jsPDF (PDF generation)
- Google Fonts (CDN for web fonts)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Usage

1. Click **Select Folder** in the sidebar and choose a folder containing your numbered photos.
2. Adjust global settings (font, colors, photo size, numbering start page) in the **Global** tab.
3. Switch to the **This Page** tab to override settings for individual pages.
4. Click the color swatch next to the hex input to open the native color picker.
5. Click **Generate PDF** to export. The PDF will download as `photo-album.pdf`.

## Project Structure

```
src/
  components/
    Sidebar.tsx          - Main sidebar with tabs, PDF generate button, progress bar
    PhotoLoader.tsx      - Folder selection, file reading, numeric sorting
    FontManager.tsx      - Custom font upload via FontFace API
    GlobalSettings.tsx   - Global defaults panel
    PageSettings.tsx     - Per-page override panel with Reset buttons
    ColorPicker.tsx      - Color swatches + hex input + native color picker
    Preview.tsx          - Live A4 preview with page navigation
  store/
    useStore.ts          - Zustand store + resolvePageConfig() helper
  types/
    index.ts             - TypeScript interfaces, defaults, built-in font list, color presets
  utils/
    fontLoader.ts        - Preloads bundled fonts via FontFace API for Canvas compatibility
    pdfGenerator.ts      - Canvas rendering + jsPDF assembly
  App.tsx                - Root layout + keyboard navigation
  App.css                - Full dark theme stylesheet
  main.tsx               - Entry point
public/
  fonts/
    ChopinScript.ttf     - Bundled Chopin Script font
    Papyrus.ttf          - Bundled Papyrus font
```
