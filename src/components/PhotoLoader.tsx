import { useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { PhotoEntry, SortMode } from '../types';

const SORT_LABELS: Record<SortMode, string> = {
  'name': 'Name (numeric)',
  'reverse-name': 'Name (reverse)',
  'date': 'Date modified',
  'size': 'File size',
  'random': 'Random',
  'type': 'File type',
};

export function PhotoLoader() {
  const setPhotos = useStore((s) => s.setPhotos);
  const photos = useStore((s) => s.photos);
  const sortMode = useStore((s) => s.sortMode);
  const setSortMode = useStore((s) => s.setSortMode);
  const folderInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
    (files: FileList) => {
      const imageFiles = Array.from(files).filter((f) =>
        /\.(png|jpg|jpeg|webp|bmp|gif)$/i.test(f.name)
      );

      if (imageFiles.length === 0) return;

      const entries: PhotoEntry[] = imageFiles.map((f) => {
        const match = f.name.match(/(\d+)/);
        return {
          file: f,
          name: f.name,
          num: match ? parseInt(match[1], 10) : 999999,
          dataUrl: '',
          lastModified: f.lastModified,
          fileSize: f.size,
          naturalWidth: 0,
          naturalHeight: 0,
        };
      });

      let loaded = 0;
      entries.forEach((item, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          entries[idx].dataUrl = dataUrl;

          // Read natural dimensions
          const img = new Image();
          img.onload = () => {
            entries[idx].naturalWidth = img.naturalWidth;
            entries[idx].naturalHeight = img.naturalHeight;
            loaded++;
            if (loaded === entries.length) {
              setPhotos(entries);
            }
          };
          img.onerror = () => {
            // Fallback: set 1:1 if we can't read dimensions
            entries[idx].naturalWidth = 1;
            entries[idx].naturalHeight = 1;
            loaded++;
            if (loaded === entries.length) {
              setPhotos(entries);
            }
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(item.file);
      });
    },
    [setPhotos]
  );

  return (
    <div className="section">
      <span className="section-label">Photos</span>
      <button
        className="btn"
        onClick={() => folderInputRef.current?.click()}
      >
        Select Photo Folder
      </button>
      <input
        ref={folderInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/gif"
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className={`file-info ${photos.length > 0 ? 'has-files' : ''}`}>
        {photos.length > 0
          ? `${photos.length} photos loaded`
          : 'No photos selected'}
      </div>

      {photos.length > 0 && (
        <div className="sort-options">
          <span className="section-label">Sort By</span>
          <div className="sort-row">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
            {sortMode === 'random' && (
              <button
                className="btn btn-sm"
                onClick={() => setSortMode('random')}
                title="Re-shuffle"
              >
                Reshuffle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
