import { useState } from 'react';
import { useStore, resolvePageConfig } from '../store/useStore';
import { PhotoLoader } from './PhotoLoader';
import { FontManager } from './FontManager';
import { GlobalSettings } from './GlobalSettings';
import { PageSettings } from './PageSettings';
import { generatePDF } from '../utils/pdfGenerator';

type Tab = 'global' | 'page';

export function Sidebar() {
  const [tab, setTab] = useState<Tab>('global');
  const photos = useStore((s) => s.photos);
  const globalConfig = useStore((s) => s.globalConfig);
  const pageOverrides = useStore((s) => s.pageOverrides);
  const numberingStartPage = useStore((s) => s.numberingStartPage);
  const pageSize = useStore((s) => s.pageSize);
  const isGenerating = useStore((s) => s.isGenerating);
  const generationProgress = useStore((s) => s.generationProgress);
  const setIsGenerating = useStore((s) => s.setIsGenerating);
  const setGenerationProgress = useStore((s) => s.setGenerationProgress);

  const handleGenerate = async () => {
    if (photos.length === 0) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Snapshot current state for PDF generation
      const configSnapshot = globalConfig;
      const overridesSnapshot = pageOverrides;
      const pageSizeSnapshot = pageSize;
      const getConfig = (i: number) =>
        resolvePageConfig(configSnapshot, overridesSnapshot, i);

      await generatePDF(
        photos,
        getConfig,
        numberingStartPage,
        pageSizeSnapshot,
        overridesSnapshot,
        (pct, _msg) => {
          setGenerationProgress(pct);
        }
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Check console for details.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1500);
    }
  };

  return (
    <div className="sidebar">
      <h1>Photo to PDF</h1>

      <PhotoLoader />
      <FontManager />

      {/* Tabs */}
      {photos.length > 0 && (
        <>
          <div className="tabs">
            <button
              className={`tab ${tab === 'global' ? 'active' : ''}`}
              onClick={() => setTab('global')}
            >
              Global
            </button>
            <button
              className={`tab ${tab === 'page' ? 'active' : ''}`}
              onClick={() => setTab('page')}
            >
              This Page
            </button>
          </div>

          <div className="tab-content">
            {tab === 'global' ? <GlobalSettings /> : <PageSettings />}
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Progress */}
      {isGenerating && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <div className="progress-text">
            {generationProgress < 100
              ? `Generating... ${generationProgress}%`
              : 'Done!'}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        className="btn btn-primary"
        disabled={photos.length === 0 || isGenerating}
        onClick={handleGenerate}
      >
        {isGenerating ? 'Generating...' : 'Generate PDF'}
      </button>
    </div>
  );
}
