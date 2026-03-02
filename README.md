# Photo to PDF

A client-side tool for creating photo albums from images directly into PDFs. Select a folder of photos, customize the layout, preview each page, and generate a styled PDF album -- all in the browser with no server required.

## Features

### Photo Import & Sorting
- **Folder import** -- Select a folder of images (PNG, JPG, etc.)
- **6 sort modes** -- By name (numeric), reverse name, date modified, file size, file type, or random shuffle

### Page Layout & Customization
- **7 page size presets** -- A4, Letter, A3, A5, Square, 4x6 Photo, 5x7 Photo, plus custom dimensions (mm)
- **Draggable elements** -- Drag the image, page number, and title freely within the page preview, with snap guides at common positions
- **Resizable images** -- 8 resize handles: corner handles preserve aspect ratio, edge handles stretch freely
- **Image sizing** -- Unified slider (scales proportionally) + independent W%/H% stepper inputs
- **Aspect-ratio-aware defaults** -- Each photo starts at its natural aspect ratio, fit within the global bounding box. Manual resizing overrides this per-page.
- **Per-page overrides** -- Each page can override: image size/position, font, font size, font color, background color, page number visibility, title, and cover toggle. Each override has a "Reset" button to revert to the global default.

### Page Numbers
- **Configurable numbering** -- Choose font, size, color, and position
- **Cover pages** -- Toggle any page as a "cover" (no page number, excluded from numbering count)
- **Start numbering from page N** -- Skip numbering on the first N pages

### Titles
- **Image titles** -- Show/hide per-page titles with customizable text, font, size, color, and position
- **Auto-generated titles** -- Defaults to the filename (without extension) if no custom title is set

### Fonts & Colors
- **Built-in fonts** -- Chopin Script, Papyrus, Dancing Script, Great Vibes, Playfair Display, Cinzel, Cormorant Garamond, Satisfy, Pacifico, Lobster
- **Custom font import** -- Upload TTF/OTF/WOFF files
- **Color picker** -- Dark-themed popover (react-colorful), preset swatches, and hex input for background, number, and title colors

### PDF Generation
- **Canvas-based rendering** at 150 DPI -- each page is rasterized (preserving custom fonts) then added as JPEG to the PDF
- **Progress bar** shown during generation
- **What you see is what you get** -- the PDF output matches the preview exactly

### UI
- **Dark theme** throughout
- **Live preview** -- Browse pages with arrow keys or navigation buttons; changes are reflected instantly
- **Fully client-side** -- No uploads, no server, everything runs in the browser

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 7
- Zustand (state management)
- jsPDF (PDF generation)
- react-colorful (color picker)
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

1. Click **Select Folder** in the sidebar and choose a folder containing your photos.
2. Adjust global settings (page size, image size, font, colors, numbering) in the **Global** tab.
3. Switch to the **This Page** tab to override settings for individual pages.
4. Drag elements in the preview to reposition them. Drag image corners to resize (preserves aspect ratio) or edges to stretch freely.
5. Click **Generate PDF** to export. The PDF will download as `photo-album.pdf`.

## Project Structure

```
src/
  components/
    Sidebar.tsx          - Main sidebar with tabs, PDF generate button, progress bar
    PhotoLoader.tsx      - Folder selection, file reading, natural dimension detection
    FontManager.tsx      - Custom font upload via FontFace API
    GlobalSettings.tsx   - Global defaults panel
    PageSettings.tsx     - Per-page override panel with Reset buttons
    ColorPicker.tsx      - Dark-themed color popover + swatches + hex input
    Preview.tsx          - Live preview with draggable/resizable elements and snap guides
    StepperInput.tsx     - Typeable numeric stepper input
    FontSelect.tsx       - Font dropdown with "Import Font..." option
  store/
    useStore.ts          - Zustand store + resolvePageConfig() helper
  types/
    index.ts             - TypeScript interfaces, defaults, built-in font list, color presets
  utils/
    fontLoader.ts        - Preloads bundled fonts via FontFace API for Canvas compatibility
    pdfGenerator.ts      - Canvas rendering + jsPDF assembly
    imageFit.ts          - Aspect-ratio-aware image dimension computation
  App.tsx                - Root layout + keyboard navigation
  App.css                - Full dark theme stylesheet
  main.tsx               - Entry point
public/
  fonts/
    ChopinScript.ttf     - Bundled Chopin Script font
    Papyrus.ttf          - Bundled Papyrus font
```
