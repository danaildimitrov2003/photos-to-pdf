import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { useStore } from './store/useStore';
import './App.css';

function App() {
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const currentPage = useStore((s) => s.currentPage);
  const photos = useStore((s) => s.photos);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
      if (e.key === 'ArrowRight' && currentPage < photos.length - 1) {
        setCurrentPage(currentPage + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, photos.length, setCurrentPage]);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Preview />
      </main>
    </div>
  );
}

export default App;
