import { useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { PhotoEntry } from '../types';

export function PhotoLoader() {
  const setPhotos = useStore((s) => s.setPhotos);
  const photos = useStore((s) => s.photos);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList) => {
      const imageFiles = Array.from(files).filter((f) =>
        /\.(png|jpg|jpeg)$/i.test(f.name)
      );

      if (imageFiles.length === 0) return;

      const sorted = imageFiles
        .map((f) => {
          const match = f.name.match(/(\d+)/);
          return {
            file: f,
            name: f.name,
            num: match ? parseInt(match[1], 10) : 999999,
            dataUrl: '',
          };
        })
        .sort((a, b) => a.num - b.num);

      let loaded = 0;
      sorted.forEach((item, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          sorted[idx].dataUrl = ev.target?.result as string;
          loaded++;
          if (loaded === sorted.length) {
            setPhotos(sorted as PhotoEntry[]);
          }
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
        accept="image/png,image/jpeg,image/jpg"
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
    </div>
  );
}
